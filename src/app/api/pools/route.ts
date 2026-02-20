import { fetchAllPools } from '@/lib/sdk';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache for 60s

export async function GET() {
  try {
    const pools = await fetchAllPools();

    // Calculate totals
    const totals = pools.reduce(
      (acc, pool) => ({
        totalSupplyUsd: acc.totalSupplyUsd + pool.totalSupplyUsd,
        totalBorrowsUsd: acc.totalBorrowsUsd + pool.totalBorrowsUsd,
        tvl: acc.tvl + pool.availableLiquidityUsd, // TVL = Supply - Borrow
      }),
      { totalSupplyUsd: 0, totalBorrowsUsd: 0, tvl: 0 }
    );

    return Response.json({ pools, totals, timestamp: new Date().toISOString() });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
