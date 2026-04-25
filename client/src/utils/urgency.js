export const calculateUrgencyPreview = ({
  need_type,
  people_affected,
}) => {
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

  // Range 1-10
  return Math.min(10.0, Number(totalScore.toFixed(1)));
};
