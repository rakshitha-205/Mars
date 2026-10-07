# ChatConnect 🚀
*Connect. Communicate. Collaborate.*

ChatConnect is a modern, real-time, human-to-human communication platform engineered on **Material Design 3 (M3)** principles and powered by **Aiven Cloud** architecture (**Aiven PostgreSQL**, **Aiven Apache Kafka**, and **Aiven Valkey**).

> 🌐 **Live Website:** [https://mars-phnt.vercel.app/](https://mars-phnt.vercel.app/)  
> 📑 **Full Live Deployment & Architecture Report:** [LIVE_DEPLOYMENT_REPORT.md](./LIVE_DEPLOYMENT_REPORT.md)  
> 🛡️ **Live Telemetry API:** [https://mars-phnt.vercel.app/api/aiven/status](https://mars-phnt.vercel.app/api/aiven/status)

---

## 🏗️ Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │        ChatConnect Client (Next.js)    │
                      │  Material Design 3 • Socket.IO Client  │
                      └──────────────────┬─────────────────────┘
                                         │ WebSocket / REST
                                         ▼
                      ┌────────────────────────────────────────┐
                      │    ChatConnect Service (Node/Express)  │
                      │  WebSocket Gateway • Event Dispatcher  │
                      └───────┬──────────────┬──────────────┬──┘
                              │              │              │
                              ▼              ▼              ▼
                    ┌────────────────┐┌──────────────┐┌──────────────┐
                    │ Aiven Postgres ││ Aiven Valkey ││ Aiven Kafka  │
                    │ 16 Tables ACID ││ Presence/TTL ││ Event Stream │
                    └────────────────┘└──────────────┘└──────────────┘
```

1. **Aiven PostgreSQL (Relational Persistence):**
   - 16 normalized relational tables supporting Users, Conversations, Messages, Groups, Reactions, Polls, Tasks, Events, Settings, and Bookmarks.
2. **Aiven Valkey (Ultra-Low Latency Cache & State):**
   - User online/away/offline presence with automated expiration TTL keys (`presence:user:*`).
   - Dynamic real-time typing indicators with heartbeat TTL keys (`typing:conversation:*`).
   - Rate limiting and hot query caching.
3. **Aiven Apache Kafka (Event Streaming):**
   - Decoupled pub/sub event pipeline streaming message dispatches, status receipts, presence updates, and notification triggers across 7 dedicated topics:
     - `chat.messages`
     - `chat.message-status`
     - `chat.presence`
     - `chat.typing`
     - `chat.notifications`
     - `chat.groups`
     - `chat.audit`

---

## 🎨 Design System (Material Design 3)

Designed according to [`DESIGN.md`](./DESIGN.md):
- **Typography:** Outfit (Display/Headings) + Inter (Conversational Body)
- **Layout:**
  - Desktop: 3-pane responsive workspace (Navigation/Chat list, Active conversation stage, Collapsible details drawer).
  - Tablet: 2-pane workspace with drawer overlay.
  - Mobile: Single-view stack with back navigation.
- **Rich Elements:**
  - Micro-animations: 3-dot bounce wave typing indicators.
  - Asymmetric tactile message bubbles (`18px 18px 4px 18px` for sent, `18px 18px 18px 4px` for received).
  - Delivery checkmarks: Sent (✓), Delivered (✓✓), Read (blue ✓✓).
  - Interactive Team Cards: Real-time polls with percentage bars, collaborative task checklists, and event cards.
  - AI utilities dock: Conversation summarizer, multi-language translator, and tone rewriter.

---

## 👥 Demo Test Accounts (1-Click Login)

| Name | Username | Email | Password | Role |
| :--- | :--- | :--- | :--- | :--- |
| **Mithun Gowda** | `mithun` | `mithun@chatconnect.app` | `Password123!` | Platform Architect |
| **Rahul Kumar** | `rahul` | `rahul@chatconnect.app` | `Password123!` | Frontend Engineer |
| **Ananya Sharma** | `ananya` | `ananya@chatconnect.app` | `Password123!` | Full-Stack Dev |
| **Kiran Rao** | `kiran` | `kiran@chatconnect.app` | `Password123!` | DevOps Lead |
| **Priya Patel** | `priya` | `priya@chatconnect.app` | `Password123!` | Product Designer |

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure Environment (.env)
Copy `.env.example` to `backend/.env` and `frontend/.env.local`:
```bash
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

### 3. Run Development Servers
From the root directory:
```bash
npm run dev
```
Or independently:
- **Backend:** `npm run dev:backend` (Runs on `http://localhost:5000`)
- **Frontend:** `npm run dev:frontend` (Runs on `http://localhost:3000`)

### 4. Build and Test
- **Build Full Stack:** `npm run build`
- **Run E2E Real-Time Verification:** `npm test`
- **Seed Demo Data:** `npm run seed`

---

## 📁 Repository Structure

```
chatconnect/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── database/        # Aiven PostgreSQL client & local fallback
│   │   ├── kafka/           # Aiven Apache Kafka service & event bus
│   │   ├── valkey/          # Aiven Valkey presence & cache service
│   │   ├── models/          # TypeScript data models
│   │   ├── repositories/    # Database repository access layer
│   │   ├── routes/          # REST API route handlers
│   │   ├── services/        # Auth and AI utility services
│   │   ├── websocket/       # Socket.IO gateway & real-time handlers
│   │   ├── scripts/         # E2E test suite, seed runner, Kafka setup
│   │   └── server.ts        # Express & Socket.IO server bootstrap
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── layout.tsx       # Root layout, fonts & metadata
│   │   ├── page.tsx         # Main 3-column ChatConnect application
│   │   ├── providers.tsx    # Auth and Socket providers wrapper
│   │   └── globals.css      # Design tokens, scrollbars, typing animations
│   ├── components/
│   │   ├── auth/            # 1-Click test user login modal
│   │   ├── chat/            # ChatArea, Composer, MessageBubble, DetailsDrawer
│   │   ├── modals/          # AivenStatusModal, AiToolsModal, Search, CreateGroup
│   │   ├── sidebar/         # Conversation sidebar & filter tabs
│   │   └── ui/              # Avatar & UI components
│   ├── context/             # AuthContext & SocketContext
│   ├── lib/                 # API client & TypeScript types
│   ├── package.json
│   └── tailwind.config.ts
│
├── database/
│   ├── schema/schema.sql    # 16 Relational tables definition
│   └── seed/seed.sql        # Demo seed records
│
├── DESIGN.md                # Material Design 3 specification
└── package.json             # Root workspace runner scripts
```

---

## 🏆 Hackathon Telemetry Endpoint

Inspect the live Aiven PostgreSQL, Kafka, and Valkey connections in real time:
- **API:** `GET http://localhost:5000/api/aiven/status`
- **UI:** Click the **Shield (🛡️)** button in the ChatConnect interface.
