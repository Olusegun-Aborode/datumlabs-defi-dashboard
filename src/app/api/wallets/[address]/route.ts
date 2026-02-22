import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { getAddressPortfolio } from 'navi-sdk';
import { POOL_CONFIGS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function GET(req: Request, { params }: { params: Promise<{ address: string }> }) {
    const { address: rawAddress } = await params;
    const address = rawAddress.toLowerCase();

    const db = getDb();
    if (!db) {
        return NextResponse.json({ error: 'Database not found' }, { status: 503 });
    }

    try {
        // Fetch historical liquidations
        const liquidations = await db.liquidationEvent.findMany({
            where: { borrower: address },
            orderBy: { timestamp: 'desc' },
            take: 50,
        });

        // Try fetching fresh data
        let freshPortfolio = null;
        let freshCollateralUsd = 0;
        let freshBorrowUsd = 0;
        let freshHealthFactor = 999;
        const freshCollateralAssets: { symbol: string; amount: number; valueUsd: number }[] = [];
        const freshBorrowAssets: { symbol: string; amount: number; valueUsd: number }[] = [];

        try {
            const client = new SuiClient({ url: getFullnodeUrl('mainnet') });
            const portfolio = await getAddressPortfolio(address, false, client as any);

            const poolSnapshots = await db.poolSnapshot.findMany({
                orderBy: { timestamp: 'desc' },
                distinct: ['symbol'],
            });
            const poolMap = new Map<string, any>(poolSnapshots.map((p: any) => [p.symbol, p]));

            let totalCollateralAdjusted = 0;
            let totalBorrowAdjusted = 0;

            for (const [symbol, balances] of portfolio.entries()) {
                const rawSupply = Number(balances.supplyBalance ?? 0);
                const rawBorrow = Number(balances.borrowBalance ?? 0);
                if (rawSupply === 0 && rawBorrow === 0) continue;

                const decimals = POOL_CONFIGS[symbol]?.decimals ?? 9;
                const supplyAmt = rawSupply / Math.pow(10, decimals);
                const borrowAmt = rawBorrow / Math.pow(10, decimals);

                const pool = poolMap.get(symbol);
                const price = pool ? pool.price : 0;

                if (supplyAmt > 0) {
                    const valueUsd = supplyAmt * price;
                    freshCollateralUsd += valueUsd;
                    totalCollateralAdjusted += valueUsd * 0.8;
                    freshCollateralAssets.push({ symbol, amount: supplyAmt, valueUsd });
                }

                if (borrowAmt > 0) {
                    const valueUsd = borrowAmt * price;
                    freshBorrowUsd += valueUsd;
                    totalBorrowAdjusted += valueUsd;
                    freshBorrowAssets.push({ symbol, amount: borrowAmt, valueUsd });
                }
            }

            if (totalBorrowAdjusted > 0) {
                freshHealthFactor = totalCollateralAdjusted / totalBorrowAdjusted;
            }

            freshPortfolio = {
                collateralUsd: freshCollateralUsd,
                borrowUsd: freshBorrowUsd,
                healthFactor: freshHealthFactor,
                collateralAssets: freshCollateralAssets,
                borrowAssets: freshBorrowAssets,
            };

            // Also proactively upsert to DB
            await db.walletPosition.upsert({
                where: { address },
                create: {
                    address,
                    collateralUsd: freshCollateralUsd,
                    borrowUsd: freshBorrowUsd,
                    healthFactor: freshHealthFactor,
                    collateralAssets: JSON.stringify(freshCollateralAssets.map(a => a.symbol)),
                    borrowAssets: JSON.stringify(freshBorrowAssets.map(a => a.symbol)),
                    refreshPriority: freshHealthFactor < 1.2 ? 0 : 3,
                },
                update: {
                    collateralUsd: freshCollateralUsd,
                    borrowUsd: freshBorrowUsd,
                    healthFactor: freshHealthFactor,
                    collateralAssets: JSON.stringify(freshCollateralAssets.map(a => a.symbol)),
                    borrowAssets: JSON.stringify(freshBorrowAssets.map(a => a.symbol)),
                    refreshPriority: freshHealthFactor < 1.2 ? 0 : 3,
                    lastUpdated: new Date()
                }
            });
        } catch (sdkError) {
            console.error('Error fetching SDK data:', sdkError);
        }

        // Fallback to database if SDK fails
        const dbWallet = await db.walletPosition.findUnique({ where: { address } });

        return NextResponse.json({
            address,
            liquidations,
            portfolio: freshPortfolio || {
                collateralUsd: dbWallet?.collateralUsd ?? 0,
                borrowUsd: dbWallet?.borrowUsd ?? 0,
                healthFactor: dbWallet?.healthFactor ?? 999,
                collateralAssets: JSON.parse(dbWallet?.collateralAssets ?? '[]').map((a: string) => ({ symbol: a })),
                borrowAssets: JSON.parse(dbWallet?.borrowAssets ?? '[]').map((a: string) => ({ symbol: a })),
            }
        });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }
}
