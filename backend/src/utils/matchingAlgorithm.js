const calculateMatchScore = (startup, investor) => {
  let score = 0;
  let maxScore = 100;
  let debugLog = { startup: startup.companyName, breakdown: {} };

  // Industry match (30 points)
  if (investor.investmentPreferences.industries.includes(startup.industry)) {
    score += 30;
    debugLog.breakdown.industry = `+30 (match: ${startup.industry})`;
  } else {
    debugLog.breakdown.industry = `+0 (no match: ${startup.industry} not in ${investor.investmentPreferences.industries})`;
  }

  // Stage match (25 points) 
  if (investor.investmentPreferences.stages.includes(startup.stage)) {
    score += 25;
    debugLog.breakdown.stage = `+25 (match: ${startup.stage})`;
  } else {
    debugLog.breakdown.stage = `+0 (no match: ${startup.stage} not in ${investor.investmentPreferences.stages})`;
  }

  // Investment size match (25 points)
  const askAmount = startup.fundingAsk?.amount || 0;
  if (askAmount >= investor.investmentPreferences.minInvestment && 
      askAmount <= investor.investmentPreferences.maxInvestment) {
    score += 25;
    debugLog.breakdown.funding = `+25 (${askAmount} in range ${investor.investmentPreferences.minInvestment}-${investor.investmentPreferences.maxInvestment})`;
  } else {
    debugLog.breakdown.funding = `+0 (${askAmount} out of range ${investor.investmentPreferences.minInvestment}-${investor.investmentPreferences.maxInvestment})`;
  }

  // Traction score (10 points)
  let tractionScore = 0;
  if (startup.metrics?.monthlyRevenue > 0) {
    tractionScore += 5;
  }
  if (startup.metrics?.customerCount > 10) {
    tractionScore += 5;
  }
  score += tractionScore;
  debugLog.breakdown.traction = `+${tractionScore}`;

  // Timeline match (10 points)
  if (startup.fundingAsk?.timeline === 'Immediate' || startup.fundingAsk?.timeline === '1-3 months') {
    score += 10;
    debugLog.breakdown.timeline = `+10 (urgent: ${startup.fundingAsk?.timeline})`;
  } else {
    debugLog.breakdown.timeline = `+0 (not urgent: ${startup.fundingAsk?.timeline})`;
  }

  debugLog.totalScore = score;
  console.log('Match Score Debug:', debugLog); // This will show in server logs

  return Math.round(score);
};

const getMatchedStartups = async (investor, limit = 10) => {
  const Startup = require('../models/Startup');
  
  console.log('Investor Preferences:', investor.investmentPreferences);
  
  // Start with basic query
  let query = { isPublic: true };
  console.log('Base query:', query);
  
  // Don't filter too strictly initially - let the scoring do the work
  const startups = await Startup.find(query)
    .populate('userId', 'username')
    .lean();

  console.log(`Found ${startups.length} startups in database`);

  // Calculate match scores for ALL startups
  const startupsWithScores = startups
    .map(startup => ({
      ...startup,
      matchScore: calculateMatchScore(startup, investor)
    }))
    .filter(startup => startup.matchScore > 10) // Lowered threshold for testing
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  console.log(`Returning ${startupsWithScores.length} matched startups`);

  return startupsWithScores;
};

module.exports = {
  calculateMatchScore,
  getMatchedStartups
};
