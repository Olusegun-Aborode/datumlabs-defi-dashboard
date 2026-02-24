'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import KpiCard from '@/components/KpiCard';
import SimpleLineChart from '@/components/charts/SimpleLineChart';
import InterestRateCurve from '@/components/charts/InterestRateCurve';
import DonutChart from '@/components/charts/DonutChart';
import { POOL_CONFIGS, POOL_SYMBOLS } from '@/lib/constants';
import { formatUsd, formatPercent, formatNumber } from '@/lib/utils';

interface PoolDetail {
  symbol: string;
  totalSupply: number;
  totalSupplyUsd: number;
  totalBorrows: number;
  totalBorrowsUsd: number;
  availableLiquidity: number;
  availableLiquidityUsd: number;
  supplyApy: number;
  borrowApy: number;
  utilization: number;
  ltv: number;
  liquidationThreshold: number;
  supplyCapCeiling: number;
  borrowCapCeiling: number;
  price: number;
}

interface RateModel {
  baseRate: number;
  multiplier: number;
  jumpMultiplier: number;
  kink: number;
  reserveFactor: number;
}

interface HistoryRow {
  date: string;
  avgSupplyApy: number;
  avgBorrowApy: number;
  avgUtilization: number;
  closeTotalSupplyUsd?: number;
  closeTotalBorrowsUsd?: number;
  closePrice?: number;
}

interface PairData {
  collateralAsset: string;
  borrowAsset: string;
  totalCollateralUsd: number;
  totalBorrowUsd: number;
}

export default function MarketDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: routeSymbol } = use(params);
  const upperSymbol = routeSymbol.toUpperCase();
  const symbol = POOL_SYMBOLS.find(s => s.toUpperCase() === upperSymbol) || upperSymbol;
  const config = POOL_CONFIGS[symbol];

  const [pool, setPool] = useState<PoolDetail | null>(null);
  const [rateModel, setRateModel] = useState<RateModel | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [pairs, setPairs] = useState<{ asCollateral: PairData[]; asBorrow: PairData[] }>({
    asCollateral: [],
    asBorrow: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/navi/api/pools/${symbol}`)
      .then((r) => r.json())
      .then((data) => {
        setPool(data.pool);
        setRateModel(data.rateModel);
        setHistory(data.history ?? []);
        setPairs(data.pairs ?? { asCollateral: [], asBorrow: [] });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [symbol]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-500">
        Loading {symbol} data...
      </div>
    );
  }

  const rateHistory = history.map((h) => ({
    date: h.date,
    supplyApy: h.avgSupplyApy,
    borrowApy: h.avgBorrowApy,
  }));

  const utilHistory = history.map((h) => ({
    date: h.date,
    utilization: h.avgUtilization,
  }));

  const supplyCapHistory = history.map((h) => {
    if (!pool || pool.supplyCapCeiling <= 0) return { date: h.date, utilization: 0 };
    const price = h.closePrice || pool.price;
    const supplyQuantity = (h.closeTotalSupplyUsd || 0) / (price || 1);
    const utilization = supplyQuantity / pool.supplyCapCeiling;
    return { date: h.date, utilization };
  });

  const borrowCapHistory = history.map((h) => {
    if (!pool || pool.borrowCapCeiling <= 0) return { date: h.date, utilization: 0 };
    const price = h.closePrice || pool.price;
    const borrowQuantity = (h.closeTotalBorrowsUsd || 0) / (price || 1);
    const utilization = borrowQuantity / pool.borrowCapCeiling;
    return { date: h.date, utilization };
  });

  const borrowedAgainst = pairs.asCollateral.map((p) => ({
    name: p.borrowAsset,
    value: p.totalBorrowUsd,
  }));

  const collateralUsed = pairs.asBorrow.map((p) => ({
    name: p.collateralAsset,
    value: p.totalCollateralUsd,
  }));

  return (
    <div className="space-y-6">
      {/* Back link + title */}
      <div className="flex items-center gap-3">
        <Link href="/markets" className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <span
            className="inline-block h-4 w-4 rounded-full"
            style={{ backgroundColor: config?.color ?? '#666' }}
          />
          <h1 className="text-2xl font-bold text-white">{symbol}</h1>
          <span className="text-sm text-zinc-400">{config?.name ?? symbol}</span>
        </div>
      </div>

      {/* Row 1: Overview cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard title="Total Supply" value={pool ? formatUsd(pool.totalSupplyUsd, true) : '—'} subtitle={pool ? `${formatNumber(pool.totalSupply)} ${symbol}` : undefined} />
        <KpiCard title="Total Borrows" value={pool ? formatUsd(pool.totalBorrowsUsd, true) : '—'} subtitle={pool ? `${formatNumber(pool.totalBorrows)} ${symbol}` : undefined} />
        <KpiCard title="Supply APY" value={pool ? formatPercent(pool.supplyApy) : '—'} />
        <KpiCard title="Borrow APY" value={pool ? formatPercent(pool.borrowApy) : '—'} />
      </div>

      {/* Row 2: Rate model + Risk params */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {rateModel ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
            <h3 className="text-sm font-medium text-zinc-400">Interest Rate Model</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-zinc-500">Base Rate</span>
              <span className="text-right text-zinc-300">{formatPercent(rateModel.baseRate * 100)}</span>
              <span className="text-zinc-500">Multiplier</span>
              <span className="text-right text-zinc-300">{formatPercent(rateModel.multiplier * 100)}</span>
              <span className="text-zinc-500">Jump Multiplier</span>
              <span className="text-right text-zinc-300">{formatPercent(rateModel.jumpMultiplier * 100)}</span>
              <span className="text-zinc-500">Kink</span>
              <span className="text-right text-zinc-300">{formatPercent(rateModel.kink * 100)}</span>
              <span className="text-zinc-500">Reserve Factor</span>
              <span className="text-right text-zinc-300">{formatPercent(rateModel.reserveFactor * 100)}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
            <h3 className="text-sm font-medium text-zinc-400">Interest Rate Model</h3>
            <p className="mt-4 text-sm text-zinc-600">Rate model params not yet indexed</p>
          </div>
        )}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">Risk Parameters</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-zinc-500">LTV</span>
            <span className="text-right text-zinc-300">{pool ? formatPercent(pool.ltv) : '—'}</span>
            <span className="text-zinc-500">Liquidation Threshold</span>
            <span className="text-right text-zinc-300">{pool ? formatPercent(pool.liquidationThreshold) : '—'}</span>
            <span className="text-zinc-500">Utilization</span>
            <span className="text-right text-zinc-300">{pool ? formatPercent(pool.utilization) : '—'}</span>
            <span className="text-zinc-500">Supply Cap</span>
            <span className="text-right text-zinc-300">{pool ? formatNumber(pool.supplyCapCeiling) : '—'}</span>
            <span className="text-zinc-500">Borrow Cap</span>
            <span className="text-right text-zinc-300">{pool ? formatNumber(pool.borrowCapCeiling) : '—'}</span>
            <span className="text-zinc-500">Price</span>
            <span className="text-right text-zinc-300">{pool ? formatUsd(pool.price) : '—'}</span>
          </div>
        </div>
      </div>

      {/* Row 3: Historical charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SimpleLineChart
          data={rateHistory}
          lines={[
            { dataKey: 'supplyApy', color: '#22C55E', name: 'Supply APY' },
            { dataKey: 'borrowApy', color: '#EF4444', name: 'Borrow APY' },
          ]}
          title="Interest Rate History (90d)"
        />
        <SimpleLineChart
          data={utilHistory}
          lines={[{ dataKey: 'utilization', color: '#3B82F6', name: 'Utilization' }]}
          title="Utilization History (90d)"
        />
      </div>

      {rateModel && (
        <InterestRateCurve
          baseRate={rateModel.baseRate}
          multiplier={rateModel.multiplier}
          jumpMultiplier={rateModel.jumpMultiplier}
          kink={rateModel.kink}
          reserveFactor={rateModel.reserveFactor}
          currentUtilization={pool?.utilization ? pool.utilization * 100 : undefined}
        />
      )}

      {/* Row 5: Cap utilization */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SimpleLineChart
          data={supplyCapHistory}
          lines={[{ dataKey: 'utilization', color: '#22C55E', name: 'Supply Cap Used' }]}
          title="Supply Cap Utilization (90d)"
          yFormatter={(v) => formatPercent(v * 100)}
        />
        <SimpleLineChart
          data={borrowCapHistory}
          lines={[{ dataKey: 'utilization', color: '#EF4444', name: 'Borrow Cap Used' }]}
          title="Borrow Cap Utilization (90d)"
          yFormatter={(v) => formatPercent(v * 100)}
        />
      </div>

      {/* Row 6: Donut charts */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DonutChart
          data={borrowedAgainst}
          title={`Assets Borrowed Against ${symbol} Collateral`}
        />
        <DonutChart
          data={collateralUsed}
          title={`Collateral Used to Borrow ${symbol}`}
        />
      </div>
    </div>
  );
}
