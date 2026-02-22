'use client';

import { useState, useEffect } from 'react';
import MarketsTable, { type MarketRow } from '@/components/tables/MarketsTable';

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/navi/api/pools')
      .then((r) => r.json())
      .then((data) => setMarkets(data.pools ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Markets</h1>
        <p className="text-sm text-zinc-400">
          All NAVI lending pools — click any row to see detailed analytics
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-zinc-500">
          Loading pool data...
        </div>
      ) : (
        <MarketsTable data={markets} />
      )}
    </div>
  );
}
