/**
 * Urgency Scoring Service
 * Calculates and normalizes urgency scores for community needs.
 */

const WEIGHTS = {
  medical: 4,
  food: 3,
  shelter: 2,
  education: 1,
  other: 1
};

/**
 * Calculate urgency score based on PRD formula
 * @param {Object} need - Need data
 * @returns {number} Normalized score (1-10)
 */
const calculateScore = (need) => {
  const { need_type, people_affected, created_at, is_disaster_zone } = need;

  // 1. Need Type Weight (1-4)
  let score = WEIGHTS[need_type] || 1;

  // 2. People Affected (max 3 points)
  // (people_affected / 50) capped at 3 points
  const peopleScore = Math.min(3, (people_affected || 0) / 50);
  score += peopleScore;

  // 3. Time Elapsed (max 2 points)
  // (hours_since_reported / 6) capped at 2 points
  const startTime = created_at ? new Date(created_at) : new Date();
  const hoursSince = Math.abs(new Date() - startTime) / 36e5;
  const timeScore = Math.min(2, hoursSince / 6);
  score += timeScore;

  // 4. Disaster Zone Bonus (1 point)
  if (is_disaster_zone) {
    score += 1;
  }

  // Base score is now out of 10 (4 + 3 + 2 + 1 = 10)
  // Normalize to 1-10 range (minimum 1)
  const finalScore = Math.max(1, Math.min(10, score));

  return parseFloat(finalScore.toFixed(2));
};

module.exports = {
  calculateScore
};
