import React, { useState, useEffect } from 'react';
import { AccountInfo, OrderParams, TickerData } from '../types';
import { ArrowLeftRight, Wallet } from 'lucide-react';

interface TradingPanelProps {
  selectedSymbol: string; // e.g. 'BTC'
  prices: Record<string, TickerData>;
  account: AccountInfo | null;
  onTrade: (params: OrderParams) => Promise<void>;
  isLoading: boolean;
}

export const TradingPanel: React.FC<TradingPanelProps> = ({ selectedSymbol, prices, account, onTrade, isLoading }) => {
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'LIMIT' | 'MARKET'>('LIMIT');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  
  const pair = `${selectedSymbol}USDT`;
  const currentPrice = prices[pair]?.c ? parseFloat(prices[pair].c) : 0;

  // Auto-fill price for LIMIT orders when switching or price updates
  useEffect(() => {
    if (orderType === 'LIMIT' && currentPrice > 0 && !price) {
      setPrice(currentPrice.toString());
    }
  }, [currentPrice, orderType]);

  // Calculate available balance
  const getAvailableBalance = () => {
    if (!account) return 0;
    if (side === 'BUY') {
      const usdt = account.balances.find(b => b.asset === 'USDT');
      return usdt ? parseFloat(usdt.free) : 0;
    } else {
      const asset = account.balances.find(b => b.asset === selectedSymbol);
      return asset ? parseFloat(asset.free) : 0;
    }
  };

  const available = getAvailableBalance();
  const total = (parseFloat(quantity) || 0) * (orderType === 'LIMIT' ? (parseFloat(price) || 0) : currentPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTrade({
      symbol: pair,
      side,
      type: orderType,
      quantity,
      price: orderType === 'LIMIT' ? price : undefined,
      timeInForce: 'GTC'
    });
  };

  return (
    <div className="bg-binance-black border border-binance-gray/30 rounded-xl p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowLeftRight size={20} className="text-binance-yellow"/> Spot Trade
        </h3>
        <span className="text-xs font-mono text-gray-500">{pair}</span>
      </div>

      {/* Buy/Sell Tabs */}
      <div className="flex bg-binance-dark rounded-lg p-1 mb-6">
        <button 
          onClick={() => setSide('BUY')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${side === 'BUY' ? 'bg-[#0ECB81] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          BUY {selectedSymbol}
        </button>
        <button 
          onClick={() => setSide('SELL')}
          className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${side === 'SELL' ? 'bg-[#F6465D] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
        >
          SELL {selectedSymbol}
        </button>
      </div>

      {/* Available Balance */}
      <div className="flex justify-between text-xs text-gray-400 mb-4 px-1">
        <span className="flex items-center gap-1"><Wallet size={12}/> Avbl</span>
        <span className="font-mono text-white">
            {available.toFixed(side === 'BUY' ? 2 : 6)} {side === 'BUY' ? 'USDT' : selectedSymbol}
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
        {/* Order Type */}
        <div className="grid grid-cols-2 gap-2 text-xs mb-2">
            <label className={`cursor-pointer text-center py-1 rounded border ${orderType === 'LIMIT' ? 'border-binance-yellow text-binance-yellow bg-binance-yellow/10' : 'border-binance-gray/30 text-gray-400'}`}>
                <input type="radio" name="type" className="hidden" checked={orderType === 'LIMIT'} onChange={() => setOrderType('LIMIT')} />
                Limit
            </label>
            <label className={`cursor-pointer text-center py-1 rounded border ${orderType === 'MARKET' ? 'border-binance-yellow text-binance-yellow bg-binance-yellow/10' : 'border-binance-gray/30 text-gray-400'}`}>
                <input type="radio" name="type" className="hidden" checked={orderType === 'MARKET'} onChange={() => setOrderType('MARKET')} />
                Market
            </label>
        </div>

        {/* Price Input (Limit only) */}
        {orderType === 'LIMIT' && (
            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Price</span>
                <input 
                    type="number" 
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-binance-dark border border-binance-gray/30 rounded-lg py-3 pl-12 pr-12 text-right text-white font-mono text-sm focus:border-binance-yellow focus:outline-none"
                    placeholder="0.00"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">USDT</span>
            </div>
        )}

        {/* Market Price Display */}
        {orderType === 'MARKET' && (
            <div className="bg-binance-dark/50 border border-binance-gray/30 rounded-lg py-3 text-center text-gray-400 text-sm italic">
                Market Price
            </div>
        )}

        {/* Quantity Input */}
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">Amount</span>
            <input 
                type="number" 
                step="0.00001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full bg-binance-dark border border-binance-gray/30 rounded-lg py-3 pl-16 pr-12 text-right text-white font-mono text-sm focus:border-binance-yellow focus:outline-none"
                placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">{selectedSymbol}</span>
        </div>

        {/* Percentage Sliders (Optional helper) */}
        <div className="flex justify-between gap-2 mt-1">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
                <button 
                    key={pct}
                    type="button"
                    onClick={() => {
                        if(side === 'BUY') {
                            const priceToUse = parseFloat(price) || currentPrice;
                            if(priceToUse > 0) setQuantity(((available * pct) / priceToUse).toFixed(5));
                        } else {
                            setQuantity((available * pct).toFixed(5));
                        }
                    }}
                    className="flex-1 bg-binance-dark/50 hover:bg-binance-gray/30 text-[10px] text-gray-400 rounded py-1 transition-colors"
                >
                    {pct * 100}%
                </button>
            ))}
        </div>

        {/* Total Estimate */}
        <div className="flex justify-between items-center text-xs mt-2">
            <span className="text-gray-400">Est. Total</span>
            <span className="text-white font-mono">{total.toLocaleString(undefined, {maximumFractionDigits: 2})} USDT</span>
        </div>

        <button 
            type="submit"
            disabled={isLoading || !quantity || parseFloat(quantity) <= 0 || (orderType === 'LIMIT' && !price)}
            className={`w-full py-3 rounded-lg font-bold text-sm mt-auto uppercase transition-all ${
                side === 'BUY' 
                ? 'bg-[#0ECB81] hover:bg-[#0ECB81]/90 text-white shadow-[#0ECB81]/20' 
                : 'bg-[#F6465D] hover:bg-[#F6465D]/90 text-white shadow-[#F6465D]/20'
            } shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
        >
            {isLoading ? 'Processing...' : `${side} ${selectedSymbol}`}
        </button>
      </form>
    </div>
  );
};
