const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const wallets = await prisma.walletPosition.findMany({ take: 3 });
    console.log(JSON.stringify(wallets, null, 2));
}
check().finally(() => prisma.$disconnect());
