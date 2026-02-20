const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const pools = await prisma.poolSnapshot.count();
    const pairs = await prisma.collateralBorrowPair.count();
    const daily = await prisma.poolDaily.count();
    const wallets = await prisma.walletPosition.count();
    const liquidations = await prisma.liquidationEvent.count();

    console.log('--- DB Data Counts ---');
    console.log('PoolSnapshots:', pools);
    console.log('PoolDailies:', daily);
    console.log('CollateralBorrowPairs:', pairs);
    console.log('WalletPositions:', wallets);
    console.log('LiquidationEvents:', liquidations);
}
check().finally(() => prisma.$disconnect());
