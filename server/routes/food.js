const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const store = require('../data/store');
const { parse } = require('../utils/nlpParser');
const { success } = require('../utils/formatter');
const { validateLogFood } = require('../utils/validator');

router.post('/', (req, res, next) => {
  try {
    const val = validateLogFood(req.body);
    if (!val.valid) {
      const err = new Error(val.message);
      err.status = 400;
      throw err;
    }

    const { text } = req.body;
    const entry = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      raw: text,
      parsed: parse(text)
    };

    store.appendFoodLog(entry);
    res.json(success({ logged: entry }));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
