const prisma = require('../db');
const twilio = require('twilio');

// If twilio is configured in env, we can send real messages.
// Otherwise, we log to console for hackathon purposes.
const client = (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

/**
 * Broadcasts a new Need to all active volunteers within a specified radius.
 * @param {string} needId - The UUID of the Need
 * @param {number} radiusMeters - Search radius in meters (default 7000 = 7km)
 */
async function broadcastToNearbyVolunteers(needId, radiusMeters = 7000) {
  try {
    // 1. Fetch the Need details to get its location and description
    const needs = await prisma.$queryRaw`
      SELECT id, title, need_type, urgency_score, ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat 
      FROM needs WHERE id = ${needId}::uuid LIMIT 1
    `;
    
    if (!needs || needs.length === 0) return;
    const need = needs[0];

    if (!need.lng || !need.lat) {
      console.warn(`[Dispatch] Need ${needId} has no location. Cannot broadcast by proximity.`);
      return;
    }

    // 2. Find volunteers within radius who are available
    // We use PostGIS ST_DWithin.
    const volunteers = await prisma.$queryRaw`
      SELECT v.user_id, u.phone_number, u.name
      FROM volunteers v
      JOIN users u ON v.user_id = u.id
      WHERE v.is_available = true
      AND ST_DWithin(v.location::geometry, ST_SetSRID(ST_MakePoint(${need.lng}::float, ${need.lat}::float), 4326), ${radiusMeters})
    `;

    console.log(`[Dispatch] Found ${volunteers.length} available volunteers within ${radiusMeters/1000}km for Need ${needId}.`);

    if (volunteers.length === 0) {
      // Escalation immediately if no volunteers are found nearby
      await prisma.need.update({
        where: { id: needId },
        data: { isEscalated: true }
      });
      console.log(`[Dispatch] Escalated Need ${needId} immediately due to 0 volunteers in radius.`);
      return;
    }

    // 3. Send notifications
    const messageBody = `🚨 Emergency Alert: ${need.title}\nType: ${need.need_type.toUpperCase()}\nPriority: ${need.urgency_score}/10\n\nReply "ACCEPT ${needId}" or login to the app to take this mission.`;

    for (const volunteer of volunteers) {
      console.log(`[Dispatch] -> Broadcasting to ${volunteer.name} (${volunteer.phone_number})`);
      
      if (client && volunteer.phone_number) {
        try {
          await client.messages.create({
            body: messageBody,
            from: `whatsapp:${TWILIO_PHONE_NUMBER}`,
            to: `whatsapp:${volunteer.phone_number}`
          });
        } catch (msgErr) {
          console.error(`[Dispatch] Failed to send WhatsApp to ${volunteer.phone_number}:`, msgErr.message);
        }
      }
    }
  } catch (error) {
    console.error(`[Dispatch] Error broadcasting Need ${needId}:`, error);
  }
}

module.exports = {
  broadcastToNearbyVolunteers
};
