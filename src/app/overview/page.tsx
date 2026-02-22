'use client';

import { useState, useEffect } from 'react';
import KpiCard from '@/components/KpiCard';
import TimeFilter from '@/components/TimeFilter';
import StackedAreaChart from '@/components/charts/StackedAreaChart';
import { POOL_SYMBOLS } from '@/lib/constants';
import { formatUsd } from '@/lib/utils';

interface PoolData {
  symbol: string;
  totalSupplyUsd: number;
  totalBorrowsUsd: number;
}

interface PoolsResponse {
  pools: PoolData[];
  totals: { totalSupplyUsd: number; totalBorrowsUsd: number; tvl: number };
}

interface HistoryRow {
  symbol: string;
  date: string;
  closeTotalSupplyUsd: number;
  closeTotalBorrowsUsd: number;
  closeLiquidityUsd: number;
}

export default function OverviewPage() {
  const [pools, setPools] = useState<PoolsResponse | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch('/navi/api/pools').then((r) => r.json()),
      fetch(`/navi/api/pools/history?days=${days}`).then((r) => r.json()),
    ])
      .then(([poolsData, historyData]) => {
        setPools(poolsData);
        setHistory(historyData.history ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [days]);

  // Transform history into stacked chart format
  function buildChartData(valueKey: string) {
    const dateMap = new Map<string, Record<string, unknown>>();
    for (const row of history) {
      const dateStr = new Date(row.date).toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { date: dateStr });
      }
      const entry = dateMap.get(dateStr)!;
      if (valueKey === 'supply') entry[`${row.symbol}_supply`] = row.closeTotalSupplyUsd;
      if (valueKey === 'borrows') entry[`${row.symbol}_borrows`] = row.closeTotalBorrowsUsd;
      if (valueKey === 'tvl') entry[`${row.symbol}_tvl`] = row.closeLiquidityUsd;
    }
    return Array.from(dateMap.values()).sort((a, b) =>
      String(a.date).localeCompare(String(b.date))
    );
  }

  const t = pools?.totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Protocol Overview</h1>
          <p className="text-sm text-zinc-400">NAVI Lending on Sui — real-time analytics</p>
        </div>
        <TimeFilter value={days} onChange={setDays} />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          title="Total Supplied"
          value={t ? formatUsd(t.totalSupplyUsd, true) : '—'}
          subtitle={loading ? 'Loading...' : undefined}
        />
        <KpiCard
          title="Total Borrowed"
          value={t ? formatUsd(t.totalBorrowsUsd, true) : '—'}
          subtitle={loading ? 'Loading...' : undefined}
        />
        <KpiCard
          title="Total Value Locked"
          value={t ? formatUsd(t.tvl, true) : '—'}
          subtitle={loading ? 'Loading...' : undefined}
        />
      </div>

      {/* Stacked Area Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-1">
        <StackedAreaChart
          data={buildChartData('supply')}
          symbols={POOL_SYMBOLS}
          title="Total Supply by Asset"
          valueKey="supply"
        />
        <StackedAreaChart
          data={buildChartData('borrows')}
          symbols={POOL_SYMBOLS}
          title="Total Borrows by Asset"
          valueKey="borrows"
        />
        <StackedAreaChart
          data={buildChartData('tvl')}
          symbols={POOL_SYMBOLS}
          title="TVL by Asset"
          valueKey="tvl"
        />
      </div>
    </div>
  );
}
