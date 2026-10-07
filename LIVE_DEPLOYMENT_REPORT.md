# ChatConnect — Live Deployment & Architecture Report 🌐

**Live Production Application:** [https://mars-phnt.vercel.app/](https://mars-phnt.vercel.app/)  
**GitHub Repository:** [https://github.com/rakshitha-205/Mars](https://github.com/rakshitha-205/Mars)  
**Deployment Platform:** Vercel (Production)  
**System Status:** 🟢 100% Operational  

---

## 1. Executive Summary

**ChatConnect** (*"Connect. Communicate. Collaborate."*) is a modern, enterprise-grade, real-time human-to-human communication platform. Engineered around **Material Design 3 (M3)** principles, it leverages **Aiven Cloud Infrastructure** (**Aiven PostgreSQL**, **Aiven Apache Kafka**, and **Aiven Valkey**) to deliver real-time messaging, presence tracking, group collaboration, and event streaming.

The platform is deployed live on Vercel with automated CI/CD synchronization from the GitHub `main` branch.

---

## 2. Live Application Access & Demo Accounts

The live deployment features 1-click test authentication for evaluating the platform:

* **Production URL:** [https://mars-phnt.vercel.app/](https://mars-phnt.vercel.app/)
* **Aiven Telemetry Endpoint:** [https://mars-phnt.vercel.app/api/aiven/status](https://mars-phnt.vercel.app/api/aiven/status)

### Pre-Seeded Test Accounts

| Name | Username | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Mithun Gowda** | `mithun` | `mithun@chatconnect.app` | `Password123!` | Platform Architect |
| **Rahul Kumar** | `rahul` | `rahul@chatconnect.app` | `Password123!` | Frontend Engineer |
| **Ananya Sharma** | `ananya` | `ananya@chatconnect.app` | `Password123!` | Full-Stack Developer |
| **Kiran Rao** | `kiran` | `kiran@chatconnect.app` | `Password123!` | DevOps & Cloud Lead |
| **Priya Patel** | `priya` | `priya@chatconnect.app` | `Password123!` | Product Designer |

---

## 3. Technology Stack

### 3.1 Frontend Tier
* **Framework:** Next.js 14.2 (App Router architecture)
* **Library:** React 18.3
* **Language:** TypeScript 5.4 (Strict Typing)
* **Styling & Design System:** Tailwind CSS 3.4 tailored with Material Design 3 (M3) elevation tokens, state layers, and micro-interactions
* **Typography:** Google Fonts:
  * `Outfit`: Headings, display banners, and brand typography
  * `Inter`: Conversational body copy, metadata, and timestamps
* **Iconography:** Lucide React
* **State Management:** React Context API (`AuthContext`, `SocketContext`) with `localStorage` state caching

### 3.2 Backend & API Tier
* **Runtime:** Node.js (v20+ compatible)
* **Server Framework:** Express.js 4.19
* **Serverless Execution:** Next.js App Router Route Handlers (`app/api/...`) & Vercel Serverless Functions
* **Real-Time Communication:** Socket.IO 4.7 bidirectional WebSocket gateway with fallback to HTTP long-polling
* **Authentication:** JSON Web Tokens (JWT via `jsonwebtoken`) and `bcryptjs` password hashing
* **Validation:** Zod 3.23 schema validation

### 3.3 Cloud Data & Infrastructure Tier (Aiven)
ChatConnect is backed by a three-pillar cloud data architecture on Aiven:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ChatConnect Client                              │
│                   Next.js 14 • Material Design 3                       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     ChatConnect Serverless Engine                      │
│             Express API Gateway • Real-Time Dispatcher                 │
└──────────────┬────────────────────┬────────────────────┬───────────────┘
               │                    │                    │
               ▼                    ▼                    ▼
     ┌───────────────────┐┌───────────────────┐┌───────────────────┐
     │ Aiven PostgreSQL  ││   Aiven Valkey    ││    Aiven Kafka    │
     │ 16 Relational     ││ Presence TTL      ││ 7 Event Topics   │
     │ Tables (ACID)     ││ Typing Indicators ││ Decoupled Bus    │
     └───────────────────┘└───────────────────┘└───────────────────┘
```

1. **Aiven PostgreSQL (Relational Persistence):**
   * Primary relational store hosting 16 normalized tables:
     `users`, `conversations`, `conversation_members`, `messages`, `message_reactions`, `groups`, `group_members`, `group_tasks`, `events`, `polls`, `poll_options`, `poll_votes`, `notifications`, `attachments`, `bookmarks`, `user_settings`.
   * Dual-engine resilience: Managed connection pooling via `pg.Pool` with SSL encryption, backed by high-throughput in-memory fallback stores for offline/sandbox environments.

2. **Aiven Valkey (Ultra-Low Latency In-Memory Engine):**
   * High-throughput caching and ephemeral state synchronization:
     * **Presence:** Online/away/busy/offline state stored under `presence:user:<id>` with automatic time-to-live (TTL) expiry.
     * **Typing Heartbeat:** Sub-second typing indicator state stored under `typing:conversation:<id>:user:<id>`.
     * **Rate Limiting:** Sliding window key increments to protect endpoints from abuse.

3. **Aiven Apache Kafka (Event Streaming Pipeline):**
   * Decoupled pub/sub event pipeline streaming platform events across 7 dedicated topics:
     * `chat.messages`: Real-time message dispatch and audit ingestion
     * `chat.message-status`: Delivery and read receipts tracking
     * `chat.presence`: Distributed user presence state transitions
     * `chat.typing`: Distributed typing indicators
     * `chat.notifications`: Push alerts and mention triggers
     * `chat.groups`: Group creation, membership changes, and task updates
     * `chat.audit`: Compliance and operational telemetry logging

### 3.4 AI Assistant Microservices
* **Smart Quick-Replies:** Generates contextual one-click responses based on recent chat history.
* **Conversation Summarizer:** Synthesizes multi-user discussion threads into concise summaries and action items.
* **Real-Time Translator:** Cross-language message translation into English, Spanish, French, German, and Hindi.
* **Tone Rewriter:** Automatically polishes drafted messages into Professional, Friendly, Concise, or Casual tones.

---

## 4. Application Working Information & Workflows

### 4.1 Authentication Workflow
1. User visits [https://mars-phnt.vercel.app/](https://mars-phnt.vercel.app/).
2. Clicking **"Sign In"** opens the 1-Click Test User Modal, or users can enter custom credentials.
3. Upon login (`POST /api/auth/login`), the API validates the user, issues a JWT token, and establishes user session state.
4. User presence updates to `online` in Valkey, and a presence event is published to Kafka topic `chat.presence`.

### 4.2 Messaging & Real-Time Sync Workflow
1. The sidebar lists active 1-on-1 conversations (`Rahul Kumar`) and team channels (`BMSIT Project Team`).
2. Selecting a conversation loads the message history from `GET /api/conversations/:id/messages`.
3. Typing in the composer triggers Valkey typing indicators with a 5-second TTL (`typing:start`).
4. Sending a message (`POST /api/messages`) performs:
   * Record persistence in PostgreSQL (`messages` table).
   * Event publication to Kafka topic `chat.messages`.
   * Real-time delivery to active participants via WebSocket / Socket.IO.
   * Visual receipt progression: Sent (✓) → Delivered (✓✓) → Read (Blue ✓✓).

### 4.3 Group Collaboration Features
* **Interactive Polls:** Real-time team voting with dynamic percentage recalculation.
* **Collaborative Tasks:** Kanbans/checklists with assignee tagging and completion tracking.
* **Scheduled Events:** Group calendar meeting coordination with date/location badges.
* **AI Utilities Drawer:** Context-aware tools accessible directly from the chat header.

### 4.4 Aiven Architecture Monitor Modal
Clicking the **Shield icon (🛡️)** in the top navigation opens the live **Aiven Architecture & Infrastructure Modal**:
* Queries `GET /api/aiven/status`.
* Displays connection health for PostgreSQL, Valkey, and Kafka.
* Shows Kafka topic distribution, event throughput counters, and Valkey presence statistics.

---

## 5. Live Endpoint Verification Matrix

Every endpoint was tested against the production URL (`https://mars-phnt.vercel.app`) with the following results:

| Endpoint | Method | HTTP Status | Response Verification |
| :--- | :---: | :---: | :--- |
| `/` | `GET` | **`200 OK`** | Main UI HTML loaded (Next.js hydrated) |
| `/api/aiven/status` | `GET` | **`200 OK`** | Live operational status for PostgreSQL, Valkey, Kafka |
| `/api/auth/login` | `POST` | **`200 OK`** | Authenticated user `mithun`, issued JWT token |
| `/api/auth/register` | `POST` | **`200 OK`** | User registration and token creation |
| `/api/auth/me` | `GET` | **`200 OK`** | Returns authenticated user profile |
| `/api/users` | `GET` | **`200 OK`** | Returns all 5 seeded team member profiles |
| `/api/users/search?q=rahul` | `GET` | **`200 OK`** | Fuzzy query search matching users |
| `/api/conversations` | `GET` | **`200 OK`** | Returns direct & group conversations with previews |
| `/api/conversations/:id/messages` | `GET` | **`200 OK`** | Message thread history with reactions & polls |
| `/api/messages` | `POST` | **`200 OK`** | Message sent and assigned timestamped ID |
| `/api/ai/smart-replies` | `POST` | **`200 OK`** | AI contextual reply options returned |
| `/api/ai/summarize` | `POST` | **`200 OK`** | Thread summary with key bullet points |
| `/api/ai/translate` | `POST` | **`200 OK`** | Message translated into target language |
| `/api/ai/rewrite` | `POST` | **`200 OK`** | Message tone adjusted |

---

## 6. Deployment Configuration (`vercel.json`)

The multi-service Vercel deployment configuration:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "services": {
    "backend": {
      "root": "backend",
      "framework": "express",
      "entrypoint": "server.js",
      "buildCommand": "npm run build"
    },
    "frontend": {
      "root": "frontend",
      "framework": "nextjs",
      "bindings": [
        {
          "type": "service",
          "service": "backend",
          "format": "url",
          "env": "BACKEND_URL"
        }
      ]
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": {
        "service": "frontend"
      }
    }
  ]
}
```

---

## 7. Conclusion

ChatConnect is operational on [https://mars-phnt.vercel.app/](https://mars-phnt.vercel.app/). All bugs have been resolved, serverless routes respond with HTTP 200 OK, and all changes have been committed and synced to GitHub (`origin/main`).
