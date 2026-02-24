'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDate, formatPercent } from '@/lib/utils';
import Watermark from './Watermark';

interface SimpleLineChartProps {
  data: Array<Record<string, unknown>>;
  lines: Array<{ dataKey: string; color: string; name: string }>;
  title: string;
  yFormatter?: (v: number) => string;
}

export default function SimpleLineChart({
  data,
  lines,
  title,
  yFormatter = (v) => formatPercent(v),
}: SimpleLineChartProps) {
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
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => formatDate(v)}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#27272a' }}
            />
            <YAxis
              tickFormatter={yFormatter}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#ffffff10' }}
              width={60}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                fontSize: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
              }}
              labelFormatter={(v) => formatDate(String(v))}
              formatter={(value: number | undefined, name: string | undefined) => [yFormatter(value ?? 0), name ?? '']}
            />
            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type="monotone"
                dataKey={line.dataKey}
                stroke={line.color}
                name={line.name}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
