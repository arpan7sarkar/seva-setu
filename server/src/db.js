/**
 * Prisma database client instance.
 * Import this wherever you need to run queries.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

// Immediate connection check on startup
prisma.$connect()
  .then(() => console.log('Successfully connected to Neon Database'))
  .catch((err) => {
    console.error('FAILED to connect to Neon Database on startup:', err.message);
    console.error('Action Required: Check your internet connection or DATABASE_URL in .env');
  });

module.exports = prisma;
