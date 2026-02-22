import { PrismaClient } from '@prisma/client';
async function main() {
  const db = new PrismaClient();
  await db.liquidationEvent.deleteMany({});
  await db.walletPosition.deleteMany({});
  console.log("Cleared old zero-dollar records");
  await db.$disconnect();
}
main();
