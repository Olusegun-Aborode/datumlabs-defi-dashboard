'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate, formatUsd } from '@/lib/utils';
import Watermark from './Watermark';

interface SimpleBarChartProps {
  data: Array<{ date: string; value: number }>;
  title: string;
  color?: string;
}

export default function SimpleBarChart({
  data,
  title,
  color = '#EF4444',
}: SimpleBarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPayload = payload[0].payload;
      const totalValue = payload[0].value;
      const symbols = Object.keys(dataPayload).filter((k) => k !== 'date' && k !== 'value' && k !== 'totalUsd');

      return (
        <div className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-xl p-4 shadow-2xl min-w-[200px]">
          <p className="mb-3 text-sm font-semibold text-zinc-300 border-b border-white/10 pb-2">{formatDate(String(label))}</p>
          <div className="space-y-2 mb-3">
            {symbols.length > 0 ? (
              symbols.map((symbol) => {
                const val = dataPayload[symbol];
                if (val <= 0) return null;
                return (
                  <div key={symbol} className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">{symbol}</span>
                    <span className="text-zinc-200 font-medium">{formatUsd(val, true)}</span>
                  </div>
                );
              })
            ) : null}
          </div>
          <div className="pt-2 border-t border-white/10 flex justify-between items-center text-sm font-semibold text-white">
            <span>Total Seized</span>
            <span style={{ color }}>{formatUsd(totalValue ?? 0, true)}</span>
          </div>
        </div>
      );
    }
    return null;
  };
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 hover:border-white/10 hover:bg-black/50">
        <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>
        <div className="flex h-48 items-center justify-center text-zinc-600">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 hover:border-white/10 hover:bg-black/50 relative overflow-hidden">
      <Watermark />
      <h3 className="mb-4 text-sm font-medium text-zinc-400 relative z-10">{title}</h3>
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
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
              width={60}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} minPointSize={2} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
