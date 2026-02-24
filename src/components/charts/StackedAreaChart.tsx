'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { POOL_CONFIGS } from '@/lib/constants';
import { formatUsd, formatDate } from '@/lib/utils';
import TimeFilter from '@/components/TimeFilter';
import Watermark from './Watermark';

interface StackedAreaChartProps {
  data: Array<Record<string, unknown>>;
  symbols: string[];
  title: string;
  valueKey: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const valid = payload.filter((p: any) => p.value > 0).sort((a: any, b: any) => b.value - a.value);
    return (
      <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-3 shadow-2xl max-h-[200px] max-w-[300px] overflow-y-auto custom-scrollbar">
        <p className="mb-2 text-xs font-semibold text-zinc-300 border-b border-white/10 pb-1">{formatDate(String(label))}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {valid.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-2 text-[10px]">
              <div className="flex items-center gap-1.5 truncate">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-400 truncate max-w-[60px]" title={entry.name}>{entry.name}</span>
              </div>
              <span className="font-medium text-white shrink-0">{formatUsd(entry.value, true)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function StackedAreaChart({
  data,
  symbols,
  title,
  valueKey,
}: StackedAreaChartProps) {
  const [days, setDays] = useState(30);
  const filteredData = data.slice(-days);
  if (filteredData.length <= 1) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>
        <div className="flex h-64 items-center justify-center text-zinc-600">
          {filteredData.length === 0 ? "No data yet — run cron jobs to collect snapshots" : "Need at least 2 days of data to visualize trends"}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 hover:border-white/10 hover:bg-black/50 relative overflow-hidden">
      <Watermark />
      <div className="mb-4 flex items-center justify-between relative z-10">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        <TimeFilter value={days} onChange={setDays} />
      </div>
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={filteredData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              {symbols.map((symbol) => (
                <linearGradient key={`color${symbol}`} id={`color${symbol}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={POOL_CONFIGS[symbol]?.color ?? '#666'} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={POOL_CONFIGS[symbol]?.color ?? '#666'} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDate(v)}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#ffffff10' }}
            />
            <YAxis
              tickFormatter={(v) => formatUsd(v, true)}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#ffffff10' }}
              width={70}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
            />
            {symbols.map((symbol) => (
              <Area
                key={symbol}
                type="monotone"
                dataKey={`${symbol}_${valueKey}`}
                stackId="1"
                stroke={POOL_CONFIGS[symbol]?.color ?? '#666'}
                strokeWidth={2}
                fill={`url(#color${symbol})`}
                fillOpacity={1}
                name={symbol}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
