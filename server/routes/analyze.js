const express = require('express');
const router = express.Router();
const store = require('../data/store');
const symptomEngine = require('../services/symptomEngine');
const mealExplainer = require('../services/mealExplainer');
const habitAnalyzer = require('../services/habitAnalyzer');
const { success } = require('../utils/formatter');
const { validateAnalyze } = require('../utils/validator');

router.post('/', async (req, res, next) => {
  try {
    const val = validateAnalyze(req.body);
    if (!val.valid) {
      const err = new Error(val.message);
      err.status = 400;
      throw err;
    }

    const { type, input } = req.body;
    const goal = store.getUserGoal();
    let result;

    if (type === 'symptom') {
      const recentMeals = store.getRecentMeals(10);
      result = await symptomEngine.analyze(input, { goal, recentMeals });
    } else if (type === 'explain') {
      const recentMeals = store.getRecentMeals(10);
      result = await mealExplainer.explain(input, { goal, recentMeals });
    } else if (type === 'habits') {
      const recentMeals = store.getRecentMeals(20);
      result = await habitAnalyzer.analyze(recentMeals, goal);
    }

    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
