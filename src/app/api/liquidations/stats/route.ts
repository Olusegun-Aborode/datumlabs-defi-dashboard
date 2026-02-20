import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/liquidations/stats
 * Returns 30d collateral distribution + daily collateral seized for charts.
 */
export async function GET() {
  const db = getDb();
  if (!db) {
    return NextResponse.json({
      collateralDistribution: [],
      dailySeized: [],
      message: 'No database configured',
    });
  }

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Collateral distribution (donut chart data)
    const events = await db.liquidationEvent.findMany({
      where: { timestamp: { gte: thirtyDaysAgo } },
      select: { collateralAsset: true, collateralUsd: true, timestamp: true },
    });

    // Group by collateral asset
    const distMap = new Map<string, number>();
    for (const evt of events) {
      const current = distMap.get(evt.collateralAsset) ?? 0;
      distMap.set(evt.collateralAsset, current + evt.collateralUsd);
    }
    const collateralDistribution = Array.from(distMap.entries())
      .map(([asset, totalUsd]) => ({ asset, totalUsd }))
      .sort((a, b) => b.totalUsd - a.totalUsd);

    // Daily seized (bar chart data)
    const dailyMap = new Map<string, number>();
    for (const evt of events) {
      const day = evt.timestamp.toISOString().split('T')[0];
      const current = dailyMap.get(day) ?? 0;
      dailyMap.set(day, current + evt.collateralUsd);
    }
    const dailySeized = Array.from(dailyMap.entries())
      .map(([date, totalUsd]) => ({ date, totalUsd }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({ collateralDistribution, dailySeized });
  } catch (error) {
    console.error('/api/liquidations/stats error:', error);
    return NextResponse.json(
      { collateralDistribution: [], dailySeized: [], error: 'Query failed' },
      { status: 500 }
    );
  }
}
