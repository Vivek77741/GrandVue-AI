# GrandVue AI — Autonomous Hotel Group Booking Concierge & Deterministic Pricing Engine

> 🌐 **Live Demo:** **[https://vivek77741.github.io/GrandVue-AI/](https://vivek77741.github.io/GrandVue-AI/)**  
> *Click above to test the live application directly in your browser without any local setup.*

[![Live Demo](https://img.shields.io/badge/demo-LIVE%20ONLINE-success?style=flat-square&logo=githubpages)](https://vivek77741.github.io/GrandVue-AI/)
[![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Vite Version](https://img.shields.io/badge/vite-v8.3-blue.svg)](https://vitejs.dev/)
[![Gemini API](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-orange.svg)](https://ai.google.dev/)
[![Tests Passing](https://img.shields.io/badge/test%20suite-20%2F20%20PASS-success.svg)](./TEST_RESULTS_REPORT.md)

An enterprise-grade, autonomous group reservation concierge and deterministic pricing engine engineered for luxury hospitality. **GrandVue AI** eliminates manual sales response latency by instantly converting unstructured guest inquiries (emails, chats, inquiries) into transparent, itemized quotes—guaranteeing **zero AI mathematical hallucination**.

---

## 📑 Table of Contents
1. [Architectural Philosophy](#-architectural-philosophy)
2. [Key Capabilities & Core Rules](#-key-capabilities--core-rules)
3. [Two-Screen Workspace Architecture](#-two-screen-workspace-architecture)
4. [System Architecture Diagram & Blueprint](#-system-architecture-diagram--blueprint)
5. [Prerequisites & System Requirements](#-prerequisites--system-requirements)
6. [Installation & Setup](#-installation--setup)
7. [How to Run the Application](#-how-to-run-the-application)
8. [Automated Test Suite Verification (20/20 PASS)](#-automated-test-suite-verification-2020-pass)
9. [Detailed System Workflow & Logic](#-detailed-system-workflow--logic)
10. [Repository Structure](#-repository-structure)
11. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏛 Architectural Philosophy

Hotels routinely lose lucrative group bookings because sales coordinators take 24–48 hours to cross-check inventory, apply corporate discount matrices, and draft quote PDFs.

GrandVue AI solves this by **strictly decoupling language understanding from pricing logic**:

```
┌─────────────────────────────────────────────────────────────┐
│               INBOUND UNSTRUCTURED GUEST INQUIRY            │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          INTELLIGENCE TIER: Google Gemini 2.5 Flash         │
│   • Semantic Intent Classification                          │
│   • Temporal & Entity Extraction (Dates, Headcount, Budget) │
│   • Strictly outputs validated JSON (Zero Math Allowed)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ Structured Entity JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│          DETERMINISTIC PRICING CORE (Pure JavaScript)       │
│   • Rule of 3 Instant Quote Evaluator                       │
│   • Dynamic Hall Sizing & Cross-Sell Trees                  │
│   • Volume, Extended Stay & Advance Discount Stacking       │
│   • Inventory Stock Guard & Budget Feasibility Engine       │
└──────────────────────────────┬──────────────────────────────┘
                               │ Transparent Computed Data
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    HIGH-END GUEST OUTPUT                    │
│   • Instant Turn-1 Quote Card with Declared Assumptions     │
│   • PMS Reservation Confirmation (#BK-XXXXXX)               │
│   • Real-Time Line-by-Line Math Audit Trace in UI           │
└─────────────────────────────────────────────────────────────┘
```

> **Zero Math Hallucination Guarantee:** The Large Language Model is **never** permitted to calculate totals, compute tax, or invent discounts. All room tariffs, hall charges, dining rates, and volume thresholds are executed in pure, auditable deterministic code (`src/engine.js`).

---

## ⚡ Key Capabilities & Core Rules

### 1. Rule of 3 Decision Logic
If an inbound inquiry contains the **3 core anchors** (Event Intent, Dates / Month, and Headcount), the engine bypasses lengthy back-and-forth interrogations and delivers an **Instant Turn-1 Quote** with declared baseline assumptions.

### 2. Follow-Up Interrogation Engine
If critical booking anchors are absent (e.g., an inquiry saying *"Planning a wedding in December"* without exact dates or headcount), the system politely asks targeted follow-up questions to gather necessary data before calculating.

### 3. Dynamic Cross-Sell Inventory Trees
Tailors facility and F&B allocations dynamically based on event archetype:
* **Corporate Offsite / Retreat:** Auto-allocates the smallest conference hall holding all attendees (Boardroom $\le$ 15 pax, Summit Hall $\le$ 50 pax, Grand Hall $\le$ 200 pax). Auto-suggests the *Classic Veg Buffet* dinner package.
* **Weddings & Galas:** Allocates the *Grand Hall* for celebrations, *Wedding Feast* catering, luxury floral stage decor, and awards a complimentary *Bridal Suite* upgrade.
* **Family Reunions:** Optimizes room blocks for multi-guest occupancy and schedules shared dining packages.

### 4. Deterministic Discount Stacking Matrix
Applies cumulative, auditable discount rules:
* **Volume Discount:** 10% off room totals for blocks of 20+ rooms.
* **Extended Stay Discount:** 5% off room totals for reservations of 4+ consecutive nights.
* **Early Bird Advance Booking:** 5% off subtotal when booking 60+ days in advance.

### 5. Transparent Declared Assumptions
When standard details are unstated in Turn 1, the engine applies sensible defaults (e.g., 1 person/room for corporate events, 3 persons/room for weddings, deluxe room tier) and explicitly declares them on the quote card for instant guest customization.

### 6. Budget-Based Feasibility Analysis
For inquiries with a stated spending cap (e.g., *"Budget is ₹3 Lakh"*), the engine calculates the complete package, determines financial feasibility, and computes the exact budgetary surplus or deficit.

### 7. Multi-Turn Compound Updates & PMS Confirmation
Allows guests to alter requirements conversationally (e.g., *"Update to Super Deluxe rooms and confirm the booking"*). The system recalculates line items, reserves inventory, and generates an official PMS Booking Reference (`#BK-XXXXXX`).

---

## 🖥 Two-Screen Workspace Architecture

GrandVue AI delivers a unified, luxury dark glassmorphism interface:

### Screen 1: Guest Concierge & Live Audit Inspector
* **Left Panel (Interactive Inbound Channel):** Fast-paste sample emails (Email A, B, C, D) or type custom multi-turn inquiries.
* **Center Panel (Polished Guest Response):** Displays the concierge reply, interactive quote cards, declared editable assumptions, and itemized booking receipts.
* **Right Panel (Real-Time Engineering Inspector):** A live telemetry HUD showing:
  * Extracted JSON entities (dates, nights, headcount, budget)
  * Intent classification confidence
  * Inventory stock checks
  * Exact line-by-line mathematical pricing breakdown

### Screen 2: Hotel Management Command Center
* Live configuration dashboard to update room tariffs, conference hall capacities, dining package rates, and discount thresholds.
* **Zero Hardcoding:** Changing a rate immediately updates real-time calculations across the system.
* **One-Click Reset:** Instantly restore default PDF baseline tariffs.

---

## 📊 System Architecture Diagram & Blueprint

The repository includes a comprehensive 4-page engineering blueprint:
* **PDF File:** [`GRANDVUE_AI_SYSTEM_ARCHITECTURE.pdf`](./GRANDVUE_AI_SYSTEM_ARCHITECTURE.pdf)
* **HTML Blueprint:** [`architecture_document.html`](./architecture_document.html)
* **Compilation Script:** `python generate_architecture_pdf.py`

### Blueprint Structure:
* **Page 1:** End-to-End Vector System Architecture Diagram & Philosophical Decoupling
* **Page 2:** Subsystem Breakdown & Detailed Notes (Components 1 to 6)
* **Page 3:** Subsystem Breakdown (Components 7 to 12) & Discount Matrices
* **Page 4:** System Setup, Execution Commands & Technology Stack Guide

---

## 🛠 Prerequisites & System Requirements

Before running the application locally, ensure you have:

| Requirement | Supported Version | Notes |
|:---|:---|:---|
| **Node.js** | `>= 18.0.0` (LTS v20 or v22 recommended) | Check via `node -v` |
| **npm** | `>= 9.0.0` | Check via `npm -v` |
| **Browser** | Modern Chromium / Firefox / Safari | Native ES Module support |
| **Google Gemini API Key** | Optional (Recommended for Live AI) | Free from [Google AI Studio](https://aistudio.google.com/) |

> **Offline Fallback:** If no Gemini API key is provided, GrandVue AI automatically switches to its internal high-speed heuristic regex parser (`src/parser.js`) with zero degradation in calculation accuracy.

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/vivek77741/DAi.git
cd DAi
```

### 2. Install Dependencies
```bash
npm install
```
*Installs Vite dev server, the official `@google/genai` SDK, and Lucide icons.*

### 3. (Optional) Configure Google Gemini API Key
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Add your Gemini API key:
```env
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```
*(Alternatively, you can paste your key directly into the UI Settings screen at runtime—it persists safely in browser `localStorage` and is never committed).*

---

## 💻 How to Run the Application

### Start the Development Server
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:5173/
```

### Build for Production
To generate minified, tree-shaken production bundles in the `dist/` folder:
```bash
npm run build
```

To preview the production build locally:
```bash
npm run preview
```

---

## 🧪 Automated Test Suite Verification (20/20 PASS)

GrandVue AI includes an automated, self-contained test runner verifying every benchmark email, edge case, and mathematical rule:

```bash
node run_test_suite.mjs
```

### Test Coverage Highlights:
* **Benchmark A (Turns 1 & 2):** Missing details follow-up questions & multi-turn resolution.
* **Benchmark B (Turns 1 & 2):** Corporate offsite instant quote, hall sizing, and compound upgrade to Super Deluxe + confirmation.
* **Benchmark C (Turns 1 & 2):** Wedding 90-pax instant quote with Grand Hall, Feast, Stage Decor, and Bridal Suite.
* **Benchmark D:** Budget constraint verification (₹3 Lakh cap, ₹2,30,000 package, ₹70,000 surplus).
* **Edge Cases 1–3:** Empty emails, single-entity inquiries, and date-only inputs.
* **Edge Cases 4–6:** 19 vs. 20 room volume thresholds, 4-night extended stay rules, and 3-tier discount stacking.
* **Edge Cases 7–10:** Small meeting room fits (Boardroom $\le$ 15), mega conventions (Grand Hall $\le$ 200), explicit suite requests, and budget exceeded warnings.
* **Edge Cases 11–13:** Inventory shortage alerts, settings hot-reload, and multi-turn edits without confirmation.

Detailed execution trace is documented in [`TEST_RESULTS_REPORT.md`](./TEST_RESULTS_REPORT.md).

---

## 🔍 Detailed System Workflow & Logic

```
   Inbound Guest Email
           │
           ▼
 [src/gemini.js] ────► API Key Present? ──► YES ──► Gemini 2.5 Flash Structured JSON
           │                                 │
           │                                 NO
           ▼                                 ▼
   [src/parser.js] ◄─────────────────────────┘ (Heuristic Regex Entity Fallback)
           │
           │  Entities: { intent, dates, nights, guestCount, budget, roomTierRequested, isConfirmation }
           ▼
   [src/engine.js] ──► Rule of 3: Are event, dates, and pax satisfied?
           │
           ├──► NO  ──► Status: NEEDS_INFO (Generate targeted follow-up prompts)
           │
           └──► YES ──► Status: QUOTED / CONFIRMED
                          │
                          ├─ 1. Determine Room Block & Occupancy Density
                          ├─ 2. Calculate Base Room Subtotal
                          ├─ 3. Traverse Cross-Sell Tree (Conference Hall + Catering)
                          ├─ 4. Evaluate & Stack Discounts (Volume + Extended + Advance)
                          ├─ 5. Audit Inventory Capacity Stock
                          └─ 6. Analyze Budget Feasibility (Surplus / Deficit)
                          │
                          ▼
 [src/copywriter.js] ─► Assemble Itemized Quote Card & PMS Reservation #BK-XXXXXX
                          │
                          ▼
 [src/main.js] ───────► Render to Guest Chat UI + Real-Time Inspector Telemetry
```

---

## 📁 Repository Structure

```
DAi/
├── .env.example                     # Environment template for Gemini API key
├── .gitignore                       # Git exclusion rules (ignores .env, node_modules, dist)
├── ARCHITECTURE.md                  # Comprehensive architectural specification document
├── GRANDVUE_AI_SYSTEM_ARCHITECTURE.pdf # Compiled 4-page PDF engineering blueprint
├── TEST_RESULTS_REPORT.md           # 20-scenario automated test verification report
├── architecture_document.html       # Source HTML/CSS/SVG for architecture PDF
├── generate_architecture_pdf.py     # Chromium headless PDF compiler script
├── index.html                       # Two-screen application layout & luxury dark UI
├── package.json                     # Project dependencies & scripts
├── run_test_suite.mjs               # Self-contained 20-case test runner
├── src/
│   ├── copywriter.js                # High-end hospitality response formatter
│   ├── engine.js                    # 100% Deterministic pricing & rules engine
│   ├── gemini.js                    # Google Gemini 2.5 Flash structured parser & client
│   ├── parser.js                    # Dual-layer offline regex fallback entity extractor
│   ├── state.js                     # Reactive pub/sub store & localStorage manager
│   ├── style.css                    # Modern glassmorphism CSS design system
│   └── main.js                      # Application controller, DOM events & live inspector
└── public/                          # Static assets and icons
```

---

## ❓ Troubleshooting & FAQ

### 1. What happens if the Gemini API experiences a 429 rate limit or network error?
GrandVue AI implements an automatic fail-safe: if the LLM request fails, times out, or encounters quota limits, the system catches the error and invokes `src/parser.js`. The guest still receives an instantaneous quote with zero interruption.

### 2. Can hotel managers alter room rates and hall tariffs on the fly?
Yes. Click the **Hotel Settings** tab (Screen 2) to change room rates, hall prices, dining menus, or discount percentages. Changes persist immediately in browser `localStorage` and trigger instant recalculations.

### 3. How do I recompile the PDF architecture document?
Ensure Microsoft Edge or Google Chrome is installed, then run:
```bash
python generate_architecture_pdf.py
```
This generates `GRANDVUE_AI_SYSTEM_ARCHITECTURE.pdf` matching the 4-page specification.

---

## 👤 Author
**Vivek** — [GitHub Profile](https://github.com/vivek77741)
Developed for Grand Regal Hospitality Tech.
