const { callGroq } = require('./groq');
const { buildHabitPrompt } = require('./promptBuilder');

async function analyze(recentMeals, goal) {
  const messages = buildHabitPrompt(recentMeals, goal);
  const rawResponse = await callGroq(messages, 0.3);
  
  try {
    const jsonStr = rawResponse.substring(rawResponse.indexOf('{'), rawResponse.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    return {
      analysis: parsed.analysis || "Pattern analysis missing.",
      insights: parsed.insights || []
    };
  } catch (err) {
    return {
      analysis: "Unable to parse patterns from AI response.",
      insights: [rawResponse]
    };
  }
}

module.exports = { analyze };
