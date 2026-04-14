function sanitize(text) {
  return text.toString().replace(/`/g, '').replace(/</g, '').replace(/>/g, '');
}

function getContextBlock(goal, recentMeals) {
  let context = `User Goal: ${sanitize(goal)}\n`;
  context += `Current Time: ${new Date().toISOString()}\n`;
  if (recentMeals && recentMeals.length > 0) {
    context += `Recent Meals:\n`;
    recentMeals.forEach(meal => {
      context += `- [${meal.timestamp}] ${sanitize(meal.raw)}\n`;
    });
  } else {
    context += `Recent Meals: None logged yet.\n`;
  }
  return context;
}

const SYSTEM_ROLE = "You are NutrinoX, an AI nutrition intelligence system. You think, predict, and advise. Provide concise, personalized, and actionable advice.";

function buildChatPrompt(message, goal, recentMeals) {
  return [
    { role: "system", content: SYSTEM_ROLE },
    { role: "user", content: `${getContextBlock(goal, recentMeals)}\nUser Message: """${sanitize(message)}"""\nReply accurately and concisely.` }
  ];
}

function buildSymptomPrompt(symptoms, goal, recentMeals) {
  return [
    { role: "system", content: SYSTEM_ROLE + " Your task is to decode symptoms based on recent meals." },
    { role: "user", content: `${getContextBlock(goal, recentMeals)}\nSymptoms: """${sanitize(symptoms)}"""\nProvide a likely nutritional cause and a bulleted list of insights. Output raw JSON format: {"analysis": "...", "insights": ["..."]}` }
  ];
}

function buildExplainPrompt(food, goal, recentMeals) {
  return [
    { role: "system", content: SYSTEM_ROLE + " Explain the metabolic behavior of this food." },
    { role: "user", content: `${getContextBlock(goal, recentMeals)}\nFood: """${sanitize(food)}"""\nExplain macro impacts, digestion timeline, and goal alignment. Output raw JSON format: {"analysis": "...", "insights": ["..."]}` }
  ];
}

function buildHabitPrompt(recentMeals, goal) {
  return [
    { role: "system", content: SYSTEM_ROLE + " Analyze the user's eating patterns." },
    { role: "user", content: `${getContextBlock(goal, recentMeals)}\nAnalyze the patterns from the food logs. Provide 3 specific habits and corrective actions. Output raw JSON format: {"analysis": "...", "insights": ["..."]}` }
  ];
}

function buildAlternativePrompt(craving, goal, recentMeals) {
  return [
    { role: "system", content: SYSTEM_ROLE + " Suggest 3 healthier alternatives for cravings." },
    { role: "user", content: `${getContextBlock(goal, recentMeals)}\nCraving: """${sanitize(craving)}"""\nProvide 3 healthier alternatives aligned with the goal. Output raw JSON format: {"suggestions": [{"item": "...", "reason": "..."}]}` }
  ];
}

module.exports = {
  buildChatPrompt,
  buildSymptomPrompt,
  buildExplainPrompt,
  buildHabitPrompt,
  buildAlternativePrompt
};
