import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { KlineData } from '../types';

interface PriceChartProps {
  data: KlineData[];
  symbol: string;
  color: string;
}

export const PriceChart: React.FC<PriceChartProps> = ({ data, symbol, color }) => {
  if (!data || data.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center text-gray-500">Loading Chart Data...</div>;
  }

  const latestPrice = data[data.length - 1].close;
  const startPrice = data[0].close;
  const isPositive = latestPrice >= startPrice;
  const chartColor = isPositive ? '#0ECB81' : '#F6465D';

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`color${symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2B3139" vertical={false} />
          <XAxis 
            dataKey="time" 
            tickFormatter={(tick) => new Date(tick).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            stroke="#848E9C"
            tick={{fontSize: 10}}
            minTickGap={30}
          />
          <YAxis 
            domain={['auto', 'auto']} 
            orientation="right"
            stroke="#848E9C"
            tick={{fontSize: 10}}
            tickFormatter={(number) => `$${number.toLocaleString()}`}
            width={60}
          />
          <Tooltip 
            contentStyle={{backgroundColor: '#1E2329', borderColor: '#474D57', color: '#fff'}}
            itemStyle={{color: '#fff'}}
            labelFormatter={(label) => new Date(label).toLocaleString()}
            formatter={(value: number) => [`$${value.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 'Price']}
          />
          <Area 
            type="monotone" 
            dataKey="close" 
            stroke={chartColor} 
            fillOpacity={1} 
            fill={`url(#color${symbol})`} 
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
