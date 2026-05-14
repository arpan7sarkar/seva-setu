const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Applying PostGIS GIST Optimizations ---');
  try {
    // Create GIST indexes if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS volunteers_location_gist ON volunteers USING GIST (location);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS needs_location_gist ON needs USING GIST (location);
    `);
    
    // Update statistics
    await prisma.$executeRawUnsafe('ANALYZE volunteers;');
    await prisma.$executeRawUnsafe('ANALYZE needs;');
    
    console.log('✅ Database optimization complete.');
  } catch (err) {
    console.error('❌ Optimization error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
