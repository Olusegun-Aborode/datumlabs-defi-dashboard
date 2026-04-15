'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TuiPanel, LoadingState, ErrorState } from '@datumlabs/dashboard-kit';
import MarketsTable, { type MarketRow } from '@/components/tables/MarketsTable';

interface PoolsResponse {
  pools: MarketRow[];
  protocolName?: string;
}

export default function MarketsPage() {
  const { protocol } = useParams<{ protocol: string }>();

  const { data, isPending, isError, refetch } = useQuery<PoolsResponse>({
    queryKey: ['pools', protocol],
    queryFn: () => fetch(`/api/${protocol}/pools`).then((r) => r.json()),
  });

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState message="Failed to load markets." onRetry={() => refetch()} />;

  const markets = data.pools ?? [];

  return (
    <div className="space-y-4">
      <TuiPanel title="Markets" badge={`${markets.length} POOLS`} noPadding>
        <MarketsTable data={markets} protocolSlug={protocol} />
      </TuiPanel>
    </div>
  );
}
