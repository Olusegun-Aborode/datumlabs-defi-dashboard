import { NextResponse } from 'next/server';
import { CRON_SECRET, NAVI_EVENT_TYPES, POOL_CONFIGS } from '@/lib/constants';
import { queryEvents } from '@/lib/rpc';
import { getDb } from '@/lib/db';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { getLendingState, getHealthFactor } from '@naviprotocol/lending';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const isBackfill = searchParams.get('backfill') === 'true';

  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: 'No database configured' }, { status: 503 });
  }

  try {
    const client = new SuiClient({ url: getFullnodeUrl('mainnet') });

    // Step 1: Discover new addresses from recent events
    const newAddresses = new Set<string>();
    const maxFetch = isBackfill ? 5000 : 50;
    const backfillTargetDate = new Date('2026-01-01T00:00:00Z');

    for (const eventType of [NAVI_EVENT_TYPES.BORROW, NAVI_EVENT_TYPES.DEPOSIT]) {
      try {
        let cursor = null;
        let fetched = 0;
        let hasMore = true;

        while (hasMore && fetched < maxFetch) {
          const page = await queryEvents(eventType, cursor, 50, 'descending');
          if (page.data.length === 0) break;

          for (const evt of page.data) {
            const eventDate = new Date(Number(evt.timestampMs));
            if (isBackfill && eventDate < backfillTargetDate) {
              hasMore = false;
              break;
            }
            const addr = String(evt.parsedJson.sender ?? evt.sender);
            if (addr) newAddresses.add(addr);
          }
          fetched += page.data.length;
          cursor = page.nextCursor;
          if (!page.hasNextPage) hasMore = false;
        }
      } catch {
        // skip if event type query fails
      }
    }

    let discovered = 0;
    for (const address of newAddresses) {
      try {
        await db.walletPosition.upsert({
          where: { address },
          create: {
            address,
            collateralUsd: 0,
            borrowUsd: 0,
            healthFactor: 999,
            collateralAssets: '[]',
            borrowAssets: '[]',
            refreshPriority: 3,
            lastUpdated: new Date(0),
          },
          update: {},
        });
        discovered++;
      } catch {
        // skip duplicates
      }
    }

    // Step 2: Refresh stale wallets by priority
    const priorityThresholds = [
      { priority: 0, staleMinutes: 2 },
      { priority: 1, staleMinutes: 5 },
      { priority: 2, staleMinutes: 15 },
      { priority: 3, staleMinutes: 60 },
    ];

    let refreshed = 0;

    // Load pool pricing for HF calculations
    const poolSnapshots = await db.poolSnapshot.findMany({
      orderBy: { timestamp: 'desc' },
      distinct: ['symbol'],
    });
    const poolMap = new Map<string, any>(poolSnapshots.map((p: any) => [p.symbol, p]));

    for (const { priority, staleMinutes } of priorityThresholds) {
      if (refreshed >= 50) break;

      const staleThreshold = new Date(Date.now() - staleMinutes * 60 * 1000);
      const staleWallets = await db.walletPosition.findMany({
        where: {
          refreshPriority: priority,
          lastUpdated: { lt: staleThreshold },
        },
        orderBy: { lastUpdated: 'asc' },
        take: 50 - refreshed,
      });

      for (const wallet of staleWallets) {
        try {
          const [lendingState, protocolHealthFactor] = await Promise.all([
            getLendingState(wallet.address, { client, env: 'prod' }),
            getHealthFactor(wallet.address, { client, env: 'prod' })
          ]);

          let collateralUsd = 0;
          let borrowUsd = 0;
          const collateralAssets: { symbol: string; amount: number; valueUsd: number }[] = [];
          const borrowAssets: { symbol: string; amount: number; valueUsd: number }[] = [];

          for (const position of lendingState) {
            const rawSupply = Number(position.supplyBalance ?? 0);
            const rawBorrow = Number(position.borrowBalance ?? 0);
            if (rawSupply === 0 && rawBorrow === 0) continue;

            let symbol = position.pool.token.symbol;
            if (symbol === 'Sui') symbol = 'SUI';
            if (symbol === 'nUSDC') symbol = 'USDC';
            if (symbol === 'nUSDT') symbol = 'wUSDT';
            if (symbol === 'vSui') symbol = 'vSUI';
            if (symbol === 'haSui') symbol = 'haSUI';
            if (symbol === 'EnzoBTC') symbol = 'enzoBTC';
            if (symbol === 'LZWBTC') symbol = 'wBTC';

            // NAVI completely normalizes internal state to 9 decimals across all tokens
            const supplyAmt = rawSupply / Math.pow(10, 9);
            const borrowAmt = rawBorrow / Math.pow(10, 9);

            const pool = poolMap.get(symbol);
            const price = pool ? pool.price : 0;

            if (supplyAmt > 0) {
              const valueUsd = supplyAmt * price;
              collateralUsd += valueUsd;
              collateralAssets.push({ symbol, amount: supplyAmt, valueUsd });
            }

            if (borrowAmt > 0) {
              const valueUsd = borrowAmt * price;
              borrowUsd += valueUsd;
              borrowAssets.push({ symbol, amount: borrowAmt, valueUsd });
            }
          }

          let healthFactor = protocolHealthFactor;
          if (Number.isNaN(healthFactor) || !isFinite(healthFactor) || healthFactor < 0) {
            healthFactor = 999;
          }

          let newPriority = 3;
          if (healthFactor < 1.2) newPriority = 0;
          else if (healthFactor < 1.5) newPriority = 1;
          else if (healthFactor < 2.0) newPriority = 2;

          await db.walletPosition.update({
            where: { id: wallet.id },
            data: {
              collateralUsd,
              borrowUsd,
              healthFactor,
              collateralAssets: JSON.stringify(collateralAssets),
              borrowAssets: JSON.stringify(borrowAssets),
              refreshPriority: newPriority,
              lastUpdated: new Date(),
            },
          });
          refreshed++;
        } catch (e) {
          // fallback to update time only on error
          await db.walletPosition.update({
            where: { id: wallet.id },
            data: { lastUpdated: new Date() },
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      discovered,
      refreshed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('index-wallets error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
