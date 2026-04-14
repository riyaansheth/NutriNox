const CALORIE_MAP = {
  'oats': 150, 'banana': 90, 'coffee': 5, 'black coffee': 5,
  'rice': 200, 'dal': 120, 'chicken': 250, 'egg': 70, 'eggs': 140,
  'apple': 95, 'bread': 80, 'milk': 100, 'salad': 50, 'pizza': 285
};

function parse(text) {
  const lowerText = text.toLowerCase();
  
  // Detect items roughly (split by and/with/comma)
  const roughItems = lowerText.split(/\s+with\s+|\s+and\s+|,/).map(i => i.trim()).filter(Boolean);
  
  // Detect meal type
  let meal_type = 'snack';
  if (lowerText.includes('breakfast') || lowerText.includes('morning')) meal_type = 'breakfast';
  else if (lowerText.includes('lunch') || lowerText.includes('afternoon')) meal_type = 'lunch';
  else if (lowerText.includes('dinner') || lowerText.includes('night')) meal_type = 'dinner';

  // Estimate calories
  let calories_estimate = 0;
  for (const item of roughItems) {
    let matched = false;
    for (const [key, cals] of Object.entries(CALORIE_MAP)) {
      if (item.includes(key)) {
        calories_estimate += cals;
        matched = true;
        break;
      }
    }
    if (!matched) calories_estimate += 100; // default unknown per item
  }

  return {
    items: roughItems,
    meal_type,
    calories_estimate
  };
}

module.exports = {
  parse
};
