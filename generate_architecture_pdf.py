import subprocess
import os

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>GrandVue AI - System Architecture & Engineering Specification</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap');

  @page {
    size: A4 portrait;
    margin: 8mm 11mm 8mm 11mm;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #1e293b;
    background: #ffffff;
    font-size: 8.2pt;
    line-height: 1.38;
  }

  .page {
    page-break-after: always;
    page-break-inside: avoid;
    height: 279mm;
    max-height: 279mm;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 2mm 0 4mm 0;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  .page-content {
    flex: 1;
  }

  /* Header */
  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 8px;
    margin-bottom: 10px;
  }

  .brand-logo {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .brand-badge {
    background: #0f172a;
    color: #f59e0b;
    font-weight: 800;
    font-size: 13pt;
    padding: 4px 10px;
    border-radius: 5px;
    letter-spacing: 0.5px;
  }

  .doc-title-block h1 {
    font-size: 13.5pt;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.3px;
    line-height: 1.2;
  }

  .doc-title-block p {
    font-size: 8pt;
    color: #64748b;
    font-weight: 500;
  }

  .meta-tag {
    text-align: right;
    font-size: 7.5pt;
    color: #475569;
    font-family: 'JetBrains Mono', monospace;
    line-height: 1.3;
  }

  .meta-tag strong {
    color: #0f172a;
  }

  /* Section Styling */
  h2 {
    font-size: 10.5pt;
    font-weight: 800;
    color: #0f172a;
    border-left: 3.5px solid #f59e0b;
    padding-left: 7px;
    margin-top: 10px;
    margin-bottom: 6px;
    letter-spacing: -0.2px;
  }

  h3 {
    font-size: 9pt;
    font-weight: 700;
    color: #1e293b;
    margin-top: 6px;
    margin-bottom: 3px;
  }

  p {
    margin-bottom: 6px;
    color: #334155;
    font-size: 8.2pt;
  }

  /* Executive Callout */
  .callout-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 3.5px solid #3b82f6;
    padding: 8px 12px;
    border-radius: 5px;
    margin-bottom: 10px;
    font-size: 8pt;
    line-height: 1.4;
  }

  .callout-box strong {
    color: #1d4ed8;
  }

  /* SVG Diagram Container */
  .diagram-container {
    background: #0f172a;
    border-radius: 6px;
    padding: 10px;
    margin: 8px 0 10px 0;
    box-shadow: 0 3px 5px -1px rgba(0,0,0,0.1);
  }

  .diagram-container svg {
    width: 100%;
    max-height: 185mm;
    height: auto;
    display: block;
  }

  /* Grid Layout for Component Notes */
  .component-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 6px;
  }

  .comp-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 5px;
    padding: 7px 10px;
  }

  .comp-card.highlight {
    border-color: #f59e0b;
    background: #fffbeb;
  }

  .comp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3px;
  }

  .comp-title {
    font-size: 8.5pt;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .comp-num {
    background: #0f172a;
    color: #ffffff;
    font-size: 6.5pt;
    font-weight: 700;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .comp-card.highlight .comp-num {
    background: #f59e0b;
    color: #0f172a;
  }

  .comp-role {
    font-size: 6.5pt;
    font-family: 'JetBrains Mono', monospace;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
  }

  .comp-desc {
    font-size: 7.6pt;
    color: #475569;
    line-height: 1.38;
  }

  .comp-desc ul {
    margin-left: 12px;
    margin-top: 3px;
  }

  .comp-desc li {
    margin-bottom: 2px;
  }

  /* Table styling */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 7.5pt;
  }

  th, td {
    border: 1px solid #cbd5e1;
    padding: 5px 8px;
    text-align: left;
  }

  th {
    background: #f1f5f9;
    color: #0f172a;
    font-weight: 700;
  }

  td.pass {
    color: #15803d;
    font-weight: 700;
  }

  .badge-pass {
    background: #dcfce7;
    color: #166534;
    padding: 2px 5px;
    border-radius: 3px;
    font-weight: 700;
    font-size: 7pt;
  }

  /* Footer */
  .doc-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #e2e8f0;
    padding-top: 6px;
    font-size: 7pt;
    color: #94a3b8;
    margin-top: 6px;
  }
</style>
</head>
<body>

<!-- PAGE 1: ARCHITECTURE OVERVIEW & VECTOR DIAGRAM -->
<div class="page">
  <div class="doc-header">
    <div class="brand-logo">
      <div class="brand-badge">GV</div>
      <div class="doc-title-block">
        <h1>GrandVue AI — System Architecture & Engineering Blueprint</h1>
        <p>Autonomous Hotel Group Booking Concierge & Deterministic Pricing Engine</p>
      </div>
    </div>
    <div class="meta-tag">
      <div>SPECIFICATION: <strong>v1.0-PROD</strong></div>
      <div>AUTHOR: <strong>Vivek</strong></div>
    </div>
  </div>

  <div class="callout-box">
    <strong>Architectural Philosophy:</strong>
    Hotels lose group bookings when sales responses lag. GrandVue AI solves this bottleneck by strictly decoupling 
    <strong>Semantic Natural Language Understanding (LLM AI Layer)</strong> from <strong>Mathematical Calculation & Pricing Rules (Deterministic Core)</strong>.
    The AI reads unstructured emails and drafts polished responses; pure code calculates all room blocks, tariffs, volume discounts, and inventory allocations.
  </div>

  <h2>1. End-to-End System Architecture Diagram</h2>
  <p>Visualizing the data lifecycle from inbound guest email to instant quote and PMS reservation:</p>

  <div class="diagram-container">
    <svg viewBox="0 0 880 500" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="gradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="gradGold" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
        <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.3"/>
        </filter>
      </defs>

      <!-- BOUNDING BOX: CLIENT TIER -->
      <rect x="15" y="15" width="850" height="75" rx="8" fill="#1e293b" stroke="#334155" stroke-width="1.5"/>
      <text x="30" y="38" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">CLIENT & INTERFACE TIER (TWO-SCREEN ARCHITECTURE)</text>
      
      <!-- Screen 1 Box -->
      <rect x="30" y="48" width="395" height="32" rx="5" fill="#0f172a" stroke="#475569" stroke-width="1"/>
      <text x="45" y="68" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600">Screen 1: Guest Chat Simulator + Transparent Brain Inspector</text>
      
      <!-- Screen 2 Box -->
      <rect x="445" y="48" width="405" height="32" rx="5" fill="#0f172a" stroke="#f59e0b" stroke-width="1.2"/>
      <text x="460" y="68" fill="#fbbf24" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600">Screen 2: Hotel Settings Command Center (Reactive Store)</text>

      <!-- FLOW ARROW DOWN FROM CLIENT TO PARSER -->
      <path d="M 227 90 L 227 125" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrowGold)"/>
      <polygon points="227,128 222,118 232,118" fill="#f59e0b"/>
      <text x="235" y="112" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="9">Inbound Email / Turn N</text>

      <!-- BOUNDING BOX: SEMANTIC AI LAYER -->
      <rect x="15" y="130" width="425" height="95" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="1.5"/>
      <text x="30" y="150" fill="#60a5fa" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700">1. SEMANTIC AI LAYER (GEMINI 2.5 FLASH / LOCAL NLP)</text>
      
      <!-- Sub-node 1.1 -->
      <rect x="30" y="160" width="185" height="52" rx="5" fill="#0f172a" stroke="#334155"/>
      <text x="40" y="180" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="700">Intent Classifier</text>
      <text x="40" y="198" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif" font-size="8.5">Wedding | Offsite | Reunion</text>

      <!-- Sub-node 1.2 -->
      <rect x="230" y="160" width="195" height="52" rx="5" fill="#0f172a" stroke="#334155"/>
      <text x="240" y="180" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="10" font-weight="700">Entity & Intent Extractor</text>
      <text x="240" y="198" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif" font-size="8.5">Pax, Dates, Tier, Confirmations</text>

      <!-- FLOW ARROW DOWN TO GATEKEEPER -->
      <path d="M 227 225 L 227 255" stroke="#f59e0b" stroke-width="2"/>
      <polygon points="227,258 222,248 232,248" fill="#f59e0b"/>

      <!-- BOUNDING BOX: RULE OF 3 GATEKEEPER -->
      <rect x="15" y="260" width="425" height="75" rx="8" fill="#1e293b" stroke="#eab308" stroke-width="1.5"/>
      <text x="30" y="280" fill="#fde047" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700">2. "RULE OF 3" MINIMUM DETAILS GATEKEEPER</text>
      <text x="30" y="300" fill="#cbd5e1" font-family="'Plus Jakarta Sans', sans-serif" font-size="9">Evaluates: 1. Guest Count  |  2. Dates / Nights  |  3. Booking Type Intent</text>
      <text x="30" y="318" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif" font-size="8.5">Configurable via Screen 2 settings matrix</text>

      <!-- BRANCH: MISSING DETAILS -->
      <path d="M 15 295 L 0 295 L 0 455 L 120 455" stroke="#f43f5e" stroke-width="2" stroke-dasharray="4,3" fill="none"/>
      <polygon points="120,455 110,450 110,460" fill="#f43f5e"/>
      <text x="15" y="445" fill="#fb7185" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700">Missing Mandatory Info</text>

      <!-- BRANCH: SUFFICIENT DETAILS -> DETERMINISTIC ENGINE -->
      <path d="M 440 295 L 485 295" stroke="#10b981" stroke-width="2" fill="none"/>
      <polygon points="488,295 478,290 478,300" fill="#10b981"/>
      <text x="445" y="285" fill="#34d399" font-family="'JetBrains Mono', monospace" font-size="8.5" font-weight="700">Passed</text>

      <!-- BOUNDING BOX: DETERMINISTIC CORE RULES ENGINE -->
      <rect x="490" y="130" width="375" height="260" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
      <text x="505" y="152" fill="#34d399" font-family="'JetBrains Mono', monospace" font-size="11" font-weight="700">3. DETERMINISTIC ENGINE (100% CODE RULES)</text>
      
      <!-- Core Steps inside Engine -->
      <rect x="505" y="165" width="345" height="34" rx="4" fill="#0f172a" stroke="#334155"/>
      <text x="515" y="186" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">3.1 Stated Assumptions Resolver</text>
      <text x="735" y="186" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="8">1/room vs 3/room</text>

      <rect x="505" y="205" width="345" height="34" rx="4" fill="#0f172a" stroke="#334155"/>
      <text x="515" y="226" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">3.2 Room Allocation & Stock Sizing</text>
      <text x="735" y="226" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="8">ceil(pax / occ)</text>

      <rect x="505" y="245" width="345" height="34" rx="4" fill="#0f172a" stroke="#334155"/>
      <text x="515" y="266" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">3.3 Cross-Sell Inventory Tree</text>
      <text x="725" y="266" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="8">Hall -> Dinner -> Drinks</text>

      <rect x="505" y="285" width="345" height="34" rx="4" fill="#0f172a" stroke="#334155"/>
      <text x="515" y="306" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">3.4 Deterministic Discount Evaluator</text>
      <text x="745" y="306" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="8">20+ rms, 60+ d</text>

      <rect x="505" y="325" width="345" height="34" rx="4" fill="#0f172a" stroke="#334155"/>
      <text x="515" y="346" fill="#f8fafc" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">3.5 Budget Analysis & Solver</text>
      <text x="745" y="346" fill="#94a3b8" font-family="'JetBrains Mono', monospace" font-size="8">Surplus/Deficit</text>

      <rect x="505" y="365" width="345" height="18" rx="3" fill="#047857"/>
      <text x="585" y="378" fill="#ffffff" font-family="'JetBrains Mono', monospace" font-size="8" font-weight="700">AUDIT LOG: Line-by-Line Formula Trace</text>

      <!-- FLOW ARROW FROM SETTINGS TO DETERMINISTIC ENGINE -->
      <path d="M 645 80 L 645 125" stroke="#fbbf24" stroke-width="1.8" stroke-dasharray="3,3"/>
      <polygon points="645,127 640,117 650,117" fill="#fbbf24"/>
      <text x="655" y="105" fill="#fde047" font-family="'JetBrains Mono', monospace" font-size="8">Hot-Reload Tariffs & Rules</text>

      <!-- OUTPUT / SYNTHESIS TIER -->
      <rect x="15" y="415" width="850" height="70" rx="8" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
      <text x="30" y="433" fill="#c084fc" font-family="'JetBrains Mono', monospace" font-size="10" font-weight="700">4. SYNTHESIS, AUDIT TRACE & PRESENTATION TIER</text>
      
      <!-- Follow-up generator node -->
      <rect x="125" y="442" width="220" height="32" rx="4" fill="#0f172a" stroke="#f43f5e"/>
      <text x="135" y="462" fill="#fda4af" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">Concise Follow-Up Generator</text>

      <!-- Deterministic Quote / Confirmation node -->
      <rect x="365" y="442" width="240" height="32" rx="4" fill="#0f172a" stroke="#10b981"/>
      <text x="375" y="462" fill="#6ee7b7" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">Itemized Quote / Confirmation Card</text>

      <!-- Brain Inspector node -->
      <rect x="625" y="442" width="225" height="32" rx="4" fill="#0f172a" stroke="#c084fc"/>
      <text x="635" y="462" fill="#e9d5ff" font-family="'Plus Jakarta Sans', sans-serif" font-size="9" font-weight="600">Transparent Brain Live Inspector</text>

      <!-- Flow down from Engine to Output -->
      <path d="M 677 390 L 677 410" stroke="#10b981" stroke-width="2"/>
      <polygon points="677,413 672,403 682,403" fill="#10b981"/>

      <!-- Return Loop to Screen 1 -->
      <path d="M 855 450 L 870 450 L 870 65 L 830 65" stroke="#c084fc" stroke-width="1.8" stroke-dasharray="4,3" fill="none"/>
      <polygon points="830,65 840,60 840,70" fill="#c084fc"/>
    </svg>
  </div>

  <div class="doc-footer">
    <span>GrandVue AI Engineering Document • Grand Regal Hospitality Tech</span>
    <span>Page 1 of 4</span>
  </div>
</div>

<!-- PAGE 2: SUBSYSTEM BREAKDOWN & NOTES (PARTS 1 TO 6) -->
<div class="page">
  <div class="doc-header">
    <div class="brand-logo">
      <div class="brand-badge">GV</div>
      <div class="doc-title-block">
        <h1>Component Breakdown & Detailed Engineering Notes (Parts 1 – 6)</h1>
        <p>Architectural responsibilities, failure modes, and deterministic isolation</p>
      </div>
    </div>
  </div>

  <div class="component-grid">
    <!-- Component 1 -->
    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">1</span> First-Level Intent Classifier</span>
        <span class="comp-role">Semantic Ingestion</span>
      </div>
      <div class="comp-desc">
        Parses inbound natural language text to categorize booking archetype: 
        <strong>Corporate Offsite, Wedding, Conference, Family Reunion</strong>, or General Group.
        <ul>
          <li><strong>Multi-Turn Inheritance:</strong> When an event thread is active, follow-up messages (e.g. upgrades/confirmations) maintain intent archetype rather than downgrading to generic groups.</li>
          <li><strong>Fail-safe:</strong> Powered by Gemini 2.5 Flash with fallback to local rule-based token classifier.</li>
        </ul>
      </div>
    </div>

    <!-- Component 2 -->
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">2</span> Structured Entity Extractor</span>
        <span class="comp-role">Data Extraction</span>
      </div>
      <div class="comp-desc">
        Extracts structured parameters from unstructured email prose:
        <ul>
          <li><strong>Headcount:</strong> Explicit tokens, plural/singular nouns, and ranges (e.g., "30 employees", "12 directors").</li>
          <li><strong>Dates & Nights:</strong> Date intervals (e.g., "12 to 14 November 2026" &rarr; 2 nights) and advance booking calculation.</li>
          <li><strong>Guest Identity:</strong> Captures sign-off names (e.g., "Arjun", "Priya", "Meena") for personalized communication.</li>
          <li><strong>Budget:</strong> Captures INR lakh/numeric thresholds (e.g., "₹3 lakh").</li>
        </ul>
      </div>
    </div>

    <!-- Component 3 -->
    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">3</span> "Rule of 3" Gatekeeper</span>
        <span class="comp-role">Minimum Details Validator</span>
      </div>
      <div class="comp-desc">
        Guarantees that a quote is dispatched on <strong>Turn 1</strong> whenever 3 core fields exist:
        <strong>1. Guest Count, 2. Dates / Nights Duration, 3. Booking Type Intent</strong>.
        <ul>
          <li>All other parameters (room tier, hall choice, menu) are filled via declared baseline assumptions so response time is never delayed.</li>
          <li>Configurable from Screen 2 (hotel staff can add/remove mandatory constraints without code changes).</li>
        </ul>
      </div>
    </div>

    <!-- Component 4 -->
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">4</span> Targeted Follow-Up Generator</span>
        <span class="comp-role">Inquiry Generation</span>
      </div>
      <div class="comp-desc">
        Activated only when mandatory fields are missing (e.g., Email A).
        <ul>
          <li>Eliminates lengthy questionnaires. Asks <strong>only</strong> for the missing variables (1–2 concise questions max).</li>
          <li>Acknowledge event context warmly (e.g., <em>"Congratulations on the upcoming wedding celebration! Which dates in December? How many guests?"</em>).</li>
          <li>Transitions immediately to Turn 2 quote once user replies.</li>
        </ul>
      </div>
    </div>

    <!-- Component 5 -->
    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">5</span> Stated Assumptions Resolver</span>
        <span class="comp-role">Assumption Engine</span>
      </div>
      <div class="comp-desc">
        Enables instant Turn 1 quoting by populating optional variables with sensible defaults:
        <ul>
          <li><strong>Corporate Offsite:</strong> Single occupancy (1 employee per room for business privacy).</li>
          <li><strong>Wedding:</strong> Maximum room capacity (3 guests per room).</li>
          <li><strong>Social / Reunion:</strong> Shared occupancy (2 guests per room).</li>
          <li><strong>Room Category:</strong> Default: Deluxe Room (₹5,000/night).</li>
          <li><strong>Transparency Rule:</strong> Every assumption is explicitly declared in the quote card so the guest can edit anytime.</li>
        </ul>
      </div>
    </div>

    <!-- Component 6 -->
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">6</span> Room Allocation & Stock Sizer</span>
        <span class="comp-role">Deterministic Capacity</span>
      </div>
      <div class="comp-desc">
        Calculates exact room blocks through pure integer arithmetic:
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 7.5pt; color: #0284c7; background: #e0f2fe; padding: 2px 6px; border-radius: 4px; margin: 3px 0; text-align: center; font-weight: 700;">
          Rooms Needed = ⌈ Guest Count / Occupancy Density ⌉
        </div>
        <ul>
          <li><strong>Inventory Auditing:</strong> Checks requested rooms against live inventory stock in hotel settings.</li>
          <li><strong>Stock Alerts:</strong> If needed rooms exceed available single-tier stock, flags inventory split alert in audit trace.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>GrandVue AI Engineering Document • Grand Regal Hospitality Tech</span>
    <span>Page 2 of 4</span>
  </div>
</div>

<!-- PAGE 3: SUBSYSTEM BREAKDOWN & NOTES (PARTS 7 TO 12) + BENCHMARK AUDIT -->
<div class="page">
  <div class="doc-header">
    <div class="brand-logo">
      <div class="brand-badge">GV</div>
      <div class="doc-title-block">
        <h1>Component Breakdown (Parts 7 – 12) & Benchmark Verification</h1>
        <p>Cross-sell inventory trees, discounts, budget optimization & empirical test results</p>
      </div>
    </div>
  </div>

  <div class="component-grid">
    <!-- Component 7 -->
    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">7</span> Cross-Sell Inventory Tree</span>
        <span class="comp-role">Facility & F&B Branching</span>
      </div>
      <div class="comp-desc">
        Traverses specialized inventory branches tailored to event archetype:
        <ul>
          <li><strong>Corporate Offsite:</strong> Auto-allocates smallest conference hall holding all pax (Boardroom &le; 15, Summit Hall &le; 50, Grand Hall &le; 200). Conference hall booked &rarr; suggests Classic Veg Buffet.</li>
          <li><strong>Wedding:</strong> Allocates Grand Hall for reception, Wedding Feast dinner, Luxury stage & floral decor, and complimentary Bridal Suite upgrade.</li>
        </ul>
      </div>
    </div>

    <!-- Component 8 -->
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">8</span> Deterministic Discount Evaluator</span>
        <span class="comp-role">Multi-Tier Pricing Engine</span>
      </div>
      <div class="comp-desc">
        Evaluates hotel business discount thresholds:
        <ul>
          <li><strong>Volume Discount:</strong> &ge; 20 rooms &rarr; 10% discount on accommodation tariff.</li>
          <li><strong>Extended Stay:</strong> &ge; 4 nights &rarr; 5% discount on accommodation tariff.</li>
          <li><strong>Advance Booking:</strong> &ge; 60 days advance &rarr; 5% discount on total gross quote.</li>
          <li><strong>Audit Trace:</strong> Every deduction logs exact rupee savings and rule trigger in the quote.</li>
        </ul>
      </div>
    </div>

    <!-- Component 9 -->
    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">9</span> Budget Solver & Optimizer</span>
        <span class="comp-role">Inverse Solver (Sec 4.6)</span>
      </div>
      <div class="comp-desc">
        Processes budget-based requests (e.g., Email D: ₹3 Lakh budget):
        <ul>
          <li>Computes package cost and determines surplus buffer or deficit gap.</li>
          <li>Generates clear verdict (e.g. <em>"Package fits within ₹3,00,000 budget with ₹70,000 surplus buffer"</em>).</li>
          <li>If budget is exceeded, flags closest tier alternatives.</li>
        </ul>
      </div>
    </div>

    <!-- Component 10 -->
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">10</span> Conversational Concierge Copywriter</span>
        <span class="comp-role">Natural Language Synthesis</span>
      </div>
      <div class="comp-desc">
        Synthesizes warm, professional, high-end hospitality prose:
        <ul>
          <li>Addresses guests by name across multi-turn interactions (<em>"Hello Arjun,"</em>).</li>
          <li>Strictly incorporates numbers calculated by the deterministic engine.</li>
          <li>Maintains concise, crisp responses (50–60 words) delegating itemized tabular data to interactive cards.</li>
        </ul>
      </div>
    </div>

    <!-- Component 11 -->
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">11</span> Screen 1: Guest Chat & Brain Inspector</span>
        <span class="comp-role">Observability Panel</span>
      </div>
      <div class="comp-desc">
        Side-by-side split screen providing live system observability:
        <ul>
          <li>Left Panel: Chat conversation with interactive Quote & Confirmation Cards.</li>
          <li>Right Panel ("Transparent Brain"): Audits all 6 moving parts in real-time (Intent confidence, Rule of 3 check, Assumptions, Discounts, Cross-Sell path, Formula traces).</li>
        </ul>
      </div>
    </div>

    <!-- Component 12 -->
    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">12</span> Screen 2: Hotel Settings Command Center</span>
        <span class="comp-role">Dynamic Rules Configuration</span>
      </div>
      <div class="comp-desc">
        Enables non-technical hotel revenue staff to modify pricing and policies without code:
        <ul>
          <li>Edit room rates & stock, conference hall daily fees, dining packages.</li>
          <li>Toggle Rule-of-3 mandatory fields, occupancy assumptions, discount rules.</li>
          <li>Hot-reloads reactively into localStorage; next quote reflects changes immediately.</li>
        </ul>
      </div>
    </div>
  </div>

  <h2>Empirical Benchmark Verification (Official PDF Scenarios)</h2>
  <table>
    <thead>
      <tr>
        <th>Scenario</th>
        <th>Input Email Summary</th>
        <th>Status</th>
        <th>Rooms Allocated</th>
        <th>Deterministic Total</th>
        <th>Test Verdict</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Email A (Turn 1)</strong></td>
        <td>Sister's wedding in Dec, shares no dates or pax</td>
        <td><code>NEEDS_INFO</code></td>
        <td>N/A (Awaiting info)</td>
        <td>N/A (2 targeted questions asked)</td>
        <td><span class="badge-pass">✅ PASS</span></td>
      </tr>
      <tr>
        <td><strong>Email A (Turn 2)</strong></td>
        <td>80 guests, 18 to 21 December 2026 (3 nights)</td>
        <td><code>QUOTED</code></td>
        <td>27 Deluxe (3/room)</td>
        <td>₹8,28,750 (Feast + Hall + Decor)</td>
        <td><span class="badge-pass">✅ PASS</span></td>
      </tr>
      <tr>
        <td><strong>Email B (Turn 1)</strong></td>
        <td>Corporate offsite, 30 employees, 12-14 Nov</td>
        <td><code>QUOTED</code></td>
        <td>30 Deluxe (1/room)</td>
        <td>₹4,22,000 (Summit Hall + Dinner - 10%)</td>
        <td><span class="badge-pass">✅ PASS</span></td>
      </tr>
      <tr>
        <td><strong>Email B (Turn 2)</strong></td>
        <td>"update to super deluxe and confirm the booking"</td>
        <td><code>CONFIRMED</code></td>
        <td>30 Super Deluxe (1/room)</td>
        <td>₹5,57,000 (PMS #BK-XXXXXX)</td>
        <td><span class="badge-pass">✅ PASS</span></td>
      </tr>
      <tr>
        <td><strong>Email C (Turn 1)</strong></td>
        <td>Wedding, 90 guests, 20-23 Jan 2027 + hall</td>
        <td><code>QUOTED</code></td>
        <td>30 Deluxe (3/room)</td>
        <td>₹8,95,500 (10% Volume + 5% Advance)</td>
        <td><span class="badge-pass">✅ PASS</span></td>
      </tr>
      <tr>
        <td><strong>Email D</strong></td>
        <td>₹3 Lakh budget, family reunion, 25 people</td>
        <td><code>QUOTED</code></td>
        <td>13 Deluxe (2/room)</td>
        <td>₹2,30,000 (+₹70,000 surplus buffer)</td>
        <td><span class="badge-pass">✅ PASS</span></td>
      </tr>
    </tbody>
  </table>

  <div class="doc-footer">
    <span>GrandVue AI Engineering Document • Grand Regal Hospitality Tech</span>
    <span>Page 3 of 4</span>
  </div>
</div>

<!-- PAGE 4: SYSTEM SETUP, EXECUTION & TECH STACK GUIDE -->
<div class="page">
  <div class="doc-header">
    <div class="brand-logo">
      <div class="brand-badge">GV</div>
      <div class="doc-title-block">
        <h1>Installation, Execution & Technology Stack Guide</h1>
        <p>System requirements, setup commands, test suite verification, and architectural stack breakdown</p>
      </div>
    </div>
  </div>

  <h2>1. System Requirements & Prerequisites</h2>
  <div class="component-grid" style="margin-bottom: 10px;">
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title">Runtime Environment</span>
        <span class="comp-role">Core Engine</span>
      </div>
      <div class="comp-desc">
        <ul>
          <li><strong>Node.js:</strong> Version 18.0.0 or higher (v20 LTS or v22 tested & recommended).</li>
          <li><strong>Package Manager:</strong> npm v9+ (or pnpm / yarn).</li>
          <li><strong>Browser:</strong> Modern Chromium (Chrome/Edge), Firefox, or WebKit browser with ES module support.</li>
        </ul>
      </div>
    </div>
    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title">API & Dependencies</span>
        <span class="comp-role">External Services</span>
      </div>
      <div class="comp-desc">
        <ul>
          <li><strong>Google Gemini API:</strong> Required for live LLM extraction. Configured in UI Settings (Screen 2) or <code>.env</code> file.</li>
          <li><strong>Zero Mandatory Native Addons:</strong> No Python, C++, or external DB required to run the web app.</li>
          <li><strong>Dependencies:</strong> Managed via <code>package.json</code> (Vite, Google GenAI SDK, Lucide Icons).</li>
        </ul>
      </div>
    </div>
  </div>

  <h2>2. How to Install, Run & Verify Locally</h2>
  <div class="comp-card" style="margin-bottom: 10px; background: #0f172a; color: #f8fafc; border-color: #334155; padding: 10px 14px;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
      <div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #fbbf24; margin-bottom: 3px;">
          # Step 1: Install Project Dependencies
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: #38bdf8; background: #1e293b; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155;">
          npm install
        </div>
        <div style="font-size: 7.2pt; color: #94a3b8; margin-top: 3px; margin-bottom: 8px;">
          Installs Vite dev server, @google/genai, and Lucide icons.
        </div>

        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #fbbf24; margin-bottom: 3px;">
          # Step 2: Start the Live Dev Server
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: #38bdf8; background: #1e293b; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155;">
          npm run dev
        </div>
        <div style="font-size: 7.2pt; color: #94a3b8; margin-top: 3px;">
          Opens <span style="color: #6ee7b7; font-weight: 600;">http://localhost:5173</span> (Screen 1: Guest Chat & Screen 2: Settings).
        </div>
      </div>

      <div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #fbbf24; margin-bottom: 3px;">
          # Step 3: Run the 20-Scenario Test Suite
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: #38bdf8; background: #1e293b; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155;">
          node run_test_suite.mjs
        </div>
        <div style="font-size: 7.2pt; color: #94a3b8; margin-top: 3px; margin-bottom: 8px;">
          Executes 20 benchmark tests validating all discounts, dates, and math isolation.
        </div>

        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8pt; color: #fbbf24; margin-bottom: 3px;">
          # Step 4: Build for Production
        </div>
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 8.5pt; color: #38bdf8; background: #1e293b; padding: 4px 8px; border-radius: 4px; border: 1px solid #334155;">
          npm run build
        </div>
        <div style="font-size: 7.2pt; color: #94a3b8; margin-top: 3px;">
          Outputs minified, production-ready static assets to <code>dist/</code>.
        </div>
      </div>
    </div>
  </div>

  <h2>3. Technology Stack Used</h2>
  <div class="component-grid">
    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">1</span> Frontend & UI Architecture</span>
        <span class="comp-role">Client Tier</span>
      </div>
      <div class="comp-desc">
        <ul>
          <li><strong>Vanilla ES6+ JavaScript:</strong> Zero framework lock-in (no heavy React/Angular bundle bloat); ultra-lightweight and reactive.</li>
          <li><strong>Bespoke Glassmorphism CSS:</strong> Dark luxury hotel theme with Outfit and JetBrains Mono typography, custom variables, and responsive layout.</li>
          <li><strong>Two-Screen Workspace:</strong> Screen 1 (Chat + Live Audit Inspector) and Screen 2 (Hotel Command Settings Center).</li>
        </ul>
      </div>
    </div>

    <div class="comp-card highlight">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">2</span> Deterministic Pricing Core</span>
        <span class="comp-role">Business Logic</span>
      </div>
      <div class="comp-desc">
        <ul>
          <li><strong>Deterministic Rules Engine (<code>src/engine.js</code>):</strong> Pure JavaScript calculating room tariffs, hall sizes, dining packages, and discounts.</li>
          <li><strong>Zero Math Hallucination:</strong> Guarantees all monetary calculations, volume thresholds, and booking totals are strictly code-evaluated.</li>
          <li><strong>Reactive Pub/Sub Store (<code>src/state.js</code>):</strong> Real-time persistence via browser <code>localStorage</code> with reset defaults.</li>
        </ul>
      </div>
    </div>

    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">3</span> AI & Natural Language Ingestion</span>
        <span class="comp-role">Intelligence Tier</span>
      </div>
      <div class="comp-desc">
        <ul>
          <li><strong>Google Gemini 2.5 Flash:</strong> High-speed multimodal LLM extracting entities (dates, guest count, event type, budget) into strict JSON schema.</li>
          <li><strong>Dual-Layer Fallback Parser (<code>src/parser.js</code>):</strong> Heuristic regex fallback instantly kicks in if API key is absent or quota-limited.</li>
          <li><strong>Rule of 3 Decision Logic:</strong> Computes instant Turn-1 quotes when key booking anchors are satisfied.</li>
        </ul>
      </div>
    </div>

    <div class="comp-card">
      <div class="comp-header">
        <span class="comp-title"><span class="comp-num">4</span> Tooling, Bundling & Test Automation</span>
        <span class="comp-role">DevOps & QA</span>
      </div>
      <div class="comp-desc">
        <ul>
          <li><strong>Vite 6:</strong> Lightning-fast Hot Module Replacement (HMR) and optimized Rollup production bundling.</li>
          <li><strong>Automated Test Runner (<code>run_test_suite.mjs</code>):</strong> Pure Node.js ES module test runner covering 20 edge cases with 100% pass rate.</li>
          <li><strong>Architecture Compiler:</strong> Headless Chromium-based pipeline ensuring exact high-fidelity vector PDF generation.</li>
        </ul>
      </div>
    </div>
  </div>

  <div class="doc-footer">
    <span>GrandVue AI Engineering Document • Grand Regal Hospitality Tech</span>
    <span>Page 4 of 4</span>
  </div>
</div>

</body>
</html>
"""

html_path = os.path.abspath("architecture_document.html")
pdf_path = os.path.abspath("GRANDVUE_AI_SYSTEM_ARCHITECTURE.pdf")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML written to {html_path}")

cmd = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "--headless=new",
    "--disable-gpu",
    "--allow-file-access-from-files",
    "--no-pdf-header-footer",
    f"--print-to-pdf={pdf_path}",
    html_path
]

print("Compiling PDF via Headless Chromium...")
res = subprocess.run(cmd, capture_output=True)

if os.path.exists(pdf_path):
    size = os.path.getsize(pdf_path)
    print(f"SUCCESS: {pdf_path} generated successfully! File size: {size} bytes ({round(size/1024, 1)} KB)")
else:
    print(f"ERROR: PDF generation failed. Stderr: {res.stderr.decode('utf-8', errors='ignore')}")
