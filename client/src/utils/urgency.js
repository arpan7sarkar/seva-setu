export const calculateUrgencyPreview = ({
  need_type,
  people_affected,
  is_disaster_zone,
  created_at,
}) => {
  // 1. Need Type Weight (1-3)
  const weights = { medical: 3, food: 2, shelter: 2, education: 1, other: 1 };
  let score = weights[need_type] || 1;

  // 2. People Affected (Logarithmic scaling, max 6 points)
  // Ensures 10, 100, and 1000 people all result in different scores
  const peopleCount = Math.max(0, Number(people_affected) || 0);
  const peopleScore = Math.min(6, Math.log10(peopleCount + 1) * 2);
  score += peopleScore;

  // 3. Time Elapsed (max 1 point)
  const createdAt = created_at ? new Date(created_at) : new Date();
  const hoursSince = Math.abs(new Date() - createdAt) / 36e5;
  const timeScore = Math.min(1, hoursSince / 24);
  score += timeScore;

  // 4. Disaster Zone Bonus (1 point)
  if (is_disaster_zone) score += 1;

  // Range 1-10
  return Number(Math.max(1, Math.min(10, score)).toFixed(1));
};
