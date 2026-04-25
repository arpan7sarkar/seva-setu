export const calculateUrgencyPreview = ({
  need_type,
  people_affected,
}) => {
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

  // Range 1-100+
  return Number(totalScore.toFixed(1));
};
