'use client';

import { cn } from '@/lib/utils';

import { ReactNode } from 'react';

interface KpiCardProps {
  title: string;
  value: string | ReactNode;
  subtitle?: string | ReactNode;
  className?: string;
}

export default function KpiCard({ title, value, subtitle, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-zinc-800 bg-zinc-900/50 p-6',
        className
      )}
    >
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {subtitle && (
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      )}
    </div>
  );
}
