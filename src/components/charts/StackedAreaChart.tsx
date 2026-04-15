'use client';

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
import { formatUsd, formatDate, getAssetColor } from '@/lib/utils';

interface StackedAreaChartProps {
  data: Array<Record<string, unknown>>;
  symbols: string[];
  valueKey: string;
}

export default function StackedAreaChart({
  data,
  symbols,
  valueKey,
}: StackedAreaChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        No data yet — run cron jobs to collect snapshots
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 8, left: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
        <XAxis
          dataKey="date"
          tickFormatter={(v) => formatDate(v)}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
        />
        <YAxis
          tickFormatter={(v) => formatUsd(v, true)}
          tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
          width={70}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border-bright)',
            borderRadius: 4,
            fontSize: 11,
          }}
          labelFormatter={(v) => formatDate(String(v))}
          formatter={(value: number | undefined) => [formatUsd(value ?? 0, true), '']}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} />
        {symbols.map((symbol) => (
          <Area
            key={symbol}
            type="monotone"
            dataKey={`${symbol}_${valueKey}`}
            stackId="1"
            stroke={getAssetColor(symbol)}
            fill={getAssetColor(symbol)}
            fillOpacity={0.3}
            name={symbol}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
