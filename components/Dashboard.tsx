import React, { useEffect, useState } from 'react';
import { AccountInfo, TickerData, AssetBalance, KlineData, OrderParams } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, LogOut, Bitcoin, BarChart2 } from 'lucide-react';
import { PriceChart } from './PriceChart';
import { TradingPanel } from './TradingPanel';

interface DashboardProps {
  account: AccountInfo | null;
  prices: Record<string, TickerData>;
  history: { BTC: KlineData[], ETH: KlineData[] };
  onLogout: () => void;
  onTrade: (params: OrderParams) => Promise<void>;
  isDemo: boolean;
}

// Helper to calculate total value
const calculateTotalBalance = (balances: AssetBalance[], prices: Record<string, TickerData>) => {
  let totalUSDT = 0;
  
  balances.forEach(b => {
    const amount = parseFloat(b.free) + parseFloat(b.locked);
    if (amount <= 0) return;

    if (b.asset === 'USDT') {
      totalUSDT += amount;
    } else {
      const ticker = prices[`${b.asset}USDT`];
      if (ticker) {
        totalUSDT += amount * parseFloat(ticker.c);
      }
    }
  });
  return totalUSDT;
};

// Colors for the chart
const COLORS = ['#FCD535', '#0ECB81', '#F6465D', '#5E6673', '#848E9C', '#EAECEF'];

export const Dashboard: React.FC<DashboardProps> = ({ account, prices, history, onLogout, onTrade, isDemo }) => {
  const [totalBalance, setTotalBalance] = useState(0);
  const [assetAllocation, setAssetAllocation] = useState<any[]>([]);
  const [selectedChart, setSelectedChart] = useState<'BTC' | 'ETH'>('BTC');
  const [isTrading, setIsTrading] = useState(false);

  useEffect(() => {
    if (account && prices) {
      const total = calculateTotalBalance(account.balances, prices);
      setTotalBalance(total);

      // Prepare chart data
      const data = account.balances
        .map(b => {
          const amount = parseFloat(b.free) + parseFloat(b.locked);
          let usdtValue = 0;
          if (b.asset === 'USDT') usdtValue = amount;
          else {
            const ticker = prices[`${b.asset}USDT`];
            if (ticker) usdtValue = amount * parseFloat(ticker.c);
          }
          return {
            name: b.asset,
            value: usdtValue,
            amount: amount
          };
        })
        .filter(item => item.value > 0) // Show all assets > 0
        .sort((a, b) => b.value - a.value); 

      setAssetAllocation(data);
    }
  }, [account, prices]);

  const btcPrice = prices['BTCUSDT'] ? parseFloat(prices['BTCUSDT'].c) : 0;
  const ethPrice = prices['ETHUSDT'] ? parseFloat(prices['ETHUSDT'].c) : 0;
  const btcChange = prices['BTCUSDT'] ? parseFloat(prices['BTCUSDT'].P) : 0;
  const ethChange = prices['ETHUSDT'] ? parseFloat(prices['ETHUSDT'].P) : 0;

  const btcValue = btcPrice > 0 ? totalBalance / btcPrice : 0;

  const handleTradeWrapper = async (params: OrderParams) => {
      setIsTrading(true);
      try {
          await onTrade(params);
      } finally {
          setIsTrading(false);
      }
  };

  return (
    <div className="min-h-screen bg-binance-dark pb-12">
      {/* Header */}
      <nav className="bg-binance-black border-b border-binance-gray/30 px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
             <svg className="w-8 h-8 text-binance-yellow" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0106l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6355-2.7175-2.7155 7.353-7.3288z"/>
             </svg>
            <h1 className="text-xl font-bold text-white hidden sm:block">Binance <span className="text-binance-gray font-normal">Dashboard</span></h1>
            {isDemo && <span className="bg-binance-yellow text-binance-black text-xs font-bold px-2 py-0.5 rounded">DEMO MODE</span>}
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        
        {/* Tickers & Chart Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Ticker Cards (Left Col) */}
            <div className="space-y-4 lg:col-span-1">
                {/* BTC Ticker */}
                <div 
                    onClick={() => setSelectedChart('BTC')}
                    className={`bg-binance-black border rounded-xl p-5 cursor-pointer transition-all ${selectedChart === 'BTC' ? 'border-binance-yellow shadow-lg shadow-binance-yellow/5' : 'border-binance-gray/30 hover:border-binance-gray/60'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#F7931A]/20 p-2 rounded-full">
                                <Bitcoin className="text-[#F7931A]" size={20} />
                            </div>
                            <span className="text-sm font-bold text-gray-400">BTC/USDT</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${btcChange >= 0 ? 'bg-[#0ECB81]/10 text-[#0ECB81]' : 'bg-[#F6465D]/10 text-[#F6465D]'}`}>
                            24h
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        ${btcPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-medium flex items-center gap-1 ${btcChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {btcChange >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        {btcChange.toFixed(2)}%
                    </div>
                </div>

                {/* ETH Ticker */}
                <div 
                    onClick={() => setSelectedChart('ETH')}
                    className={`bg-binance-black border rounded-xl p-5 cursor-pointer transition-all ${selectedChart === 'ETH' ? 'border-binance-yellow shadow-lg shadow-binance-yellow/5' : 'border-binance-gray/30 hover:border-binance-gray/60'}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="bg-[#627EEA]/20 p-2 rounded-full">
                                <svg className="w-5 h-5 text-[#627EEA]" viewBox="0 0 32 32" fill="currentColor">
                                    <path d="M16 32C7.163 32 0 24.837 0 16S7.163 0 16 0s16 7.163 16 16-7.163 16-16 16zm7.994-15.781L16.498 4 9 16.22l7.498 4.353 7.496-4.354zM24 17.616l-7.502 4.351L9 17.617l7.498 10.378L24 17.616z"/>
                                </svg>
                            </div>
                            <span className="text-sm font-bold text-gray-400">ETH/USDT</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded ${ethChange >= 0 ? 'bg-[#0ECB81]/10 text-[#0ECB81]' : 'bg-[#F6465D]/10 text-[#F6465D]'}`}>
                            24h
                        </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">
                        ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-sm font-medium flex items-center gap-1 ${ethChange >= 0 ? 'text-[#0ECB81]' : 'text-[#F6465D]'}`}>
                        {ethChange >= 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        {ethChange.toFixed(2)}%
                    </div>
                </div>
            </div>

            {/* Chart Area (Middle) */}
            <div className="lg:col-span-2 bg-binance-black border border-binance-gray/30 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <BarChart2 size={20} className="text-binance-yellow"/>
                        Market Overview <span className="text-gray-500 text-sm font-normal">({selectedChart} 24h)</span>
                    </h3>
                </div>
                <PriceChart 
                    data={selectedChart === 'BTC' ? history.BTC : history.ETH} 
                    symbol={selectedChart}
                    color={selectedChart === 'BTC' ? '#F7931A' : '#627EEA'}
                />
            </div>

            {/* Trading Panel (Right) */}
            <div className="lg:col-span-1">
                <TradingPanel 
                    selectedSymbol={selectedChart}
                    prices={prices}
                    account={account}
                    onTrade={handleTradeWrapper}
                    isLoading={isTrading}
                />
            </div>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Balance Card */}
            <div className="lg:col-span-2 space-y-8">
                <div className="bg-binance-black border border-binance-gray/30 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-binance-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="flex items-center gap-2 mb-2 text-gray-400">
                        <Wallet size={18} />
                        <span className="text-sm font-medium">Estimated Balance</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
                            ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-sm text-gray-400">USDT</span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 font-mono">
                        ≈ {btcValue.toFixed(8)} BTC
                    </div>

                    <div className="mt-8">
                        <h3 className="text-sm font-bold text-gray-300 mb-4 uppercase tracking-wider">Your Assets</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-binance-gray/20">
                                        <th className="pb-3 font-medium text-xs text-gray-500 uppercase">Asset</th>
                                        <th className="pb-3 font-medium text-xs text-gray-500 uppercase text-right">Balance</th>
                                        <th className="pb-3 font-medium text-xs text-gray-500 uppercase text-right">Price</th>
                                        <th className="pb-3 font-medium text-xs text-gray-500 uppercase text-right">Value (USDT)</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {account ? (
                                        assetAllocation.length > 0 ? (
                                            assetAllocation.map((item, idx) => {
                                                const currentPrice = item.name === 'USDT' ? 1 : prices[`${item.name}USDT`]?.c || 0;
                                                return (
                                                    <tr key={item.name} className="border-b border-binance-gray/10 hover:bg-white/5 transition-colors">
                                                        <td className="py-4 font-bold text-white">{item.name}</td>
                                                        <td className="py-4 text-right text-gray-300 font-mono">{parseFloat(item.amount).toFixed(4)}</td>
                                                        <td className="py-4 text-right text-gray-400 font-mono">
                                                            ${parseFloat(currentPrice.toString()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="py-4 text-right font-bold text-white">
                                                            ${item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-gray-500 text-sm">
                                                    Wallet is empty (Spot Account).
                                                </td>
                                            </tr>
                                        )
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-gray-500 text-sm animate-pulse">
                                                Loading assets...
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Allocation Chart */}
            <div className="bg-binance-black border border-binance-gray/30 rounded-2xl p-6 flex flex-col">
                <h3 className="text-sm font-bold text-gray-300 mb-6 uppercase tracking-wider flex items-center gap-2">
                    <PieChartIcon size={16}/> Allocation
                </h3>
                <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
                    {assetAllocation.length > 0 ? (
                         <ResponsiveContainer width="100%" height={300}>
                         <PieChart>
                           <Pie
                             data={assetAllocation}
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={5}
                             dataKey="value"
                             stroke="none"
                           >
                             {assetAllocation.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                             ))}
                           </Pie>
                           <Tooltip 
                                formatter={(value: number) => `$${value.toLocaleString()}`}
                                contentStyle={{ backgroundColor: '#1E2329', borderColor: '#474D57', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                           />
                         </PieChart>
                       </ResponsiveContainer>
                    ) : (
                        <div className="text-gray-500 text-sm">No assets to chart</div>
                    )}
                    {/* Center Text */}
                    {assetAllocation.length > 0 && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="block text-2xl font-bold text-white">{assetAllocation.length}</span>
                            <span className="block text-xs text-gray-500 uppercase">Assets</span>
                        </div>
                    )}
                </div>
                {/* Legend */}
                <div className="mt-6 space-y-2">
                    {assetAllocation.slice(0, 5).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-gray-300">{item.name}</span>
                            </div>
                            <span className="text-gray-400 font-mono">
                                {((item.value / (totalBalance || 1)) * 100).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

// Simple icon wrapper to avoid huge imports
const PieChartIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
);
