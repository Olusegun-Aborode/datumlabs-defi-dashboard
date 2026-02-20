import { NextResponse } from 'next/server';
import { CRON_SECRET } from '@/lib/constants';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Aggregate collateral<->borrow pairs from wallet positions.
 * Used for donut charts on the Markets detail page.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'No database configured' }, { status: 503 });
  }

  try {
    // Fetch all wallet positions
    const wallets = await db.walletPosition.findMany({
      where: { borrowUsd: { gt: 0 } },
    });

    // Build pair counts
    const pairs = new Map<string, {
      collateralAsset: string;
      borrowAsset: string;
      count: number;
      totalCollateralUsd: number;
      totalBorrowUsd: number;
    }>();

    for (const wallet of wallets) {
      let collateralAssets: string[];
      let borrowAssets: string[];
      try {
        collateralAssets = JSON.parse(wallet.collateralAssets);
        borrowAssets = JSON.parse(wallet.borrowAssets);
      } catch {
        continue;
      }

      for (const coll of collateralAssets) {
        for (const borrow of borrowAssets) {
          const key = `${coll}:${borrow}`;
          const existing = pairs.get(key);
          if (existing) {
            existing.count++;
            existing.totalCollateralUsd += wallet.collateralUsd / collateralAssets.length;
            existing.totalBorrowUsd += wallet.borrowUsd / borrowAssets.length;
          } else {
            pairs.set(key, {
              collateralAsset: coll,
              borrowAsset: borrow,
              count: 1,
              totalCollateralUsd: wallet.collateralUsd / collateralAssets.length,
              totalBorrowUsd: wallet.borrowUsd / borrowAssets.length,
            });
          }
        }
      }
    }

    // Upsert all pairs
    let upserted = 0;
    for (const pair of pairs.values()) {
      await db.collateralBorrowPair.upsert({
        where: {
          collateralAsset_borrowAsset: {
            collateralAsset: pair.collateralAsset,
            borrowAsset: pair.borrowAsset,
          },
        },
        create: { ...pair, updatedAt: new Date() },
        update: {
          count: pair.count,
          totalCollateralUsd: pair.totalCollateralUsd,
          totalBorrowUsd: pair.totalBorrowUsd,
          updatedAt: new Date(),
        },
      });
      upserted++;
    }

    return NextResponse.json({
      success: true,
      pairsUpserted: upserted,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('aggregate-pairs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
