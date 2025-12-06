import React, { useState, useEffect, useRef } from 'react';
import { BinanceCreds, AppState, AccountInfo, TickerData, KlineData, OrderParams } from './types';
import { BinanceService, MOCK_ACCOUNT_INFO, generateMockHistory } from './services/binanceService';
import { LoginModal } from './components/LoginModal';
import { Dashboard } from './components/Dashboard';
import { Info, AlertCircle, CheckCircle } from 'lucide-react';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [creds, setCreds] = useState<BinanceCreds | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [prices, setPrices] = useState<Record<string, TickerData>>({});
  const [history, setHistory] = useState<{BTC: KlineData[], ETH: KlineData[]}>({ BTC: [], ETH: [] });
  const [isDemo, setIsDemo] = useState(false);
  const [notification, setNotification] = useState<{msg: string, type: 'error' | 'info' | 'success'} | null>(null);
  
  const serviceRef = useRef<BinanceService | null>(null);
  const cleanupWsRef = useRef<(() => void) | null>(null);

  // Clear notification after 7 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    if (appState === AppState.DASHBOARD) {
        if (!serviceRef.current) {
            serviceRef.current = new BinanceService(creds || undefined);
        }

        // 1. Start Price Stream
        const cleanup = serviceRef.current.connectTickerStream(
            ['btcusdt', 'ethusdt', 'bnbusdt', 'solusdt', 'adausdt', 'xrpusdt', 'dogeusdt'], 
            (data: any) => {
                const ticker: TickerData = { s: data.s, c: data.c, p: data.p, P: data.P };
                setPrices(prev => ({ ...prev, [ticker.s]: ticker }));
            }
        );
        cleanupWsRef.current = cleanup;

        // 2. Fetch Account Data & Historical Prices
        const fetchData = async () => {
            if (isDemo) {
                setAccount(MOCK_ACCOUNT_INFO);
                // Real-ish market history
                setHistory({
                    BTC: generateMockHistory(92000),
                    ETH: generateMockHistory(3100)
                });
            } else {
                try {
                    // Fetch Account
                    const accountData = await serviceRef.current!.getAccountInfo();
                    setAccount(accountData);
                    setNotification({ msg: "Connected successfully!", type: 'info' });

                    // Fetch History (parallel)
                    try {
                        const [btcHist, ethHist] = await Promise.all([
                            serviceRef.current!.getHistoricalPrices('BTCUSDT', '1h', 24),
                            serviceRef.current!.getHistoricalPrices('ETHUSDT', '1h', 24)
                        ]);
                        setHistory({ BTC: btcHist, ETH: ethHist });
                    } catch (hErr) {
                        console.error("History fetch failed", hErr);
                    }

                } catch (error: any) {
                    console.error("Login Failed:", error);
                    
                    setNotification({ 
                        msg: error.message || "Failed to fetch data. Check console.", 
                        type: 'error' 
                    });

                    if (error.message.includes("API Key") || error.message.includes("Timestamp")) {
                        setAppState(AppState.LOGIN);
                        setCreds(null);
                    } else {
                        // If it's network/CORS error, fallback to empty data but stay on dashboard so user can try again
                        setAccount(null);
                        setNotification({ 
                            msg: `Connection Warning: ${error.message}. Try refreshing or check proxy.`, 
                            type: 'error' 
                        });
                    }
                }
            }
        };

        fetchData();
    }

    return () => {
        if (cleanupWsRef.current) {
            cleanupWsRef.current();
            cleanupWsRef.current = null;
        }
        serviceRef.current = null;
    };
  }, [appState, creds, isDemo]);

  const handleLogin = (credentials: BinanceCreds) => {
    setCreds(credentials);
    setIsDemo(false);
    setAppState(AppState.DASHBOARD);
  };

  const handleDemoLogin = () => {
    setCreds(null);
    setIsDemo(true);
    setAppState(AppState.DASHBOARD);
  };

  const handleLogout = () => {
    setAppState(AppState.LOGIN);
    setCreds(null);
    setAccount(null);
    setPrices({});
    setHistory({BTC: [], ETH: []});
    setIsDemo(false);
    setNotification(null);
  };

  const handleTrade = async (params: OrderParams) => {
    if(isDemo) {
        setNotification({ msg: "Demo Mode: Order simulated successfully!", type: 'success' });
        return;
    }

    try {
        const res = await serviceRef.current!.placeOrder(params);
        console.log("Order Result", res);
        setNotification({ msg: `Order Successful: ${res.side} ${res.symbol} Executed`, type: 'success' });
        
        // Refresh account after trade
        const updatedAccount = await serviceRef.current!.getAccountInfo();
        setAccount(updatedAccount);
    } catch(e: any) {
        setNotification({ msg: `Trade Failed: ${e.message}`, type: 'error' });
    }
  };

  return (
    <div className="relative">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-10 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-xl flex items-center gap-3 animate-fade-in-down max-w-[90vw] border ${notification.type === 'error' ? 'bg-red-900/90 border-red-500 text-white' : notification.type === 'success' ? 'bg-[#0ECB81]/90 border-[#0ECB81] text-white' : 'bg-blue-600/90 border-blue-400 text-white'}`}>
          {notification.type === 'error' ? <AlertCircle size={20} /> : notification.type === 'success' ? <CheckCircle size={20} /> : <Info size={20} />}
          <span className="text-sm font-medium">{notification.msg}</span>
          <button 
            onClick={() => setNotification(null)}
            className="ml-2 hover:bg-white/20 rounded-full p-1"
          >
            ✕
          </button>
        </div>
      )}

      {appState === AppState.LOGIN && (
        <LoginModal onLogin={handleLogin} onDemoLogin={handleDemoLogin} />
      )}
      {appState === AppState.DASHBOARD && (
        <Dashboard 
          account={account} 
          prices={prices} 
          history={history}
          onLogout={handleLogout}
          onTrade={handleTrade}
          isDemo={isDemo} 
        />
      )}
    </div>
  );
}

export default App;
