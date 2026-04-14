const { callGroq } = require('./groq');
const { buildSymptomPrompt } = require('./promptBuilder');

async function analyze(symptoms, context) {
  const messages = buildSymptomPrompt(symptoms, context.goal, context.recentMeals);
  const rawResponse = await callGroq(messages, 0.2);
  
  try {
    const jsonStr = rawResponse.substring(rawResponse.indexOf('{'), rawResponse.lastIndexOf('}') + 1);
    const parsed = JSON.parse(jsonStr);
    return {
      analysis: parsed.analysis || "Analysis missing.",
      insights: parsed.insights || []
    };
  } catch (err) {
    return {
      analysis: "Unable to parse symptom analysis from AI response.",
      insights: [rawResponse]
    };
  }
}

module.exports = { analyze };
