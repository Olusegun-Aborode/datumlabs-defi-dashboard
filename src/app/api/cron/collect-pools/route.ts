import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { fetchAllPools } from '@/lib/sdk';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Fetch pools from NAVI API (includes prices, APYs, caps)
    const pools = await fetchAllPools();

    if (pools.length === 0) {
      return NextResponse.json({ warning: 'No pool data returned from API' });
    }

    const db = getDb();

    // Insert snapshots if db exists
    if (db) {
      await db.poolSnapshot.createMany({
        data: pools.map((pool) => ({
          symbol: pool.symbol,
          timestamp: new Date(),
          totalSupply: pool.totalSupply,
          totalSupplyUsd: pool.totalSupplyUsd,
          totalBorrows: pool.totalBorrows,
          totalBorrowsUsd: pool.totalBorrowsUsd,
          availableLiquidity: pool.availableLiquidity,
          availableLiquidityUsd: pool.availableLiquidityUsd,
          supplyApy: pool.supplyApy,
          borrowApy: pool.borrowApy,
          utilization: pool.utilization,
          price: pool.price,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      poolsCollected: pools.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cron collect-pools error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
