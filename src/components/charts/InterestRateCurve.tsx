'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { calcInterestRateCurve } from '@/lib/pools';
import { formatPercent } from '@/lib/utils';
import Watermark from './Watermark';

interface InterestRateCurveProps {
  baseRate: number;
  multiplier: number;
  jumpMultiplier: number;
  kink: number;
  reserveFactor: number;
  currentUtilization?: number;
}

export default function InterestRateCurve({
  baseRate,
  multiplier,
  jumpMultiplier,
  kink,
  reserveFactor,
  currentUtilization,
}: InterestRateCurveProps) {
  const data = calcInterestRateCurve({
    baseRate,
    multiplier,
    jumpMultiplier,
    kink,
    reserveFactor,
  });

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl p-6 shadow-2xl transition-all duration-300 hover:border-white/10 hover:bg-black/50 relative overflow-hidden">
      <Watermark />
      <h3 className="mb-4 text-sm font-medium text-zinc-400 relative z-10">Interest Rate Curve</h3>
      <div className="relative z-10">
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="utilization"
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: '#71717a', fontSize: 11 }}
              axisLine={{ stroke: '#ffffff10' }}
              label={{ value: 'Utilization', position: 'insideBottom', offset: -5, fill: '#71717a', fontSize: 11 }}
            />
            <YAxis
              tickFormatter={(v) => formatPercent(v)}
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
              formatter={(value: number | undefined, name: string | undefined) => [
                formatPercent(value ?? 0),
                name === 'borrowRate' ? 'Borrow APY' : 'Supply APY',
              ]}
              labelFormatter={(v) => `Utilization: ${v}%`}
            />
            {/* Kink marker */}
            <ReferenceLine
              x={kink * 100}
              stroke="#F59E0B"
              strokeDasharray="5 5"
              label={{ value: 'Kink', fill: '#F59E0B', fontSize: 10 }}
            />
            {/* Current utilization marker */}
            {currentUtilization !== undefined && (
              <ReferenceLine
                x={currentUtilization * 100}
                stroke="#22C55E"
                strokeWidth={2}
                label={{ value: 'Current', fill: '#22C55E', fontSize: 10, position: 'insideTopLeft' }}
              />
            )}
            <Line
              type="monotone"
              dataKey="borrowRate"
              stroke="#EF4444"
              dot={false}
              strokeWidth={2}
              name="borrowRate"
            />
            <Line
              type="monotone"
              dataKey="supplyRate"
              stroke="#22C55E"
              dot={false}
              strokeWidth={2}
              name="supplyRate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
