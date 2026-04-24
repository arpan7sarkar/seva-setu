/**
 * Urgency Scoring Service
 * Calculates and normalizes urgency scores for community needs.
 */

const WEIGHTS = {
  medical: 5,
  food: 4,
  shelter: 3,
  education: 2,
  other: 2
};

/**
 * Calculate urgency score based on an improved multi-factor formula
 * @param {Object} need - Need data
 * @returns {number} Normalized score (1-10)
 */
const calculateScore = (need) => {
  const { need_type, people_affected, created_at, is_disaster_zone } = need;

  // 1. Need Type Weight (1-3)
  // We keep this lower to allow 'People Affected' to drive the score more
  const weights = { medical: 3, food: 2, shelter: 2, education: 1, other: 1 };
  let score = weights[need_type] || 1;

  // 2. People Affected (Logarithmic scaling, max 6 points)
  // This ensures 10 people, 100 people, and 1000 people all result in different scores
  // Formula: 2 * log10(people + 1)
  const peopleCount = Math.max(0, Number(people_affected) || 0);
  const peopleScore = Math.min(6, Math.log10(peopleCount + 1) * 2);
  score += peopleScore;

  // 3. Time Elapsed (max 1 point)
  const startTime = created_at ? new Date(created_at) : new Date();
  const hoursSince = Math.abs(new Date() - startTime) / 36e5;
  const timeScore = Math.min(1, hoursSince / 24); // Very slow creep
  score += timeScore;

  // 4. Disaster Zone Bonus (1 point)
  if (is_disaster_zone) {
    score += 1;
  }

  // Max theoretical score is now 5 + 3 + 2 + 2 = 12, but we cap at 10.
  const finalScore = Math.max(1, Math.min(10, score));

  return parseFloat(finalScore.toFixed(2));
};

module.exports = {
  calculateScore
};
