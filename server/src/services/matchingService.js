/**
 * Volunteer Matching Service
 * Compares volunteers against a need based on proximity, skills, and reliability.
 */

const prisma = require('../db');

/**
 * Find top 3 matching volunteers for a given need
 * @param {string} needId - The ID of the community need
 * @returns {Array} List of ranked volunteers with scores
 */
const findMatches = async (needId) => {
  // 1. Get need details including location
  const needRows = await prisma.$queryRaw`
    SELECT id, title, need_type,
           ST_X(location::geometry) as lng,
           ST_Y(location::geometry) as lat
    FROM needs
    WHERE id = ${needId}::uuid
  `;

  if (!needRows || needRows.length === 0) throw new Error('Need not found');
  const need = needRows[0];

  const { lat, lng, need_type } = need;

  // 2. Fetch available volunteers WITHIN 6km, ordered by proximity
  const volunteers = await prisma.$queryRaw`
    SELECT
      u.id,
      u.name,
      v.skills,
      v.is_available,
      v.completion_rate,
      v.tasks_completed,
      ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography) / 1000 AS distance_km
    FROM volunteers v
    JOIN users u ON v.user_id = u.id
    WHERE v.is_available = true
    AND v.location IS NOT NULL
    AND ST_DWithin(v.location::geography, ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)::geography, 15000)
    ORDER BY v.location <-> ST_SetSRID(ST_MakePoint(${lng}::float, ${lat}::float), 4326)
    LIMIT 10
  `;

  // 3. Score each volunteer
  const rankedVolunteers = volunteers.map((v) => {
    let score = 0;

    // A. Proximity (Weight 50%)
    const distKm = Number(v.distance_km) || 0;
    const proximityScore = Math.max(0, 50 * (1 - distKm / 15));
    score += proximityScore;

    // B. Skill Match (Weight 30%)
    const skills = Array.isArray(v.skills) ? v.skills : [];
    if (skills.includes(need_type)) {
      score += 30;
    }

    // C. Reliability (Weight 20%)
    const completionRate = Number(v.completion_rate) || 0;
    score += completionRate * 20;

    return {
      ...v,
      distance_km: distKm,
      match_score: parseFloat(score.toFixed(2)),
    };
  });

  // 4. Sort by score descending and take top 5
  return rankedVolunteers
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 5);
};

module.exports = {
  findMatches,
};
