# NutrinoX – AI Nutrition Intelligence System

> An AI-powered nutrition intelligence system that helps users make smarter food decisions in real time — powered by Groq API and llama-3.3-70b-versatile.

**Core Philosophy**: Thinks. Predicts. Advises.

NutrinoX is a context-aware AI nutrition assistant that analyzes your eating habits, decodes symptoms, and delivers personalized, actionable food guidance in real time. It is designed as a decision engine, not just a tracker. 

## Features

1. **Personal Food Coach (Chat)**: Get personalized nutrition advice and meal suggestions via a free-flowing chat interface.
2. **Reverse Symptom Engine**: Decode symptoms like bloating or low energy based on your recently logged meals.
3. **Meal Explanation Engine**: Understand the metabolic behavior, digestion timeline, and energy curve of specific foods.
4. **Habit Pattern Analyzer**: Automatically detects behavioral patterns in your eating habits and suggests corrective actions.
5. **Alternative Suggestion Engine**: Enter a craving to receive 3 healthier alternatives that align with your health goals.

## Architecture Pattern

NutrinoX uses a thin-client / thick-server architecture.
- **Frontend**: Vanilla JS, HTML, CSS (< 50KB payload), Single Page Application
- **Backend**: Node.js, Express
- **AI Core**: Groq API (llama-3.3-70b-versatile)
- **Data Storage**: Local JSON file (`store.json`) for zero dependencies

```
Browser <-> Express Server (Routes + Services) <-> Groq AI API
               |
          store.json
```

## API Endpoints

All endpoints respond with: `{ "success": boolean, "data": object, "error": string }`

- `POST /chat` - Generate an AI chat response based on user goals and history
  - Payload: `{ "message": "string" }`
- `POST /log-food` - Log a meal naturally
  - Payload: `{ "text": "string" }`
- `POST /analyze` - Analyze meals/habits based on type (`symptom`, `explain`, `habits`)
  - Payload: `{ "type": "symptom", "input": "string" }`
- `POST /suggest` - Receive craving alternatives
  - Payload: `{ "craving": "string" }`

## Setup Instructions

1. Clone the repository and navigate into it.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Establish your environment variables:
   ```bash
   cp .env.example .env
   ```
   **Important:** Add your `GROQ_API_KEY` to the `.env` file. You can obtain a free key from console.groq.com.
4. Start the server:
   ```bash
   node server/index.js
   ```
5. Open your browser and navigate to `http://localhost:8080`.

## Assumptions & Limitations

- Application runs in a single-user mode. Multi-user authentication is not supported.
- `store.json` manages a maximum of 500 recent meal logs.
- The system heavily relies on the availability of the Groq API. Failures or timeouts on Groq's side will render intelligent components temporarily unavailable.
- Natural Language component for estimating meal calories is rudimentary and based on a small hardcoded set; the AI portion relies on Groq.
