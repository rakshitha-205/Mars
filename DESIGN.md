# ChatConnect Design System Specification (DESIGN.md)
*Built on Material Design 3 (M3) Principles with a Bespoke Modern Identity*

**Tagline:** "Connect. Communicate. Collaborate."  
**Core Purpose:** Human-to-Human Real-Time Communication  

---

## 1. Brand Identity & Design Principles

### Brand Philosophy
ChatConnect is engineered to feel **immediate, focused, authentic, and calm**. Unlike busy social feeds or AI chatbots, ChatConnect treats human conversation with utmost respect:
- **Human First:** Conversations take center stage. AI tools are silent assistants in the wings, never the headline.
- **Expressive Clarity:** Crisp typography, generous whitespace, and distinctive bubble hierarchies eliminate conversational friction.
- **Micro-Delight:** Purposeful fluid transitions, optimistic message entry animations, and tactile feedback make every keystroke feel alive.
- **Effortless Scalability:** Seamless responsiveness from a compact mobile screen to an expansive 3-pane desktop workspace.

---

## 2. Color System & Palettes (Material Design 3 Tokenized)

The color palette is built using HSL tokens tailored for high contrast (WCAG AAA for text, AA for UI components), subtle tinting, and eye-friendly dark/light transitions.

### Light Theme Tokens
- **Primary:** `hsl(217, 91%, 60%)` (#2563EB - ChatConnect Electric Blue)
- **On Primary:** `hsl(0, 0%, 100%)` (#FFFFFF)
- **Primary Container:** `hsl(217, 91%, 95%)` (#EFF6FF)
- **On Primary Container:** `hsl(217, 91%, 25%)` (#1E3A8A)

- **Secondary:** `hsl(262, 83%, 58%)` (#7C3AED - Deep Violet Accent)
- **On Secondary:** `hsl(0, 0%, 100%)` (#FFFFFF)
- **Secondary Container:** `hsl(262, 83%, 95%)` (#F5F3FF)

- **Surface:** `hsl(210, 20%, 98%)` (#F8FAFC - Main Canvas)
- **Surface Container (Sidebar):** `hsl(0, 0%, 100%)` (#FFFFFF)
- **Surface Container High:** `hsl(210, 20%, 94%)` (#F1F5F9 - Received Message Bubble)
- **Surface Container Highest:** `hsl(210, 20%, 90%)` (#E2E8F0 - Hover states & borders)
- **On Surface:** `hsl(222, 47%, 11%)` (#0F172A - Deep Slate Text)
- **On Surface Variant (Muted):** `hsl(215, 16%, 47%)` (#64748B - Secondary Subtitles & Timestamps)

- **Success (Delivered / Online):** `hsl(142, 71%, 45%)` (#16A34A - Emerald Green)
- **Warning (Away):** `hsl(38, 92%, 50%)` (#F59E0B - Amber)
- **Danger (Offline / Delete):** `hsl(0, 84%, 60%)` (#EF4444 - Rose Red)
- **Read Receipt (Read ✓✓):** `hsl(217, 91%, 50%)` (#2563EB - Electric Blue)

### Dark Theme Tokens (Deep Nebula Slate - Not harsh black)
- **Surface:** `hsl(222, 47%, 7%)` (#090D16 - Deep Midnight Canvas)
- **Surface Container (Sidebar):** `hsl(222, 44%, 10%)` (#0E1524 - Left Sidebar)
- **Surface Container High:** `hsl(220, 39%, 16%)` (#162033 - Received Message Bubble)
- **Surface Container Highest:** `hsl(220, 35%, 22%)` (#212E46 - Borders, Hover states)
- **On Surface:** `hsl(210, 40%, 98%)` (#F8FAFC - High Contrast Text)
- **On Surface Variant (Muted):** `hsl(215, 20%, 65%)` (#94A3B8 - Muted Subtitles & Timestamps)

- **Primary:** `hsl(217, 91%, 60%)` (#3B82F6 - Luminous Blue)
- **On Primary:** `hsl(0, 0%, 100%)` (#FFFFFF)
- **Primary Container:** `hsl(217, 65%, 22%)` (#17366E - Sent Message Bubble in Dark Mode)
- **On Primary Container:** `hsl(217, 91%, 95%)` (#DBEAFE)

- **Success:** `hsl(142, 69%, 58%)` (#22C55E - Bright Neon Emerald)
- **Warning:** `hsl(38, 92%, 55%)` (#FBBF24)
- **Danger:** `hsl(0, 84%, 65%)` (#F87171)

---

## 3. Typography Hierarchy

Using **Outfit** for Display/Headings and **Inter** for conversational readability and UI elements.

- **Display Large (Hero Title):** 40px / Line-height 48px / Weight 700 / Tracking -0.02em
- **Headline Medium (Section Headers):** 24px / Line-height 32px / Weight 600
- **Title Medium (Chat Partner Name):** 16px / Line-height 24px / Weight 600
- **Body Large (Message Content):** 15px / Line-height 22px / Weight 400
- **Body Medium (Sidebar Message Preview):** 13.5px / Line-height 18px / Weight 400
- **Label Small (Timestamps & Read Badges):** 11px / Line-height 14px / Weight 500

---

## 4. Elevation, Radii & Shadows

### Border Radius Spectrum
- `rounded-sm`: 6px (Badges, reaction chips)
- `rounded-md`: 10px (Input fields, buttons)
- `rounded-lg`: 16px (Message bubbles, dropdowns, modal dialogs)
- `rounded-xl`: 24px (Cards, drawer sheets)
- `rounded-full`: 9999px (Avatars, pills, floating action buttons)

### Elevation & Lighting
- **Elevation 0:** Flat on canvas (`surface`)
- **Elevation 1:** `0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.06)` (Message Bubbles, Sidebar Items)
- **Elevation 2:** `0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)` (Cards, Active Chat Header)
- **Elevation 3:** `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` (Modals, Popovers, Emoji Picker)
- **Elevation 4:** `0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)` (Floating Drawers)

---

## 5. Component Standards

### 5.1 Message Bubbles
- **Sent Message (My Message):**
  - Right-aligned.
  - Background: `Primary` gradient or solid `Primary Container` in dark mode.
  - Text: `On Primary`.
  - Border radius: `18px 18px 4px 18px` (tactile asymmetry indicating sender direction).
  - Footer: Inline timestamp + status indicator (✓ Sent, ✓✓ Delivered, ✓✓ Blue Read).
- **Received Message:**
  - Left-aligned.
  - Background: `Surface Container High`.
  - Text: `On Surface`.
  - Border radius: `18px 18px 18px 4px`.
  - Sender name in group conversations tinted in distinctive avatar color.
- **Reaction Dock:** Floating micro-pills attached to the bubble bottom edge with animated hover scale.

### 5.2 Dynamic Typing Indicators
- Smooth 3-dot bounce with wave delay (`animation: wave 1.4s infinite ease-in-out`).
- Text descriptor: *"Rahul is typing..."* or *"Rahul, Ananya and 1 other are typing..."*

### 5.3 User Avatars & Presence Ring
- Soft round avatar with fallback dual-letter monogram rendered with deterministic HSL background color.
- Presence indicator badge pinned to bottom-right corner:
  - 🟢 **Online:** Green with subtle pulse ring
  - 🟡 **Away:** Amber
  - 🔴 **Busy:** Rose
  - ⚫ **Offline:** Neutral slate border

### 5.4 Unique Group Cards
- **Poll Card:** Clean interactive vote bars with animated fill percentages and participant counts.
- **Task Card:** Checklist items with live checkbox toggles and assignee avatar badges.
- **Event Card:** Calendar badge layout displaying Date, Time, Venue, and RSVP state.

### 5.5 Optional AI Tools Dock
- Discreet ✨ button beside the composer and in message contextual menu.
- **Smart Reply Chips:** Horizontal carousel of contextual suggestions above the composer.
- **Summarize & Translate Dialogs:** Modals with clear copy-to-composer or insert actions.

---

## 6. Layout & Breakpoints

- **Desktop (>= 1024px):** 3-Column Layout:
  1. Left Navigation & Active Chats Sidebar (340px)
  2. Center Active Conversation Stage (Flex-1)
  3. Right Contextual Info / Media / Member Drawer (320px - Collapsible)
- **Tablet (768px - 1023px):** 2-Column Layout (Sidebar + Active Chat; Right Drawer opens as overlay sheet).
- **Mobile (< 768px):** Single-View Stack:
  - View A: Chat list / navigation
  - View B: Active conversation view with fixed top header, sticky composer, and zero horizontal scroll.

---

## 7. Motion & Accessibility

- **Duration Tokens:** Fast (150ms), Standard (250ms), Fluid (350ms).
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (Apple/M3 spring curve).
- **WCAG Standards:** All text pairings exceed 4.5:1 ratio.
- **Keyboard Navigation:** Full tab order, Esc dismissals, `Ctrl+K` for global search modal, Enter to send message, Shift+Enter for line break.
