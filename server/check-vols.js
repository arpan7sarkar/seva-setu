const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vols = await prisma.$queryRawUnsafe('SELECT user_id, is_available FROM volunteers');
  console.log(vols);
}
main().finally(() => prisma.$disconnect());
