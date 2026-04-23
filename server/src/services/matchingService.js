/**
 * Volunteer Matching Service
 * Compares volunteers against a need based on proximity, skills, and reliability.
 */

const db = require('../db');

/**
 * Find top 3 matching volunteers for a given need
 * @param {string} needId - The ID of the community need
 * @returns {Array} List of ranked volunteers with scores
 */
const findMatches = async (needId) => {
  // 1. Get need details including location
  const need = await db('needs')
    .where({ id: needId })
    .select('*')
    .select(db.raw('ST_X(location::geometry) as lng, ST_Y(location::geometry) as lat'))
    .first();

  if (!need) throw new Error('Need not found');

  const { lat, lng, need_type } = need;

  // 2. Fetch all available volunteers with their distance from the need
  // Using PostGIS ST_Distance Sphere for accurate km distance
  const volunteers = await db('volunteers as v')
    .join('users as u', 'v.user_id', 'u.id')
    .select(
      'u.id',
      'u.name',
      'v.skills',
      'v.is_available',
      'v.completion_rate',
      'v.tasks_completed',
      db.raw('ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint(?, ?), 4326)::geography) / 1000 AS distance_km', [lng, lat])
    )
    .where('v.is_available', true);

  // 3. Score each volunteer based on the PRD formula
  const rankedVolunteers = volunteers.map(v => {
    let score = 0;

    // A. Proximity Weight (40%)
    // (1 / distance_km) * 40. We cap distance_km at 0.1 to avoid division by zero
    const proximityScore = (1 / Math.max(0.1, v.distance_km)) * 40;
    score += Math.min(40, proximityScore);

    // B. Skill Overlap (30%)
    // Check if any of volunteer's skills match the need type
    // In a real app, you'd have a mapping. Here we check if need_type is in skills array.
    const skillMatch = v.skills.includes(need_type) ? 30 : 0;
    score += skillMatch;

    // C. Availability (20%)
    // Already filtered by availability, so they get the full 20
    score += 20;

    // D. Reliability (10%)
    // completion_rate is 0-1, so multiply by 10
    score += (v.completion_rate || 0) * 10;

    return {
      ...v,
      match_score: parseFloat(score.toFixed(2))
    };
  });

  // 4. Sort by score descending and take top 3
  return rankedVolunteers
    .sort((a, b) => b.match_score - a.match_score)
    .slice(0, 3);
};

module.exports = {
  findMatches
};
