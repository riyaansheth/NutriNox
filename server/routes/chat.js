const express = require('express');
const router = express.Router();
const store = require('../data/store');
const { callGroq } = require('../services/groq');
const { buildChatPrompt } = require('../services/promptBuilder');
const { success } = require('../utils/formatter');
const { validateChat } = require('../utils/validator');

router.post('/', async (req, res, next) => {
  try {
    const val = validateChat(req.body);
    if (!val.valid) {
      const err = new Error(val.message);
      err.status = 400;
      throw err;
    }

    const { message } = req.body;
    const goal = store.getUserGoal();
    const recentMeals = store.getRecentMeals(10);

    const messages = buildChatPrompt(message, goal, recentMeals);
    const reply = await callGroq(messages, 0.5);

    res.json(success({ reply }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
