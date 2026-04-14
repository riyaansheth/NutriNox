const express = require('express');
const router = express.Router();
const store = require('../data/store');
const alternativeEngine = require('../services/alternativeEngine');
const { success } = require('../utils/formatter');
const { validateSuggest } = require('../utils/validator');

router.post('/', async (req, res, next) => {
  try {
    const val = validateSuggest(req.body);
    if (!val.valid) {
      const err = new Error(val.message);
      err.status = 400;
      throw err;
    }

    const { craving } = req.body;
    const goal = store.getUserGoal();
    const recentMeals = store.getRecentMeals(10);

    const result = await alternativeEngine.suggest(craving, { goal, recentMeals });
    res.json(success(result));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
