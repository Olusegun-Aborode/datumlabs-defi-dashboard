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
    const db = getDb();
    if (db) {
      history = await db.poolDaily.findMany({
        where: { symbol },
        orderBy: { date: 'asc' },
        take: 90,
      });
    }

    return Response.json({ pool, rateModel: pool.rateModel, history });
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
