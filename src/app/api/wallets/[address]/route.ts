import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { getLendingState, getHealthFactor } from '@naviprotocol/lending';
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

            // Using the official SDK calls directly without WalletClient
            const [lendingState, protocolHealthFactor] = await Promise.all([
                getLendingState(address, { client, env: 'prod' }),
                getHealthFactor(address, { client, env: 'prod' })
            ]);

            freshHealthFactor = protocolHealthFactor;

            const poolSnapshots = await db.poolSnapshot.findMany({
                orderBy: { timestamp: 'desc' },
                distinct: ['symbol'],
            });
            const poolMap = new Map<string, any>(poolSnapshots.map((p: any) => [p.symbol, p]));

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
                    freshCollateralUsd += valueUsd;
                    freshCollateralAssets.push({ symbol, amount: supplyAmt, valueUsd });
                }

                if (borrowAmt > 0) {
                    const valueUsd = borrowAmt * price;
                    freshBorrowUsd += valueUsd;
                    freshBorrowAssets.push({ symbol, amount: borrowAmt, valueUsd });
                }
            }

            freshPortfolio = {
                collateralUsd: freshCollateralUsd,
                borrowUsd: freshBorrowUsd,
                healthFactor: freshHealthFactor,
                collateralAssets: freshCollateralAssets,
                borrowAssets: freshBorrowAssets,
            };

            if (Number.isNaN(freshHealthFactor) || !isFinite(freshHealthFactor) || freshHealthFactor < 0) {
                freshHealthFactor = 999;
            }

            // Also proactively upsert to DB
            await db.walletPosition.upsert({
                where: { address },
                create: {
                    address,
                    collateralUsd: freshCollateralUsd,
                    borrowUsd: freshBorrowUsd,
                    healthFactor: freshHealthFactor,
                    collateralAssets: JSON.stringify(freshCollateralAssets),
                    borrowAssets: JSON.stringify(freshBorrowAssets),
                    refreshPriority: freshHealthFactor < 1.2 ? 0 : 3,
                },
                update: {
                    collateralUsd: freshCollateralUsd,
                    borrowUsd: freshBorrowUsd,
                    healthFactor: freshHealthFactor,
                    collateralAssets: JSON.stringify(freshCollateralAssets),
                    borrowAssets: JSON.stringify(freshBorrowAssets),
                    refreshPriority: freshHealthFactor < 1.2 ? 0 : 3,
                    lastUpdated: new Date()
                }
            });
        } catch (sdkError: any) {
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
                collateralAssets: JSON.parse(dbWallet?.collateralAssets ?? '[]').map((a: any) =>
                    typeof a === 'string' ? { symbol: a } : a
                ),
                borrowAssets: JSON.parse(dbWallet?.borrowAssets ?? '[]').map((a: any) =>
                    typeof a === 'string' ? { symbol: a } : a
                ),
            }
        });
    } catch (error) {
        console.error('Error fetching wallet:', error);
        return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 });
    }
}
