const { callGroq } = require('./groq');
const { buildExplainPrompt } = require('./promptBuilder');

async function explain(food, context) {
  const messages = buildExplainPrompt(food, context.goal, context.recentMeals);
  const rawResponse = await callGroq(messages, 0.3);
  
  try {
    const jsonStr = rawResponse.substring(rawResponse.indexOf('{'), rawResponse.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    return {
      analysis: parsed.analysis || "Analysis missing.",
      insights: parsed.insights || []
    };
  } catch (err) {
    return {
      analysis: "Unable to parse explanation from AI response.",
      insights: [rawResponse]
    };
  }
}

module.exports = { explain };
