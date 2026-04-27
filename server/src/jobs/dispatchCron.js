const cron = require('node-cron');
const prisma = require('../db');
const { broadcastToNearbyVolunteers } = require('../services/dispatchService');

// Run every 1 minute
cron.schedule('* * * * *', async () => {
  console.log('[Cron] Running dispatch automation checks...');

  try {
    const now = new Date();
    // 5 minutes ago
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    // 30 minutes ago
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

    // 1. ESCALATION: 30 minutes passed and still pending
    const needsToEscalate = await prisma.need.findMany({
      where: {
        status: 'pending', // or 'open' depending on how it's saved
        isEscalated: false,
        createdAt: {
          lt: thirtyMinutesAgo
        }
      }
    });

    for (const need of needsToEscalate) {
      console.log(`[Cron] Escalating Need ${need.id} (no acceptance in 30 mins)`);
      await prisma.need.update({
        where: { id: need.id },
        data: { isEscalated: true }
      });
      // Optionally notify coordinators via email or WhatsApp here.
    }

    // 2. REMINDER: 5 minutes passed, still pending, haven't reminded yet
    const needsToRemind = await prisma.need.findMany({
      where: {
        status: 'pending', // or 'open'
        dispatchReminded: false,
        isEscalated: false,
        createdAt: {
          lt: fiveMinutesAgo,
          gte: thirtyMinutesAgo // don't remind if it's already escalated
        }
      }
    });

    for (const need of needsToRemind) {
      console.log(`[Cron] Reminding volunteers for Need ${need.id} (5 mins passed)`);
      await broadcastToNearbyVolunteers(need.id, 7000);
      
      await prisma.need.update({
        where: { id: need.id },
        data: { dispatchReminded: true }
      });
    }

  } catch (error) {
    console.error('[Cron] Error in dispatch automation:', error);
  }
});
