# NutrinoX — Architecture Document

> **AI Nutrition Intelligence System** | Groq API · llama-3.3-70b-versatile · Node.js + Express

---

## 1. System Overview

NutrinoX is a single-user, server-rendered nutrition intelligence application. It follows a classic **thin-client / thick-server** architecture: the frontend is a lightweight vanilla JS SPA that delegates all intelligence to an Express backend, which in turn calls the Groq inference API for every AI-powered response.

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (Client)                     │
│  index.html · style.css · app.js  (<50 KB total payload)   │
│                                                             │
│   NavController · ChatModule · FoodLogModule · Insights     │
│                  ApiClient (fetch wrapper)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTP/JSON  (REST)
┌──────────────────────▼──────────────────────────────────────┐
│                  Express Server  (Node.js 18+)              │
│                                                             │
│  Routes          Services              Utils                │
│  ─────────       ──────────────────    ──────────────────   │
│  /chat           groq.js               formatter.js         │
│  /log-food       promptBuilder.js      validator.js         │
│  /analyze        symptomEngine.js      nlpParser.js         │
│  /suggest        mealExplainer.js                           │
│                  habitAnalyzer.js      Middleware           │
│                  alternativeEngine.js  ────────────────     │
│                                        errorHandler.js      │
│  Data Layer                                                 │
│  ──────────                                                 │
│  store.js  ←→  server/data/store.json                       │
└──────────────────────┬──────────────────────────────────────┘
                       │  HTTPS  (Bearer token)
┌──────────────────────▼──────────────────────────────────────┐
│            Groq Cloud API  (External)                       │
│    POST /openai/v1/chat/completions                         │
│    Model: llama-3.3-70b-versatile   ·   Timeout: 10 s              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Repository Layout

```
nutrinoX/
├── .env                        # GROQ_API_KEY (never committed)
├── .env.example
├── .gitignore
├── package.json
├── README.md
│
├── public/                     # Static frontend (<50 KB)
│   ├── index.html
│   ├── style.css
│   └── app.js
│
└── server/
    ├── index.js                # Entry point — server boot + startup checks
    │
    ├── data/
    │   └── store.json          # Persistent state (auto-created if missing)
    │
    ├── routes/
    │   ├── chat.js             # POST /chat
    │   ├── food.js             # POST /log-food
    │   ├── analyze.js          # POST /analyze
    │   └── suggest.js          # POST /suggest
    │
    ├── services/
    │   ├── groq.js             # Groq API client
    │   ├── promptBuilder.js    # Prompt template factory
    │   ├── symptomEngine.js    # Feature: Reverse Symptom Engine
    │   ├── mealExplainer.js    # Feature: Meal Explanation Engine
    │   ├── habitAnalyzer.js    # Feature: Habit Pattern Analyzer
    │   └── alternativeEngine.js# Feature: Alternative Suggestion Engine
    │
    ├── middleware/
    │   └── errorHandler.js     # Global Express error handler
    │
    └── utils/
        ├── formatter.js        # Response envelope builders
        ├── validator.js        # Input validation per endpoint
        ├── nlpParser.js        # Lightweight food text parser
        └── store.js            # JSON file read/write helpers
```

---

## 3. Layer-by-Layer Breakdown

### 3.1 Frontend (Browser)

The entire UI is a **single-page application** served as static files by Express. There is no build step and no JS framework.

| Module | Responsibility |
|---|---|
| `NavController` | Tab switching (Chat / Log Food / Insights) without page reload |
| `ChatModule` | Renders chat bubbles, auto-scrolls, calls `POST /chat` |
| `FoodLogModule` | Submits food text, refreshes recent log list |
| `InsightsModule` | Drives all four analysis cards (Symptom, Explain, Habits, Alternatives) |
| `ApiClient` | Wraps `fetch`, normalises errors, sets `Content-Type` |
| `StateManager` | In-memory `{ userGoal, chatHistory }` — no localStorage |

**Constraints:** No external CDN links. Total payload under 50 KB. Frontend runs on `http://localhost:8080`, backend runs on `http://localhost:3001` with CORS enabled.

---

### 3.2 Express Server

`server/index.js` is responsible for:

1. Validating `GROQ_API_KEY` on startup — exits with a clear error if absent.
2. Initialising `store.json` with defaults if the file does not exist.
3. Mounting static middleware (`public/`) and JSON body parser.
4. Registering all route modules.
5. Attaching the global `errorHandler` middleware last.

---

### 3.3 Routes

Every route handler follows the same three-step pattern:

```
validate input → call service → return formatted response
```

| Route | Method | Handler flow |
|---|---|---|
| `/chat` | POST | Validate → load context (goal + 10 meals) → `promptBuilder` → `callGroq` → `{ reply }` |
| `/log-food` | POST | Validate → `nlpParser.parse` → `store.appendFoodLog` → `{ logged }` |
| `/analyze` | POST | Validate → branch on `type` → call engine service → `{ analysis, insights[] }` |
| `/suggest` | POST | Validate → load context → `alternativeEngine` → `{ suggestions[] }` |

All routes are wrapped in `try/catch` and delegate errors to `next(err)`.

---

### 3.4 Services

#### `groq.js` — AI Gateway

The single point of contact with the Groq API.

```
callGroq(messages)
  │
  ├─ Build headers (Authorization: Bearer <key>)
  ├─ Set AbortController timeout (10 s)
  ├─ POST https://api.groq.com/openai/v1/chat/completions
  │   model: llama3-70b-8192 · max_tokens: 512
  ├─ Parse choices[0].message.content
  └─ Map HTTP errors → descriptive thrown errors
       401 → "Authentication error"
       429 → "Rate limit reached, retry shortly"
       500/503 → "AI service temporarily unavailable"
       timeout → "Request timed out"
```

#### `promptBuilder.js` — Prompt Factory

Centralises all system and user prompt construction. Each builder injects a shared **context block** (user goal + recent meals + timestamp) and applies the appropriate temperature per feature:

| Builder function | Feature | Temperature |
|---|---|---|
| `buildChatPrompt` | Personal Food Coach | 0.5 |
| `buildSymptomPrompt` | Reverse Symptom Engine | 0.2 |
| `buildExplainPrompt` | Meal Explanation Engine | 0.3 |
| `buildHabitPrompt` | Habit Pattern Analyzer | 0.3 |
| `buildAlternativePrompt` | Alternative Suggestion Engine | 0.5 |

User text is always wrapped in `"""` delimiters to prevent prompt injection.

#### Feature Services

Each service is a thin orchestration layer:

```
input + context
      │
      ▼
promptBuilder.build*Prompt()
      │
      ▼
callGroq(messages)
      │
      ▼
parse / structure raw text
      │
      ▼
return typed result object
```

| Service | Input | Output shape |
|---|---|---|
| `symptomEngine.js` | symptoms string | `{ analysis, insights[] }` |
| `mealExplainer.js` | food description | `{ analysis, insights[] }` |
| `habitAnalyzer.js` | 20 food log entries | `{ analysis, insights[] }` |
| `alternativeEngine.js` | craving description | `{ suggestions: [{ item, reason }] }` |

---

### 3.5 Data Layer

#### `store.json` Schema

```json
{
  "user": {
    "goal": "weight loss",
    "preferences": [],
    "restrictions": []
  },
  "foodLogs": [
    {
      "id": "<uuid-v4>",
      "timestamp": "<ISO-8601>",
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

#### `store.js` Rules

- All file writes are **synchronous** (`fs.writeFileSync`) to prevent corruption from concurrent requests.
- `foodLogs` are pruned to the most recent 500 entries on every append.
- `insights.summary` is considered stale after 24 hours and regenerated on the next request.
- File is created with defaults at server startup if missing.

---

### 3.6 Utilities

| File | Exports | Purpose |
|---|---|---|
| `formatter.js` | `success(data)`, `error(msg)` | Builds the standard `{ success, data, error }` response envelope |
| `validator.js` | `validateChat`, `validateLogFood`, `validateAnalyze`, `validateSuggest` | Returns `{ valid: bool, message: string }` |
| `nlpParser.js` | `parse(text)` | Lightweight extraction of items, meal type, and calorie estimate from free-text food input |

---

## 4. Data Flow — End-to-End Example

**User types "I feel tired after lunch" into the Symptom Check card.**

```
Browser (InsightsModule)
  └─ ApiClient.post('/analyze', { type: 'symptom', input: 'tired after lunch' })
        │
        ▼
Express  →  routes/analyze.js
  1. validator.validateAnalyze({ type, input })  →  { valid: true }
  2. store.getRecentMeals(10)  +  store.getUserGoal()
  3. symptomEngine.analyze('tired after lunch', context)
        │
        ▼
     promptBuilder.buildSymptomPrompt(symptoms, context)
        │
        ▼
     callGroq(messages)   →   Groq API  (temperature: 0.2)
        │
        ▼
     parse raw text  →  { analysis: "...", insights: ["...", "..."] }
        │
  4. formatter.success(result)
        │
        ▼
Browser receives { success: true, data: { analysis, insights } }
InsightsModule renders result in the Symptom card
```

---

## 5. API Contract

All endpoints return a consistent envelope:

```json
{ "success": true,  "data": { ... }, "error": null   }
{ "success": false, "data": null,    "error": "..."  }
```

### Endpoints

| Endpoint | Method | Body Fields | Success `data` |
|---|---|---|---|
| `/chat` | POST | `message` (string, max 1000) | `{ reply: string }` |
| `/log-food` | POST | `text` (string, max 500) | `{ logged: { id, timestamp, raw, parsed } }` |
| `/analyze` | POST | `type` (enum), `input` (string, max 500) | `{ analysis: string, insights: string[] }` |
| `/suggest` | POST | `craving` (string, max 200) | `{ suggestions: [{ item, reason }] }` |

### Error Responses

| Condition | HTTP Status | `error` value |
|---|---|---|
| Missing / invalid field | 400 | Field-specific message |
| Groq auth failure | 500 | "Authentication error" |
| Groq rate limit | 429 | "Rate limit reached, retry shortly" |
| Groq service error | 503 | "AI service temporarily unavailable" |
| Request timeout | 504 | "Request timed out" |

---

## 6. Security Architecture

| Concern | Mitigation |
|---|---|
| API key leakage | Stored only in `.env`; `.gitignore` enforced; never serialised into any response |
| Startup safety | Server exits immediately if `GROQ_API_KEY` is absent or empty |
| Prompt injection | User text is wrapped in `"""` delimiters within every prompt template |
| Oversized input | Length caps enforced server-side before input reaches any service (1000 / 500 / 200 chars) |
| Malformed JSON body | Express JSON middleware rejects with 400 before route handler executes |
| Error detail leakage | Stack traces logged server-side only; clients receive generic messages |
| Arbitrary file access | `store.json` path is hardcoded; no user input influences file paths |

---

## 7. Performance Targets

| Metric | Target |
|---|---|
| p95 API response time | < 3 seconds (Groq inference ~1–2 s) |
| Groq request timeout | 10 seconds (AbortController) |
| Frontend total payload | < 50 KB |
| Max tokens sent to Groq | < 800 tokens per request (10 meals + goal + timestamp) |
| Repository ZIP size | < 1 MB (excluding `node_modules`) |
| `node_modules` footprint | < 300 KB |
| Server startup time | < 500 ms |

---

## 8. Key Design Decisions

**Why JSON file storage instead of a database?**
The system is explicitly single-user and optimised for minimal deployment complexity. `store.json` requires zero dependencies and zero configuration. Synchronous writes prevent race conditions without needing transactions.

**Why Vanilla JS instead of a framework?**
The hard constraint of keeping the ZIP under 1 MB and total frontend payload under 50 KB rules out any framework. Vanilla JS is sufficient for the tab-based SPA pattern used here.

**Why centralise all prompts in `promptBuilder.js`?**
Prompt quality is the primary lever for output quality. Centralising templates makes it easy to iterate on system roles, context injection, and output formatting without touching business logic in services.

**Why synchronous file writes?**
Node.js is single-threaded. For a single-user JSON store, synchronous writes are the simplest way to guarantee no partial writes or read-during-write corruption, at negligible cost given the infrequent write cadence.

---

*Architecture Document v1.0 — NutrinoX AI Nutrition Intelligence System*
