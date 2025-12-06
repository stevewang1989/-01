import React, { useState } from 'react';
import { BinanceCreds } from '../types';
import { Key, Lock, Settings, Globe, Server } from 'lucide-react';

interface LoginModalProps {
  onLogin: (creds: BinanceCreds) => void;
  onDemoLogin: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onDemoLogin }) => {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  // CHANGED: Default to PUBLIC because local IP is likely blocked by Binance
  const [proxyMode, setProxyMode] = useState<'LOCAL' | 'PUBLIC' | 'NONE'>('PUBLIC');
  const [customProxyUrl, setCustomProxyUrl] = useState('https://corsproxy.io/?');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey || !apiSecret) return;
    setIsLoading(true);

    // Determine the proxy value to pass
    let finalProxyUrl: string | undefined;
    if (proxyMode === 'LOCAL') {
        finalProxyUrl = 'LOCAL_PROXY';
    } else if (proxyMode === 'PUBLIC') {
        finalProxyUrl = customProxyUrl;
    }
    // If NONE, undefined

    setTimeout(() => {
      onLogin({ apiKey, apiSecret, proxyUrl: finalProxyUrl });
      setIsLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-binance-dark px-4 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-binance-yellow/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-binance-black border border-binance-gray/30 rounded-2xl shadow-2xl p-8 z-10">
        <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-binance-yellow/10 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-binance-yellow" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0106l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6355-2.7175-2.7155 7.353-7.3288z"/>
                    </svg>
                </div>
            </div>
          <h1 className="text-3xl font-bold text-white mb-2">Binance Tracker</h1>
          <p className="text-binance-gray text-sm">Real-time Portfolio & Market Data</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Key size={14} /> API Key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-binance-dark border border-binance-gray/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-binance-yellow transition-colors placeholder-gray-600"
              placeholder="Enter your public API key"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Lock size={14} /> API Secret
            </label>
            <input
              type="password"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              className="w-full bg-binance-dark border border-binance-gray/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-binance-yellow transition-colors placeholder-gray-600"
              placeholder="Enter your secret key"
            />
          </div>

          {/* Connection Method Settings */}
          <div className="pt-2 bg-binance-dark/50 rounded-lg p-3 border border-binance-gray/30">
             <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-xs text-gray-400 hover:text-white transition-colors"
             >
                <span className="flex items-center gap-2">
                    <Settings size={14} /> Connection Method
                </span>
                <span className="text-binance-yellow font-bold">
                    {proxyMode === 'LOCAL' ? 'Local Vite Proxy' : proxyMode === 'PUBLIC' ? 'Public Proxy' : 'Direct'}
                </span>
             </button>

             {/* Always show advanced if public is selected so user sees the URL */}
             {(showAdvanced || proxyMode === 'PUBLIC') && (
                <div className="mt-4 space-y-4 animate-fade-in border-t border-binance-gray/20 pt-4">
                    
                    {/* Mode Selection */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                            <input 
                                type="radio" 
                                name="proxyMode" 
                                checked={proxyMode === 'PUBLIC'} 
                                onChange={() => setProxyMode('PUBLIC')}
                                className="text-binance-yellow focus:ring-binance-yellow"
                            />
                            <div>
                                <div className="text-white text-sm font-medium flex items-center gap-2">
                                    <Globe size={14} className="text-blue-500"/> Public Proxy (Recommended)
                                </div>
                                <div className="text-gray-500 text-[10px]">Bypasses cloud IP blocks. Best for online IDEs.</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                            <input 
                                type="radio" 
                                name="proxyMode" 
                                checked={proxyMode === 'LOCAL'} 
                                onChange={() => setProxyMode('LOCAL')}
                                className="text-binance-yellow focus:ring-binance-yellow"
                            />
                            <div>
                                <div className="text-white text-sm font-medium flex items-center gap-2">
                                    <Server size={14} className="text-green-500"/> Local Dev Proxy
                                </div>
                                <div className="text-gray-500 text-[10px]">Uses local Vite server. May be blocked in cloud.</div>
                            </div>
                        </label>

                        <label className="flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer">
                            <input 
                                type="radio" 
                                name="proxyMode" 
                                checked={proxyMode === 'NONE'} 
                                onChange={() => setProxyMode('NONE')}
                                className="text-binance-yellow focus:ring-binance-yellow"
                            />
                            <div>
                                <div className="text-white text-sm font-medium">Direct Connection</div>
                                <div className="text-gray-500 text-[10px]">Requires browser extension (CORS).</div>
                            </div>
                        </label>
                    </div>

                    {/* Custom URL Input for Public Proxy */}
                    {proxyMode === 'PUBLIC' && (
                        <div className="pl-6">
                            <label className="text-xs text-gray-400 block mb-1">Proxy URL Service</label>
                            <input
                                type="text"
                                value={customProxyUrl}
                                onChange={(e) => setCustomProxyUrl(e.target.value)}
                                className="w-full bg-binance-black border border-binance-gray/50 rounded px-3 py-2 text-white text-xs"
                            />
                        </div>
                    )}
                </div>
             )}
          </div>

          <button
            type="submit"
            disabled={!apiKey || !apiSecret || isLoading}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-all duration-200 ${
              !apiKey || !apiSecret
                ? 'bg-binance-gray/50 text-gray-400 cursor-not-allowed'
                : 'bg-binance-yellow text-binance-black hover:bg-[#F0B90B] hover:shadow-lg hover:shadow-binance-yellow/20'
            }`}
          >
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-binance-gray/30 text-center">
            <button 
                onClick={onDemoLogin}
                className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 w-full transition-colors"
            >
                Start Demo Mode
            </button>
        </div>
      </div>
    </div>
  );
};
