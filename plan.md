# NutrinoX – AI Nutrition Intelligence System
## Project Plan & Enhanced Specification

> An AI-powered nutrition intelligence system that helps users make smarter food decisions in real time — powered by Groq API and llama3-70b-8192.

---

## Part 1: Enhanced Product Specification

### 1.1 Product Identity

| Field | Value |
|---|---|
| App Name | NutrinoX |
| Full Name | NutrinoX – AI Nutrition Intelligence System |
| Engine | Groq API (llama3-70b-8192) |
| Core Philosophy | Thinks. Predicts. Advises. |
| Positioning | A decision engine — not a tracker |

**One-line pitch:**  
NutrinoX is a context-aware AI nutrition assistant that analyzes your eating habits, decodes symptoms, and delivers personalized, actionable food guidance in real time.

---

### 1.2 Problem → Feature Map

| Real User Problem | NutrinoX Feature |
|---|---|
| "I don't know what to eat for my goal" | A. Personal Food Coach (Chat) |
| "I feel bloated/tired — what food is causing this?" | B. Reverse Symptom Engine |
| "Is what I'm eating actually good for me?" | C. Meal Explanation Engine |
| "I keep eating late at night and don't know why" | D. Habit Pattern Analyzer |
| "I want chips but know I shouldn't" | E. Alternative Suggestion Engine |

---

### 1.3 Tech Stack (Locked)

| Layer | Technology | Rationale |
|---|---|---|
| Backend runtime | Node.js v18+ | Non-blocking I/O; lightweight |
| HTTP framework | Express 4.x | Minimal, well-tested, modular |
| AI inference | Groq API (llama3-70b-8192) | Fastest open-weight LLM inference available |
| Storage | JSON file (`store.json`) | Zero dependencies; sufficient for single-user |
| Frontend | HTML5 + CSS3 + Vanilla JS | No framework overhead; < 50 KB total |
| Config | dotenv | Standard secret management |
| IDs | uuid v4 | Unique food log identifiers |

**Hard constraints:**
- No React, Vue, Angular, or any JS framework
- No SQL or NoSQL database
- No additional npm packages beyond the four above
- Repository ZIP must be under 1 MB (excluding `node_modules`)

---

### 1.4 Core Features — Detailed Spec

#### A. Personal Food Coach (Chat)
- **Input:** Free-text message from user
- **Context injected:** User goal, last 10 meals with timestamps, current time + day
- **Output:** Personalized nutrition advice, meal suggestion, or direct answer
- **Endpoint:** `POST /chat`
- **Prompt temperature:** 0.5

#### B. Reverse Symptom Engine
- **Input:** Comma-separated or natural language symptoms (e.g., "bloating, low energy, headache")
- **Context injected:** Recent meals, user goal
- **Output:** Likely nutritional causes, food and hydration recommendations
- **Endpoint:** `POST /analyze` with `type: "symptom"`
- **Prompt temperature:** 0.2 (accuracy critical)

#### C. Meal Explanation Engine
- **Input:** Food name or description (e.g., "white rice with dal")
- **Context injected:** User goal, time of day
- **Output:** Macronutrient behavior, digestion timeline, energy curve, goal alignment score
- **Endpoint:** `POST /analyze` with `type: "explain"`
- **Prompt temperature:** 0.3

#### D. Habit Pattern Analyzer
- **Input:** Triggered automatically — uses stored food logs
- **Context injected:** Last 20 food log entries with timestamps
- **Output:** 3 detected behavioral patterns, impact assessment, corrective actions
- **Endpoint:** `POST /analyze` with `type: "habits"`
- **Prompt temperature:** 0.3

#### E. Alternative Suggestion Engine
- **Input:** Craving description (e.g., "ice cream", "fried food late night")
- **Context injected:** User goal, time of day
- **Output:** 3 healthier alternatives, each with a specific reason tied to user goal
- **Endpoint:** `POST /suggest`
- **Prompt temperature:** 0.5

---

### 1.5 API Contract

All endpoints return this envelope:
```json
{ "success": true,  "data": { ... }, "error": null }
{ "success": false, "data": null,    "error": "Description of error" }
```

| Endpoint | Method | Required Body Fields | Success Data Shape |
|---|---|---|---|
| `/chat` | POST | `message` (string) | `{ reply: string }` |
| `/log-food` | POST | `text` (string) | `{ logged: { id, timestamp, raw, parsed } }` |
| `/analyze` | POST | `type` (enum), `input` (string) | `{ analysis: string, insights: string[] }` |
| `/suggest` | POST | `craving` (string) | `{ suggestions: [{ item, reason }] }` |

**Validation rules:**
- `message` — required, string, max 1000 characters
- `text` — required, string, max 500 characters
- `type` — required, one of: `"symptom"`, `"explain"`, `"habits"`
- `input` — required when type is `symptom` or `explain`, string, max 500 chars
- `craving` — required, string, max 200 characters

---

### 1.6 Groq API Integration Spec

**Endpoint:** `POST https://api.groq.com/openai/v1/chat/completions`

**Request shape:**
```json
{
  "model": "llama3-70b-8192",
  "messages": [
    { "role": "system", "content": "<NutrinoX system role>" },
    { "role": "user",   "content": "<structured prompt with context>" }
  ],
  "temperature": 0.3,
  "max_tokens": 512
}
```

**Auth:** `Authorization: Bearer ${process.env.GROQ_API_KEY}`

**Error handling matrix:**

| Groq HTTP Status | Meaning | NutrinoX Response |
|---|---|---|
| 401 | Invalid API key | 500 — "Authentication error" |
| 429 | Rate limit hit | 429 — "Rate limit reached, retry shortly" |
| 500/503 | Groq service error | 503 — "AI service temporarily unavailable" |
| Network timeout | No response in 10s | 504 — "Request timed out" |

**Key rules:**
- API key stored ONLY in `.env` — never in source code, never returned to frontend
- `GROQ_API_KEY` validated on server startup — fail fast if missing
- Request timeout set to 10 seconds via `AbortController`

---

### 1.7 Data Storage Spec

**File:** `server/data/store.json`

```json
{
  "user": {
    "goal": "weight loss",
    "preferences": [],
    "restrictions": []
  },
  "foodLogs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2025-04-14T08:30:00.000Z",
      "raw": "oats with banana and black coffee",
      "parsed": {
        "items": ["oats", "banana", "black coffee"],
        "meal_type": "breakfast",
        "calories_estimate": 310
      }
    }
  ],
  "insights": {
    "lastGeneratedAt": null,
    "summary": ""
  }
}
```

**Rules:**
- Auto-prune `foodLogs` when count exceeds 500 (remove oldest)
- Never write `undefined` or `null` entries to `foodLogs`
- `insights.summary` considered stale after 24 hours — regenerate on next request
- File writes are synchronous to prevent corruption from concurrent requests

---

### 1.8 Security Requirements

| Requirement | Implementation |
|---|---|
| API key never exposed | `.env` only; `.gitignore` enforced; never in responses |
| Input length caps | 1000 / 500 / 200 char limits per field |
| Prompt injection prevention | User text wrapped in `"""` delimiters inside prompts |
| JSON parse safety | Express handles malformed body with 400 before route runs |
| Error detail control | Stack traces logged server-side only; generic message to client |
| No dynamic file paths | `store.json` path hardcoded — no user-controlled file access |

---

### 1.9 Performance Requirements

| Metric | Target |
|---|---|
| Repository ZIP size | < 1 MB |
| `node_modules` footprint | < 300 KB |
| API response time (p95) | < 3 seconds (Groq inference ~1–2s) |
| Frontend total payload | < 50 KB (HTML + CSS + JS combined) |
| Max context sent to Groq | 10 meals + goal + timestamp (< 800 tokens) |
| Startup time | < 500ms |

---

## Part 2: Implementation Plan

### Phase Overview

```
Phase 1 — Foundation          (Day 1)     Repo, config, server boot
Phase 2 — Data Layer          (Day 1)     store.json + store.js
Phase 3 — AI Engine           (Day 2)     groq.js + promptBuilder.js
Phase 4 — Backend Features    (Day 2–3)   All 4 routes + 5 services
Phase 5 — Frontend            (Day 3–4)   UI + API integration
Phase 6 — Hardening           (Day 4)     Validation, errors, security
Phase 7 — Final Delivery      (Day 5)     README, cleanup, ZIP
```

---

### Phase 1 — Foundation

**Goal:** Working Express server with environment config.

**Tasks:**
1. Initialize repo with `git init`
2. Create `package.json` with only: `express`, `dotenv`, `uuid`
3. Create `.env` with `GROQ_API_KEY=` and `PORT=3000`
4. Create `.env.example` with placeholder values
5. Create `.gitignore`: `node_modules/`, `.env`, `*.log`
6. Build `server/index.js`:
   - Load dotenv
   - Validate `GROQ_API_KEY` exists — throw if missing
   - Register `express.json()` middleware
   - Mount placeholder routes
   - Register global error handler
   - Start server

**Done when:** `node server/index.js` starts without error; `GET /` returns 200.

---

### Phase 2 — Data Layer

**Goal:** Persistent JSON storage with clean read/write interface.

**Tasks:**
1. Create `server/data/store.json` with default schema (user + empty foodLogs + empty insights)
2. Build `server/data/store.js`:
   - `getData()` — `JSON.parse(fs.readFileSync(...))`
   - `saveData(obj)` — `fs.writeFileSync(...)` with `JSON.stringify(obj, null, 2)`
   - `appendFoodLog(entry)` — push + auto-prune at 500 + save
   - `getRecentMeals(n)` — slice last n from foodLogs
   - `getUserGoal()` — return user.goal
   - `setUserGoal(goal)` — update + save
3. Build `server/utils/nlpParser.js`:
   - Keyword-based meal type detection (breakfast/lunch/dinner/snack)
   - Comma/and splitting for item extraction
   - Simple calorie estimation map (oats: 150, banana: 90, etc.)

**Done when:** Unit-test `appendFoodLog` + `getRecentMeals` manually in Node REPL.

---

### Phase 3 — AI Engine

**Goal:** Groq API integration + all prompt templates.

**Tasks:**

**`server/services/groq.js`:**
1. Export `callGroq(messages)` function
2. Use `fetch` (Node 18 native) to POST to Groq endpoint
3. Set `Authorization` header from `process.env.GROQ_API_KEY`
4. Set 10-second timeout via `AbortController`
5. Parse `choices[0].message.content` from response
6. Map HTTP error codes to descriptive thrown errors

**`server/services/promptBuilder.js`:**
1. `getContextBlock(goal, recentMeals)` — shared context string builder
2. `buildChatPrompt(message, context)` — Chat feature
3. `buildSymptomPrompt(symptoms, context)` — Symptom engine
4. `buildExplainPrompt(food, context)` — Meal explainer
5. `buildHabitPrompt(logs)` — Habit analyzer
6. `buildAlternativePrompt(craving, context)` — Alternative engine

**Done when:** `callGroq` tested with a hardcoded message and returns valid text.

---

### Phase 4 — Backend Features

**Goal:** All 4 routes + 5 feature services fully wired.

#### 4.1 Utilities

**`server/utils/formatter.js`:**
```javascript
success(data)  → { success: true, data, error: null }
error(message) → { success: false, data: null, error: message }
```

**`server/utils/validator.js`:**
- `validateChat`, `validateLogFood`, `validateAnalyze`, `validateSuggest`
- Each returns `{ valid: bool, message: string }`

#### 4.2 Feature Services

**`server/services/symptomEngine.js`:**
- Accept symptoms string + context
- Call `promptBuilder.buildSymptomPrompt`
- Call `callGroq`
- Return `{ analysis, insights[] }`

**`server/services/mealExplainer.js`:**
- Accept food string + context
- Call `promptBuilder.buildExplainPrompt`
- Call `callGroq`
- Return `{ analysis, insights[] }`

**`server/services/habitAnalyzer.js`:**
- Accept food logs array
- Call `promptBuilder.buildHabitPrompt`
- Call `callGroq`
- Return `{ analysis, insights[] }`

**`server/services/alternativeEngine.js`:**
- Accept craving string + context
- Call `promptBuilder.buildAlternativePrompt`
- Call `callGroq`
- Parse response into `[{ item, reason }]` array (3 items)
- Return `{ suggestions[] }`

#### 4.3 Routes

**`server/routes/chat.js` — `POST /chat`:**
1. Validate body → 400 if invalid
2. `getRecentMeals(10)` + `getUserGoal()`
3. `promptBuilder.buildChatPrompt(message, context)`
4. `callGroq(messages)`
5. `formatter.success({ reply })`

**`server/routes/food.js` — `POST /log-food`:**
1. Validate body → 400 if invalid
2. `nlpParser.parse(text)` → structured entry
3. `store.appendFoodLog({ id: uuid(), timestamp: new Date().toISOString(), raw: text, parsed })`
4. `formatter.success({ logged: entry })`

**`server/routes/analyze.js` — `POST /analyze`:**
1. Validate body → 400 if invalid
2. Route by `type`:
   - `symptom` → `symptomEngine.analyze(input, context)`
   - `explain` → `mealExplainer.explain(input, context)`
   - `habits` → `habitAnalyzer.analyze(store.getRecentMeals(20))`
3. `formatter.success(result)`

**`server/routes/suggest.js` — `POST /suggest`:**
1. Validate body → 400 if invalid
2. `getRecentMeals(10)` + `getUserGoal()`
3. `alternativeEngine.suggest(craving, context)`
4. `formatter.success(result)`

**Done when:** All 4 endpoints tested with curl/Postman and return valid JSON.

---

### Phase 5 — Frontend

**Goal:** Clean, functional single-page UI connected to all backend endpoints.

**Tasks:**

**`public/index.html`:**
1. Single HTML file — no external CSS/JS CDN links
2. Three tab sections: Chat, Log Food, Insights
3. Chat: message list div + input + send button
4. Log Food: textarea + log button + recent logs list
5. Insights: 4 cards — Symptom Check, Explain Food, Habit Report, Alternatives

**`public/style.css`:**
1. CSS variables for color scheme (dark-green + off-white + accent)
2. Tab navigation styles + active state
3. Chat bubble styles (user vs NutrinoX)
4. Card grid (2-col on desktop, 1-col on mobile)
5. Input + button base styles
6. Loading spinner (pure CSS)
7. Responsive: `@media (max-width: 600px)`

**`public/app.js`:**
1. `ApiClient` — `post(endpoint, body)` with error normalization
2. `NavController` — `showTab(name)`, click listeners
3. `ChatModule` — `send()`, `renderBubble(role, text)`, auto-scroll
4. `FoodLogModule` — `logFood()`, `refreshRecentLogs()`
5. `InsightsModule` — `runSymptomCheck()`, `explainMeal()`, `getHabitReport()`, `getSuggestions()`
6. `StateManager` — `{ userGoal, chatHistory }` in memory
7. `init()` — bind all event listeners on `DOMContentLoaded`

**Done when:** All 5 features usable from the browser without console errors.

---

### Phase 6 — Hardening

**Goal:** Production-ready error handling, input safety, edge cases.

**Tasks:**
1. Add `try/catch` to every route handler — delegate to `next(err)`
2. Build `server/middleware/errorHandler.js` — global Express error handler
3. Add `AbortController` timeout to `groq.js`
4. Add startup check: if `GROQ_API_KEY` is empty/missing, log error and exit
5. Add `store.json` initialization check: create with defaults if file missing
6. Cap all user inputs at max length before they reach services
7. Sanitize user text in prompt templates (strip backticks, angle brackets)
8. Test: missing fields → confirm 400; Groq down → confirm 503; huge input → confirm 400

**Done when:** All edge cases return proper status codes and error messages.

---

### Phase 7 — Final Delivery

**Goal:** Clean, documented, compressed deliverable under 1 MB.

**Tasks:**

**README.md — must include:**
1. Project title + one-line description
2. Core philosophy (thinks / predicts / advises)
3. Feature list with one-sentence description each
4. Architecture diagram (ASCII)
5. Complete API endpoint docs with example request/response
6. Groq API setup explanation
7. Setup instructions:
   ```
   git clone <repo>
   cd nutrinoX
   npm install
   cp .env.example .env
   # Add your GROQ_API_KEY to .env
   node server/index.js
   # Open http://localhost:3000
   ```
8. Assumptions section
9. Limitations section

**Cleanup:**
1. Delete `node_modules/`
2. Delete any `.log` files
3. Confirm `.env` is NOT committed (check `.gitignore`)
4. Run `npm install` fresh — confirm works
5. Create ZIP: `zip -r nutrinoX.zip . --exclude "node_modules/*" --exclude ".env"`
6. Verify ZIP size < 1 MB
7. Extract ZIP in temp folder — confirm `npm install && node server/index.js` works

**Done when:** ZIP extracted in a clean directory runs without errors and all 5 features work end-to-end.

---

## Part 3: Checklist

### Backend
- [ ] Express server starts on configured PORT
- [ ] `GROQ_API_KEY` missing → server refuses to start with clear error
- [ ] `store.json` missing → auto-created with defaults
- [ ] `POST /chat` returns `{ reply }` with user context injected
- [ ] `POST /log-food` parses text and persists to `store.json`
- [ ] `POST /analyze?type=symptom` returns structured analysis
- [ ] `POST /analyze?type=explain` returns metabolic insights
- [ ] `POST /analyze?type=habits` uses stored logs
- [ ] `POST /suggest` returns 3 alternatives with reasons
- [ ] All endpoints return `{ success, data, error }` envelope
- [ ] Groq 429 → returns 429 to client
- [ ] Groq timeout → returns 504 to client
- [ ] Empty body → returns 400 with field error

### Frontend
- [ ] Tab navigation works without page reload
- [ ] Chat messages display in correct bubble styles
- [ ] Food log persists and displays recent entries
- [ ] Insights cards trigger correct endpoints
- [ ] Loading state shown during API calls
- [ ] Error messages shown on API failure

### Security
- [ ] `GROQ_API_KEY` never appears in any response
- [ ] `.env` not committed to repo
- [ ] Input length limits enforced server-side

### Delivery
- [ ] `README.md` complete with setup instructions
- [ ] `node_modules/` excluded from ZIP
- [ ] ZIP < 1 MB
- [ ] Fresh install + start works from ZIP

---

*Project Plan v1.0 — NutrinoX AI Nutrition Intelligence System (Groq Edition)*
