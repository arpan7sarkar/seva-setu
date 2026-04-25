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

  // 1. Base Category Weights (Max 5 points)
  const weights = { 
    medical: 5.0, 
    accidental: 4.5,
    rescue: 4.0,
    food: 3.5, 
    shelter: 3.0, 
    other: 1.0 
  };
  
  let baseScore = weights[need_type] || 1.0;

  // 2. Scale by People Affected (Max 3 points, 0.1 per person, caps at 30 people)
  const peopleCount = Math.max(0, Number(people_affected) || 0);
  const peopleBonus = Math.min(3.0, peopleCount * 0.1);
  
  let totalScore = baseScore + peopleBonus;

  // 3. Verification Bonus (+2 points if verified by GPS or AI)
  if (is_verified) {
    totalScore += 2.0;
  }

  // Final score normalized to 1-10 range
  return Math.min(10.0, parseFloat(totalScore.toFixed(1)));
};

module.exports = {
  calculateScore
};
