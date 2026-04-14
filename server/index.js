require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const path = require('path');
const store = require('./data/store');
const errorHandler = require('./middleware/errorHandler');

// Boot check
if (!process.env.GROQ_API_KEY) {
  console.error("CRITICAL ERROR: GROQ_API_KEY is not set in environment.");
  process.exit(1);
}

// Ensure store.json exists
store.initStore();

const app = express();
const PORT = process.env.PORT || 3001;

const cors = require('cors');

// Middleware
app.use(express.json());

// CORS Middleware
app.use(cors());

// Routes
app.use('/chat', require('./routes/chat'));
app.use('/log-food', require('./routes/food'));
app.use('/analyze', require('./routes/analyze'));
app.use('/suggest', require('./routes/suggest'));

// Global Error Handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`NutrinoX server is running on http://localhost:${PORT}`);
});
