'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { POOL_CONFIGS } from '@/lib/constants';
import { formatUsd } from '@/lib/utils';

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  title: string;
}

const PREMIUM_COLORS = [
  '#15CC93', // NAVI Teal
  '#0EA5E9', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#10B981', // Emerald
  '#06B6D4', // Light Cyan
  '#F59E0B'  // Amber Accent
];

export default function DonutChart({ data, title }: DonutChartProps) {
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
      <ResponsiveContainer width="100%" height={250}>
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
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PREMIUM_COLORS[index % PREMIUM_COLORS.length]}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12,
              fontSize: 12,
              color: '#fff',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
            }}
            formatter={(value: number | undefined) => [formatUsd(value ?? 0, true), '']}
          />
          <Legend
            layout="vertical"
            verticalAlign="middle"
            align="right"
            wrapperStyle={{ fontSize: 11, color: '#a1a1aa' }}
            formatter={(value: string, entry: any) => {
              const { payload } = entry;
              const percent = payload.percent ? (payload.percent * 100).toFixed(1) + '%' : '';
              return (
                <span className="text-zinc-300">
                  {value} <span className="text-zinc-500">({formatUsd(payload.value, true)} - {percent})</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
