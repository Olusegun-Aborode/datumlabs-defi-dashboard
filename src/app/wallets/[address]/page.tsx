'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import KpiCard from '@/components/KpiCard';
import { healthFactorColor, healthFactorLabel } from '@/lib/constants';
import { formatUsd, formatNumber, truncateAddress } from '@/lib/utils';
import LiquidationsTable, { type LiquidationRow } from '@/components/tables/LiquidationsTable';

export default function WalletDetailsPage() {
    const params = useParams();
    const address = params.address as string;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    // Pagination for liquidations
    const [page, setPage] = useState(1);
    const limit = 10;

    useEffect(() => {
        fetch(`/navi/api/wallets/${address}`)
            .then((r) => r.json())
            .then((res) => {
                setData(res);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [address]);

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-zinc-500 gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-500 border-t-transparent" />
                <p>Analyzing on-chain portfolio...</p>
            </div>
        );
    }

    if (!data || data.error) {
        return (
            <div className="flex h-64 items-center justify-center text-red-500">
                Failed to load wallet data.
            </div>
        );
    }

    const { portfolio, liquidations } = data;
    const hfColor = healthFactorColor(portfolio.healthFactor);
    const hfLabel = healthFactorLabel(portfolio.healthFactor);

    // Pagination slice
    const paginatedLiquidations = liquidations.slice((page - 1) * limit, page * limit);

    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    Wallet Overview
                    <span className="rounded-md bg-zinc-800 px-2 py-1 text-sm font-mono text-zinc-400 font-normal">
                        {truncateAddress(address)}
                    </span>
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                    Real-time on-chain balances and historical liquidation events
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KpiCard
                    title="Health Factor"
                    value={portfolio.healthFactor >= 100 ? '99+' : formatNumber(portfolio.healthFactor, 2)}
                    subtitle={
                        <span style={{ color: hfColor }} className="font-medium">
                            {hfLabel}
                        </span>
                    }
                />
                <KpiCard
                    title="Total Supplied"
                    value={formatUsd(portfolio.collateralUsd, true)}
                />
                <KpiCard
                    title="Total Borrowed"
                    value={formatUsd(portfolio.borrowUsd, true)}
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Supplied Assets */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <h3 className="mb-4 text-sm font-medium text-zinc-400">Supplied Assets</h3>
                    {portfolio.collateralAssets.length === 0 ? (
                        <p className="text-sm text-zinc-500">No assets supplied.</p>
                    ) : (
                        <div className="space-y-3">
                            {portfolio.collateralAssets.map((asset: any) => (
                                <div key={asset.symbol} className="flex items-center justify-between border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                                            {asset.symbol.substring(0, 3)}
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300">{asset.symbol}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-zinc-200">
                                            {asset.amount ? formatNumber(asset.amount) : '-'}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {asset.valueUsd ? formatUsd(asset.valueUsd, true) : '≈ $0.00'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Borrowed Assets */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <h3 className="mb-4 text-sm font-medium text-zinc-400">Borrowed Assets</h3>
                    {portfolio.borrowAssets.length === 0 ? (
                        <p className="text-sm text-zinc-500">No assets borrowed.</p>
                    ) : (
                        <div className="space-y-3">
                            {portfolio.borrowAssets.map((asset: any) => (
                                <div key={asset.symbol} className="flex items-center justify-between border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-2">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-300">
                                            {asset.symbol.substring(0, 3)}
                                        </div>
                                        <span className="text-sm font-medium text-zinc-300">{asset.symbol}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium text-zinc-200">
                                            {asset.amount ? formatNumber(asset.amount) : '-'}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {asset.valueUsd ? formatUsd(asset.valueUsd, true) : '≈ $0.00'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <h2 className="mb-4 text-xl font-bold text-white">Action History</h2>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                    <h3 className="mb-4 text-sm font-medium text-zinc-400">Past Liquidations</h3>
                    <LiquidationsTable
                        data={paginatedLiquidations}
                        total={liquidations.length}
                        page={page}
                        limit={limit}
                        onPageChange={setPage}
                    />
                </div>
            </div>
        </div>
    );
}
