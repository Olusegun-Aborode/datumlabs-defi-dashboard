'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatUsd, getAssetColor } from '@/lib/utils';

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
}

export default function DonutChart({ data }: DonutChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex h-full items-center justify-center text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={getAssetColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border-bright)',
            borderRadius: 4,
            fontSize: 11,
          }}
          formatter={(value: number | undefined) => [formatUsd(value ?? 0, true), '']}
        />
        <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text-muted)' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
