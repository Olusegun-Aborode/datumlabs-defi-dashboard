'use client';

import { cn, formatUsd, truncateAddress, formatNumber } from '@/lib/utils';
import { healthFactorColor, healthFactorLabel } from '@/lib/constants';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

export interface WalletRow {
  address: string;
  collateralUsd: number;
  borrowUsd: number;
  healthFactor: number;
  collateralAssets: string; // JSON array
  borrowAssets: string;     // JSON array
}

interface WalletsTableProps {
  data: WalletRow[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function WalletsTable({ data, total, page, limit, onPageChange }: WalletsTableProps) {
  const totalPages = Math.max(1, Math.ceil(total / limit));

  function parseAssets(json: string): any[] {
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return (
    <div className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:border-white/10 hover:bg-black/50">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Wallet</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-400">Collateral</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Assets</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-400">Borrows</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-400">Assets</th>
              <th className="px-4 py-3 text-right font-medium text-zinc-400">Health Factor</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-zinc-600">
                  No wallet positions indexed yet — run the wallet indexer cron
                </td>
              </tr>
            ) : (
              data.map((row) => {
                const hfColor = healthFactorColor(row.healthFactor);
                const hfLabel = healthFactorLabel(row.healthFactor);
                return (
                  <tr key={row.address} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-300">
                      <div className="flex items-center gap-2">
                        <Link href={`/wallets/${row.address}`} className="text-white hover:text-blue-400">
                          {truncateAddress(row.address)}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatUsd(row.collateralUsd, true)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {parseAssets(row.collateralAssets).map((a, i) => {
                          const symbol = typeof a === 'string' ? a : (a.symbol || '?');
                          return (
                            <span key={`${symbol}-${i}`} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                              {symbol}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-300">
                      {formatUsd(row.borrowUsd, true)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {parseAssets(row.borrowAssets).map((a, i) => {
                          const symbol = typeof a === 'string' ? a : (a.symbol || '?');
                          return (
                            <span key={`${symbol}-${i}`} className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300">
                              {symbol}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{ color: hfColor, backgroundColor: `${hfColor}15` }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: hfColor }} />
                        {row.healthFactor >= 100 ? '99+' : formatNumber(row.healthFactor, 2)}
                        <span className="opacity-60">{hfLabel}</span>
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
          <span className="text-xs text-zinc-500">
            Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              className="rounded px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
            >
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
              className="rounded px-3 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
