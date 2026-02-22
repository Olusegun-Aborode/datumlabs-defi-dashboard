import { fetchSinglePool, fetchAllPools } from '@/lib/sdk';

import { POOL_SYMBOLS } from '@/lib/constants';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol: rawSymbol } = await params;
    const upper = rawSymbol.toUpperCase();
    const symbol = POOL_SYMBOLS.find(s => s.toUpperCase() === upper) || upper;

    // Fetch current pool state
    const pool = await fetchSinglePool(symbol);

    if (!pool) {
      return Response.json({ error: 'Pool not found' }, { status: 404 });
    }

    // Fetch history from DB (PoolDaily)
    let history = [];
    let asCollateral: any[] = [];
    let asBorrow: any[] = [];
    const db = getDb();
    if (db) {
      history = await db.poolDaily.findMany({
        where: { symbol },
        orderBy: { date: 'asc' },
        take: 90,
      });

      // Compute combinations using JSON wallet positions
      const wallets = await db.walletPosition.findMany({
        where: {
          OR: [
            { collateralAssets: { contains: `"${symbol}"` } },
            { borrowAssets: { contains: `"${symbol}"` } }
          ]
        },
        select: { collateralAssets: true, borrowAssets: true }
      });

      const borrowSums = new Map<string, number>();
      const collateralSums = new Map<string, number>();

      for (const w of wallets) {
        try {
          const cAssets = JSON.parse(w.collateralAssets);
          const bAssets = JSON.parse(w.borrowAssets);

          const hasCollateral = cAssets.some((a: any) => (a.symbol || a) === symbol);
          const hasBorrow = bAssets.some((a: any) => (a.symbol || a) === symbol);

          if (hasCollateral) {
            for (const b of bAssets) {
              const bSym = b.symbol || b;
              const bVal = b.valueUsd || 0;
              borrowSums.set(bSym, (borrowSums.get(bSym) || 0) + bVal);
            }
          }

          if (hasBorrow) {
            for (const c of cAssets) {
              const cSym = c.symbol || c;
              const cVal = c.valueUsd || 0;
              collateralSums.set(cSym, (collateralSums.get(cSym) || 0) + cVal);
            }
          }
        } catch (e) {
          // ignore JSON errors from old rows
        }
      }

      asCollateral = Array.from(borrowSums.entries())
        .map(([borrowAsset, totalBorrowUsd]) => ({ borrowAsset, totalBorrowUsd }))
        .filter(a => a.totalBorrowUsd > 0)
        .sort((a, b) => b.totalBorrowUsd - a.totalBorrowUsd)
        .slice(0, 5);

      asBorrow = Array.from(collateralSums.entries())
        .map(([collateralAsset, totalCollateralUsd]) => ({ collateralAsset, totalCollateralUsd }))
        .filter(a => a.totalCollateralUsd > 0)
        .sort((a, b) => b.totalCollateralUsd - a.totalCollateralUsd)
        .slice(0, 5);
    }

    return Response.json({
      pool,
      rateModel: pool.rateModel,
      history,
      pairs: { asCollateral, asBorrow }
    });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

// Generate static params for common pools to speed up build/ISR
export async function generateStaticParams() {
  const pools = await fetchAllPools();
  return pools.map((pool) => ({
    symbol: pool.symbol,
  }));
}
