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
  const { need_type, people_affected, is_verified } = need;

  // 1. Base Category Weights
  const weights = { 
    medical: 50, 
    food: 30, 
    shelter: 20, 
    education: 10, 
    other: 10 
  };
  
  let baseScore = weights[need_type] || 10;

  // 2. Scale by People Affected (+0.5 per person)
  const peopleCount = Math.max(0, Number(people_affected) || 0);
  const peopleBonus = peopleCount * 0.5;
  
  let totalScore = baseScore + peopleBonus;

  // 3. Verification Multiplier (x2 if verified)
  if (is_verified) {
    totalScore *= 2;
  }

  // We return the raw score (can exceed 100 as per blueprint)
  return parseFloat(totalScore.toFixed(2));
};

module.exports = {
  calculateScore
};
