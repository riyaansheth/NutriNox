const { callGroq } = require('./groq');
const { buildAlternativePrompt } = require('./promptBuilder');

async function suggest(craving, context) {
  const messages = buildAlternativePrompt(craving, context.goal, context.recentMeals);
  const rawResponse = await callGroq(messages, 0.5);
  
  try {
    const jsonStr = rawResponse.substring(rawResponse.indexOf('{'), rawResponse.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    return {
      suggestions: parsed.suggestions || []
    };
  } catch (err) {
    return {
      suggestions: [{ item: "Error parsing AI response", reason: rawResponse }]
    };
  }
}

module.exports = { suggest };
