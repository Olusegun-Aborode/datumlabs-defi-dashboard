import { NextResponse } from 'next/server';
import { CRON_SECRET, NAVI_EVENT_TYPES, POOL_ID_TO_SYMBOL, POOL_CONFIGS } from '@/lib/constants';
import { queryEvents } from '@/lib/rpc';
import { getDb } from '@/lib/db';
import BigNumber from 'bignumber.js';

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
    let cursor: { txDigest: string; eventSeq: string } | null = null;
    let totalIndexed = 0;
    let hasMore = true;

    const maxIndexed = isBackfill ? 10000 : 200;
    const backfillTargetDate = new Date('2026-01-01T00:00:00Z');

    // Get the most recent indexed event to avoid re-processing
    const latest = isBackfill ? null : await db.liquidationEvent.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { id: true },
    });

    while (hasMore && totalIndexed < maxIndexed) {
      const page = await queryEvents(
        NAVI_EVENT_TYPES.LIQUIDATION,
        cursor,
        50,
        'descending'
      );

      const rows = [];

      for (const evt of page.data) {
        const eventId = `${evt.id.txDigest}:${evt.id.eventSeq}`;
        const eventDate = new Date(Number(evt.timestampMs));

        if (isBackfill && eventDate < backfillTargetDate) {
          hasMore = false;
          break;
        }

        // Stop if we've reached already-indexed events
        if (!isBackfill && latest && eventId === latest.id) {
          hasMore = false;
          break;
        }

        const p = evt.parsedJson;
        const collateralPoolId = Number(p.collateral_asset ?? p.reserve ?? 0);
        const debtPoolId = Number(p.debt_asset ?? 0);
        const collateralSymbol = POOL_ID_TO_SYMBOL[collateralPoolId] ?? 'UNKNOWN';
        const debtSymbol = POOL_ID_TO_SYMBOL[debtPoolId] ?? 'UNKNOWN';

        const collateralDecimals = POOL_CONFIGS[collateralSymbol]?.decimals ?? 9;
        const debtDecimals = POOL_CONFIGS[debtSymbol]?.decimals ?? 9;

        const collateralAmount = new BigNumber(String(p.collateral_amount ?? 0))
          .dividedBy(new BigNumber(10).pow(collateralDecimals))
          .toNumber();
        const debtAmount = new BigNumber(String(p.debt_amount ?? 0))
          .dividedBy(new BigNumber(10).pow(debtDecimals))
          .toNumber();

        // NAVI Prices from Oracle are always 1e9 regardless of token
        const collateralPrice = new BigNumber(String(p.collateral_price ?? 0))
          .dividedBy(new BigNumber(10).pow(9))
          .toNumber();
        const debtPrice = new BigNumber(String(p.debt_price ?? 0))
          .dividedBy(new BigNumber(10).pow(9))
          .toNumber();

        const treasuryAmount = new BigNumber(String(p.treasury ?? 0))
          .dividedBy(new BigNumber(10).pow(collateralDecimals))
          .toNumber();

        rows.push({
          id: eventId,
          txDigest: evt.id.txDigest,
          timestamp: new Date(Number(evt.timestampMs)),
          liquidator: String(p.sender ?? evt.sender),
          borrower: String(p.user ?? ''),
          collateralAsset: collateralSymbol,
          collateralAmount,
          collateralPrice,
          collateralUsd: collateralAmount * collateralPrice,
          debtAsset: debtSymbol,
          debtAmount,
          debtPrice,
          debtUsd: debtAmount * debtPrice,
          treasuryAmount,
        });
      }

      if (rows.length > 0) {
        // skipDuplicates in case of overlap
        await db.liquidationEvent.createMany({
          data: rows,
          skipDuplicates: true,
        });
        totalIndexed += rows.length;
      }

      cursor = page.nextCursor;
      if (!page.hasNextPage) hasMore = false;
    }

    return NextResponse.json({
      success: true,
      indexed: totalIndexed,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('index-liquidations error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
