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
    <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 hover:border-white/10 hover:bg-black/50">
      <h3 className="mb-4 text-sm font-medium text-zinc-400">{title}</h3>
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
            formatter={(value: number | undefined, name: string | undefined, props: any) => {
              const payload = props?.payload;
              if (payload) {
                const symbols = Object.keys(payload).filter((k) => k !== 'date' && k !== 'value' && k !== 'totalUsd');
                if (symbols.length > 0) {
                  const breakdown = symbols.map((s) => `${s}: ${formatUsd(payload[s], true)}`).join(', ');
                  return [formatUsd(value ?? 0, true), `Seized (${breakdown})`];
                }
              }
              return [formatUsd(value ?? 0, true), 'Seized'];
            }}
          />
          <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
