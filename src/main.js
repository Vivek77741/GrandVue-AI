/**
 * GrandVue AI - Application Orchestrator & View Controller
 */

import { stateStore } from "./state.js";
import { parseInboundEmail } from "./parser.js";
import { evaluateInquiry, formatINR } from "./engine.js";
import { formatSystemResponse } from "./copywriter.js";
import { parseEmailWithGemini, draftReplyWithGemini, GEMINI_MODEL } from "./gemini.js";

// Toggle for Live Gemini vs Local Engine
let useLiveGemini = true;

// Pre-defined benchmark sample emails (PDF Section 9)
const SAMPLE_EMAILS = {
  a: {
    label: "Email A: Missing Details (Wedding)",
    text: "Hi, we are planning my sister's wedding at your hotel sometime in December. Can you share the rates? Thanks, Priya"
  },
  b: {
    label: "Email B: Corporate Offsite (30 pax)",
    text: "Hello, we are a software company planning an offsite for 30 employees from 12 to 14 November 2026. Please send a quote. Regards, Arjun, HR"
  },
  c: {
    label: "Email C: Wedding (90 pax + Cross-Sell)",
    text: "We have a wedding on 20 to 23 January 2027. Around 90 guests will stay. We will also need a hall for the reception. Please quote. Rahul"
  },
  d: {
    label: "Email D: Budget-Based (₹3 Lakh)",
    text: "Our budget is ₹3 lakh for a 2-night family reunion in February, about 25 people. What packages do you have? Meena"
  }
};

// Conversation state
let currentConversationContext = null;
let conversationHistory = [];

document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initPresetButtons();
  initChatForm();
  initSettingsView();
  renderInitialWelcome();
});

// =============================================================================
// NAVIGATION & TABS
// =============================================================================
function initNavigation() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const views = {
    chat: document.getElementById("view-chat"),
    settings: document.getElementById("view-settings"),
    architecture: document.getElementById("view-architecture")
  };

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      
      tabButtons.forEach(b => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");

      Object.keys(views).forEach(k => {
        if (k === target) {
          views[k].classList.add("active");
        } else {
          views[k].classList.remove("active");
        }
      });
    });
  });
}

// =============================================================================
// CHAT WORKSPACE & BENCHMARKS
// =============================================================================
function initPresetButtons() {
  const presets = ["a", "b", "c", "d"];
  presets.forEach(id => {
    const btn = document.getElementById(`preset-${id}`);
    if (btn) {
      btn.addEventListener("click", () => {
        const email = SAMPLE_EMAILS[id];
        processInboundEmail(email.text);
      });
    }
  });

  const clearBtn = document.getElementById("btn-clear-chat");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      resetChat();
      showToast("Conversation reset");
    });
  }
}

function initChatForm() {
  const form = document.getElementById("chat-input-form");
  const textarea = document.getElementById("chat-textarea");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    if (!text) return;
    
    processInboundEmail(text);
    textarea.value = "";
  });

  // Enable Shift+Enter for new line, Enter to submit
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });
}

function renderInitialWelcome() {
  const chatMessages = document.getElementById("chat-messages");
  chatMessages.innerHTML = `
    <div class="message-row assistant">
      <div class="avatar assistant">GV</div>
      <div class="message-bubble">
        <p><strong>GrandVue Autonomous Concierge is ready.</strong></p>
        <p style="margin-top: 6px; color: var(--text-secondary); font-size: 13px;">
          Paste any inbound group booking email below, or click any of the <strong>Test Inbound Emails</strong> above (Email A, B, C, or D) to see the First-Level Filter, Rule-of-3 Gatekeeper, and Deterministic Engine execute in real time.
        </p>
      </div>
    </div>
  `;
}

function resetChat() {
  currentConversationContext = null;
  conversationHistory = [];
  renderInitialWelcome();
  resetInspector();
}

function resetInspector() {
  const badge = document.getElementById("inspector-status-badge");
  badge.className = "badge badge-waiting";
  badge.textContent = "Ready";

  document.getElementById("insp-intent-content").innerHTML = `<div class="placeholder-text">Awaiting incoming email...</div>`;
  document.getElementById("insp-rule3-content").innerHTML = `<div class="placeholder-text">Evaluating minimum details...</div>`;
  document.getElementById("insp-assumptions-content").innerHTML = `<div class="placeholder-text">No active assumptions yet.</div>`;
  document.getElementById("insp-discounts-content").innerHTML = `<div class="placeholder-text">Discounts will be audited here.</div>`;
  document.getElementById("insp-crosssell-content").innerHTML = `<div class="placeholder-text">Inventory branch traversal will appear here.</div>`;
  document.getElementById("insp-math-content").innerHTML = `<div class="placeholder-text">Line-by-line calculations will be logged here.</div>`;
}

// Core processing loop with Gemini 2.5 Flash
async function processInboundEmail(rawText) {
  // 1. Render User Message
  renderUserMessage(rawText);

  // Show live processing indicator
  const chatMessages = document.getElementById("chat-messages");
  const loadingRow = document.createElement("div");
  loadingRow.id = "gemini-thinking-indicator";
  loadingRow.className = "message-row assistant";
  loadingRow.innerHTML = `
    <div class="avatar assistant">GV</div>
    <div class="message-bubble" style="display: flex; align-items: center; gap: 8px;">
      <span class="status-indicator"></span>
      <span style="font-family: var(--font-mono); font-size: 12px; color: var(--accent-gold);">
        Gemini 2.5 Flash is analyzing intent & extracting structured entities...
      </span>
    </div>
  `;
  chatMessages.appendChild(loadingRow);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  let parsed = null;
  try {
    if (useLiveGemini) {
      parsed = await parseEmailWithGemini(rawText, currentConversationContext);
    } else {
      parsed = parseInboundEmail(rawText, currentConversationContext);
    }
  } catch (err) {
    console.warn("Live Gemini parsing fallback:", err);
    parsed = parseInboundEmail(rawText, currentConversationContext);
  }

  currentConversationContext = parsed;

  // 3. Evaluate through 100% Deterministic Engine (Zero AI Math)
  const evaluation = evaluateInquiry(parsed, stateStore.settings);

  // Preserve the lastQuote so subsequent messages (e.g. "confirm it") know the quote details!
  if (evaluation.status === "QUOTED") {
    currentConversationContext.lastQuote = evaluation;
  } else if (evaluation.status === "CONFIRMED") {
    currentConversationContext.isConfirmed = true;
    currentConversationContext.lastQuote = evaluation.confirmedQuote;
  }

  // 4. Update Inspector Panel in real time
  updateInspector(evaluation);

  // 5. Generate Response Text via Gemini or Local Copywriter
  let responseText = "";
  try {
    if (useLiveGemini) {
      let summaryText = "";
      if (evaluation.status === "CONFIRMED") {
        summaryText = `Booking #${evaluation.bookingId}, Confirmed Total: ${evaluation.confirmedQuote ? formatINR(evaluation.confirmedQuote.finalTotal) : "Confirmed"}`;
      } else {
        summaryText = `Intent: ${evaluation.intent.label}, Rooms: ${evaluation.roomsNeeded || 0}, Subtotal: ${evaluation.grossSubtotal || 0}, Discounts: -${evaluation.totalDiscountAmount || 0}, Total: ${evaluation.finalTotal || 0}`;
      }
      responseText = await draftReplyWithGemini(evaluation, summaryText);
    } else {
      responseText = formatSystemResponse(evaluation);
    }
  } catch (err) {
    console.warn("Live Gemini drafting fallback:", err);
    responseText = formatSystemResponse(evaluation);
  }

  // Remove thinking indicator
  const indicator = document.getElementById("gemini-thinking-indicator");
  if (indicator) indicator.remove();

  // 6. Render Assistant Response with Itemized Quote Card or Confirmation Card
  renderAssistantMessage(evaluation, responseText);
}

function renderUserMessage(text) {
  const chatMessages = document.getElementById("chat-messages");
  const row = document.createElement("div");
  row.className = "message-row guest";
  row.innerHTML = `
    <div class="avatar guest">G</div>
    <div class="message-bubble">
      <div style="font-size: 11px; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 4px;">INBOUND GUEST EMAIL</div>
      <p style="white-space: pre-wrap;">${escapeHTML(text)}</p>
    </div>
  `;
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function renderAssistantMessage(evaluation, fullText) {
  const chatMessages = document.getElementById("chat-messages");
  const row = document.createElement("div");
  row.className = "message-row assistant";

  let cardHTML = "";
  let headerBadge = "💬 INTELLIGENT FOLLOW-UP QUESTION (RULE OF 3)";

  if (evaluation.status === "CONFIRMED") {
    headerBadge = `🎉 BOOKING CONFIRMED & RESERVED (REF #${evaluation.bookingId})`;
    cardHTML = generateConfirmationCardHTML(evaluation);
  } else if (evaluation.status === "QUOTED") {
    const isUpdate = Boolean(evaluation.parsedData?.lastQuote);
    headerBadge = isUpdate ? "⚡ UPDATED TAILORED ESTIMATE" : "⚡ INSTANT DETERMINISTIC QUOTE (TURN 1)";
    cardHTML = generateQuoteCardHTML(evaluation);
  }

  // Convert markdown to clean HTML
  const formattedProse = renderMarkdown(fullText);

  row.innerHTML = `
    <div class="avatar assistant">GV</div>
    <div class="message-bubble">
      <div style="font-size: 11px; font-family: var(--font-mono); color: var(--accent-gold); margin-bottom: 6px;">
        ${headerBadge}
      </div>
      <div>${formattedProse}</div>
      ${cardHTML}
    </div>
  `;

  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function generateConfirmationCardHTML(result) {
  const quote = result.confirmedQuote;
  const totalStr = quote ? formatINR(quote.finalTotal) : "Confirmed";
  const dates = quote ? (quote.dateString || "Reserved Dates") : "Confirmed Dates";
  const rooms = quote ? `${quote.roomsNeeded} ${quote.roomType.name}s` : "Room Block";
  const guests = quote ? `${quote.guestCount} Guests` : "Group";

  // Itemized line items inside confirmation
  let itemsHTML = "";
  if (quote && quote.lineItems && quote.lineItems.length > 0) {
    itemsHTML = quote.lineItems.map(item => `
      <div class="quote-item-row" style="font-size: 12px; padding: 4px 0;">
        <div class="quote-item-desc">
          <span class="quote-item-name">${item.name}</span>
          ${item.ruleTriggered ? `<span class="quote-item-rule">↳ ${item.ruleTriggered}</span>` : ""}
        </div>
        <span class="quote-item-price">${formatINR(item.subtotal)}</span>
      </div>
    `).join("");
  }

  // Discounts
  let discountsHTML = "";
  if (quote && quote.discounts && quote.discounts.length > 0) {
    const list = quote.discounts.map(d => `
      <div class="discount-line" style="font-size: 11px;">
        <span>✓ ${d.name} (${d.percent}%)</span>
        <strong>-${formatINR(d.savings)}</strong>
      </div>
    `).join("");
    discountsHTML = `
      <div class="quote-discounts-box" style="margin-top: 8px; padding: 8px;">
        <div style="font-size: 10px; text-transform: uppercase; font-weight: 700; color: var(--accent-emerald); margin-bottom: 4px;">
          Applied Rules & Discounts (${formatINR(quote.totalDiscountAmount || 0)} Savings)
        </div>
        ${list}
      </div>
    `;
  }

  return `
    <div class="confirmation-card">
      <div class="conf-card-header">
        <div class="conf-icon-wrap">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
        </div>
        <div>
          <div class="conf-title">Official Reservation Confirmed</div>
          <div class="conf-subtitle">PMS Reference: <strong>${result.bookingId}</strong></div>
        </div>
      </div>

      <div class="conf-details-grid">
        <div class="conf-detail-item">
          <span class="conf-label">DATES</span>
          <span class="conf-val">${dates}</span>
        </div>
        <div class="conf-detail-item">
          <span class="conf-label">HEADCOUNT</span>
          <span class="conf-val">${guests}</span>
        </div>
        <div class="conf-detail-item">
          <span class="conf-label">ROOM BLOCK</span>
          <span class="conf-val">${rooms}</span>
        </div>
        <div class="conf-detail-item">
          <span class="conf-label">FINAL BINDING TOTAL</span>
          <span class="conf-val total">${totalStr}</span>
        </div>
      </div>

      ${itemsHTML ? `
        <div style="margin-top: 10px; border-top: 1px dashed rgba(255,255,255,0.1); padding-top: 8px;">
          <div style="font-size: 10px; text-transform: uppercase; font-family: var(--font-mono); color: var(--text-muted); margin-bottom: 6px;">
            Confirmed Package Breakdown
          </div>
          ${itemsHTML}
          ${discountsHTML}
        </div>
      ` : ""}

      <div class="conf-footer">
        <span class="conf-status-pill">✓ Inventory Committed & Agreement Queued</span>
      </div>
    </div>
  `;
}

function generateQuoteCardHTML(quote) {
  const itemsHTML = quote.lineItems.map(item => `
    <div class="quote-item-row">
      <div class="quote-item-desc">
        <span class="quote-item-name">${item.name}</span>
        ${item.ruleTriggered ? `<span class="quote-item-rule">↳ ${item.ruleTriggered}</span>` : ""}
      </div>
      <span class="quote-item-price">${formatINR(item.subtotal)}</span>
    </div>
  `).join("");

  let discountsHTML = "";
  if (quote.discounts.length > 0) {
    const list = quote.discounts.map(d => `
      <div class="discount-line">
        <span>✓ ${d.name} (${d.percent}%)</span>
        <strong>-${formatINR(d.savings)}</strong>
      </div>
    `).join("");
    discountsHTML = `
      <div class="quote-discounts-box">
        <div style="font-size: 11px; text-transform: uppercase; font-weight: 700; color: var(--accent-emerald); margin-bottom: 6px;">
          Applied Rules & Discounts (${formatINR(quote.totalDiscountAmount)} Total Savings)
        </div>
        ${list}
      </div>
    `;
  }

  const assumptionsList = quote.appliedAssumptions.map(a => `
    <li><strong>${a.title}:</strong> ${a.description}</li>
  `).join("");

  return `
    <div class="quote-card">
      <div class="quote-card-header">
        <div class="quote-badge-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          ${quote.intent.label} Estimate
        </div>
        <span class="quote-id">${quote.quoteId}</span>
      </div>

      <div class="quote-items-list">
        ${itemsHTML}
      </div>

      ${discountsHTML}

      <div class="quote-total-bar">
        <span class="quote-total-label">Grand Total (Net):</span>
        <span class="quote-total-amount">${formatINR(quote.finalTotal)}</span>
      </div>

      <div class="quote-assumptions-box">
        <h4>Declared Editable Assumptions:</h4>
        <ul>${assumptionsList}</ul>
      </div>
    </div>
  `;
}

// =============================================================================
// "TRANSPARENT BRAIN" MOVING PARTS INSPECTOR
// =============================================================================
function updateInspector(evalResult) {
  const { auditTrace, status } = evalResult;
  const statusBadge = document.getElementById("inspector-status-badge");

  if (status === "CONFIRMED") {
    statusBadge.className = "badge badge-success";
    statusBadge.textContent = "Confirmed & Locked";
  } else if (status === "QUOTED") {
    statusBadge.className = "badge badge-success";
    statusBadge.textContent = "Quote Generated";
  } else {
    statusBadge.className = "badge badge-warning";
    statusBadge.textContent = "Missing Info";
  }

  // 1. Intent Filter
  const intentElem = document.getElementById("insp-intent-content");
  intentElem.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span class="badge badge-purple">${auditTrace.intent.label}</span>
      <span style="font-family: var(--font-mono); font-size: 11px; color: var(--text-muted);">${Math.round(auditTrace.intent.confidence * 100)}% Confidence</span>
    </div>
    <div style="font-size: 11px; color: var(--text-secondary);">
      ${auditTrace.intent.reasons.join(", ")}
    </div>
  `;

  // 2. Rule of 3 Gatekeeper
  const rule3Elem = document.getElementById("insp-rule3-content");
  const missingMap = new Set(auditTrace.missingFields.map(m => m.field));
  
  const fields = [
    { key: "guestCount", label: "Guest Count (Pax)" },
    { key: "dates", label: "Dates / Nights Duration" },
    { key: "bookingType", label: "Booking Type Intent" }
  ];

  const rule3HTML = fields.map(f => {
    const isMissing = missingMap.has(f.key);
    const checked = auditTrace.checkedRequiredFields.find(c => c.field === f.key);
    return `
      <div class="rule3-item">
        <span class="status-icon ${isMissing ? 'cross' : 'check'}">${isMissing ? '✕' : '✓'}</span>
        <span>${f.label}</span>
        ${checked ? `<span class="rule3-value">${checked.value}</span>` : `<span class="rule3-value" style="color: var(--accent-rose);">Missing</span>`}
      </div>
    `;
  }).join("");

  rule3Elem.innerHTML = `<div class="rule3-list">${rule3HTML}</div>`;

  // 3. Active Assumptions
  const asmpElem = document.getElementById("insp-assumptions-content");
  if (auditTrace.appliedAssumptions.length === 0) {
    asmpElem.innerHTML = `<div class="placeholder-text">No assumptions needed (all specific details provided).</div>`;
  } else {
    asmpElem.innerHTML = auditTrace.appliedAssumptions.map(a => `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 600;">
          <span>${a.title}</span>
          <span style="color: var(--accent-gold); font-family: var(--font-mono);">${a.value}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted);">${a.description}</div>
      </div>
    `).join("");
  }

  // 4. Triggered Discounts
  const discElem = document.getElementById("insp-discounts-content");
  if (auditTrace.triggeredDiscounts.length === 0) {
    discElem.innerHTML = `<div class="placeholder-text">No discount thresholds met for this booking size.</div>`;
  } else {
    discElem.innerHTML = auditTrace.triggeredDiscounts.map(d => `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 12px;">
        <span>🏷️ ${d.rule || d.name} (${d.percent || d.discountPercent}%)</span>
        <strong style="color: var(--accent-emerald); font-family: var(--font-mono); font-size: 13px;">-${formatINR(d.amount || d.savings)}</strong>
      </div>
    `).join("");
  }

  // 5. Cross-Sell Inventory Tree
  const crossElem = document.getElementById("insp-crosssell-content");
  if (auditTrace.crossSellPath.length === 0) {
    crossElem.innerHTML = `<div class="placeholder-text">No cross-sell tree nodes activated.</div>`;
  } else {
    crossElem.innerHTML = auditTrace.crossSellPath.map(c => `
      <div style="margin-bottom: 8px; font-size: 12px;">
        <span style="color: var(--accent-cyan); font-weight: 600;">↳ ${c.stage}:</span>
        <strong style="color: var(--text-primary); margin-left: 4px;">${c.chosen}</strong>
        <div style="font-size: 11px; color: var(--text-muted);">${c.reason}</div>
      </div>
    `).join("");
  }

  // 6. Deterministic Math Audit
  const mathElem = document.getElementById("insp-math-content");
  if (evalResult.status === "CONFIRMED") {
    const q = evalResult.confirmedQuote;
    mathElem.innerHTML = `
      <div class="code-trace" style="color: var(--accent-emerald);">
        ✓ PMS STATUS: ${evalResult.auditTrace.pmsStatus || 'COMMITTED'}
      </div>
      <div class="code-trace" style="color: var(--accent-gold); margin-top: 4px;">
        Booking Reference: #${evalResult.bookingId} | Final Total: ${q ? formatINR(q.finalTotal) : 'Confirmed'}
      </div>
      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 6px;">
        Room block and event facilities have been committed. Digital contract dispatched.
      </div>
    `;
  } else if (evalResult.status !== "QUOTED") {
    mathElem.innerHTML = `<div class="placeholder-text">Awaiting required variables to evaluate formulas.</div>`;
  } else {
    const lines = auditTrace.mathBreakdown.map(m => `
      <div class="code-trace">
        ${m.item}: ${m.formula} = ${formatINR(m.total)}
      </div>
    `).join("");

    mathElem.innerHTML = `
      ${lines}
      <div class="code-trace" style="margin-top: 6px; border-top: 1px dashed var(--border-subtle); padding-top: 6px; color: var(--accent-gold);">
        Subtotal: ${formatINR(evalResult.grossSubtotal)} | Discounts: -${formatINR(evalResult.totalDiscountAmount)} | Net: ${formatINR(evalResult.finalTotal)}
      </div>
    `;
  }
}

// =============================================================================
// HOTEL SETTINGS COMMAND CENTER (SCREEN 2)
// =============================================================================
function initSettingsView() {
  renderSettingsTables();

  const saveBtn = document.getElementById("btn-save-settings");
  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveSettingsFromDOM();
      showToast("Settings saved successfully! Active on next quote.");
    });
  }

  const resetBtn = document.getElementById("btn-reset-settings");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      stateStore.resetToDefaults();
      renderSettingsTables();
      showToast("Reset to official PDF defaults.");
    });
  }
}

function renderSettingsTables() {
  const s = stateStore.settings;

  // 1. Rooms Table
  const roomsTbody = document.querySelector("#table-rooms tbody");
  roomsTbody.innerHTML = s.rooms.map((room, index) => `
    <tr>
      <td><strong>${room.name}</strong></td>
      <td>
        <input type="number" class="table-input room-max-pax" data-index="${index}" value="${room.maxPeople}" min="1" max="10" />
      </td>
      <td>
        <input type="number" class="table-input room-price" data-index="${index}" value="${room.pricePerNight}" step="500" />
      </td>
      <td>
        <input type="number" class="table-input room-stock" data-index="${index}" value="${room.availableRooms}" min="1" max="500" />
      </td>
    </tr>
  `).join("");

  // 2. Conference Table
  const confTbody = document.querySelector("#table-conference tbody");
  confTbody.innerHTML = s.conferenceRooms.map((hall, index) => `
    <tr>
      <td><strong>${hall.name}</strong></td>
      <td>
        <input type="number" class="table-input hall-max" data-index="${index}" value="${hall.maxPeople}" min="5" step="5" />
      </td>
      <td>
        <input type="number" class="table-input hall-price" data-index="${index}" value="${hall.pricePerDay}" step="1000" />
      </td>
    </tr>
  `).join("");

  // 3. Dinner Packages Table
  const dinnerTbody = document.querySelector("#table-dinner tbody");
  dinnerTbody.innerHTML = s.dinnerPackages.map((dp, index) => `
    <tr>
      <td><strong>${dp.name}</strong></td>
      <td style="color: var(--text-muted); font-size: 11px;">${dp.description}</td>
      <td>
        <input type="number" class="table-input dinner-price" data-index="${index}" value="${dp.pricePerPerson}" step="100" />
      </td>
    </tr>
  `).join("");

  // 4. "Rule of 3" Minimum Details
  const minDetailsList = document.getElementById("min-details-list");
  minDetailsList.innerHTML = Object.entries(s.minimumDetails).map(([key, val]) => `
    <div class="toggle-item">
      <label for="min-field-${key}">${val.label}</label>
      <input type="checkbox" id="min-field-${key}" data-key="${key}" ${val.required ? 'checked' : ''} />
    </div>
  `).join("");

  // 5. Assumptions
  document.getElementById("asmp-corporate-occ").value = s.assumptions.corporateOccupancy;
  document.getElementById("asmp-wedding-occ").value = s.assumptions.weddingOccupancy;
  document.getElementById("asmp-social-occ").value = s.assumptions.socialOccupancy;
  document.getElementById("asmp-default-room").value = s.assumptions.defaultRoomType;

  // 6. Discounts
  const discTbody = document.querySelector("#table-discounts tbody");
  discTbody.innerHTML = s.discountRules.map((rule, index) => `
    <tr>
      <td><strong>${rule.name}</strong></td>
      <td style="font-family: var(--font-mono); font-size: 11px;">${rule.type}</td>
      <td>
        <input type="number" class="table-input disc-thresh" data-index="${index}" value="${rule.threshold}" />
      </td>
      <td>
        <input type="number" class="table-input disc-pct" data-index="${index}" value="${rule.discountPercent}" min="1" max="50" />%
      </td>
      <td style="font-family: var(--font-mono); font-size: 11px; color: var(--accent-cyan);">${rule.appliesTo}</td>
    </tr>
  `).join("");

  // 7. Tree rules
  document.getElementById("rule-offsite-conf").checked = s.crossSellRules.autoSizeConferenceRoom;
  document.getElementById("rule-conf-dinner").checked = s.crossSellRules.suggestDinnerOnConference;
  document.getElementById("rule-dinner-drinks").checked = s.crossSellRules.suggestDrinksOnDinner;
  document.getElementById("rule-wedding-bundle").checked = s.crossSellRules.weddingPackageBundle;
}

function saveSettingsFromDOM() {
  const current = stateStore.settings;

  // Update Rooms
  document.querySelectorAll(".room-price").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.rooms[idx].pricePerNight = parseFloat(input.value) || 0;
  });
  document.querySelectorAll(".room-max-pax").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.rooms[idx].maxPeople = parseInt(input.value, 10) || 1;
  });
  document.querySelectorAll(".room-stock").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.rooms[idx].availableRooms = parseInt(input.value, 10) || 0;
  });

  // Update Conference Rooms
  document.querySelectorAll(".hall-price").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.conferenceRooms[idx].pricePerDay = parseFloat(input.value) || 0;
  });
  document.querySelectorAll(".hall-max").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.conferenceRooms[idx].maxPeople = parseInt(input.value, 10) || 0;
  });

  // Update Dinners
  document.querySelectorAll(".dinner-price").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.dinnerPackages[idx].pricePerPerson = parseFloat(input.value) || 0;
  });

  // Update Minimum Details Checkbox
  document.querySelectorAll("#min-details-list input[type='checkbox']").forEach(box => {
    const key = box.dataset.key;
    if (current.minimumDetails[key]) {
      current.minimumDetails[key].required = box.checked;
    }
  });

  // Update Assumptions
  current.assumptions.corporateOccupancy = parseInt(document.getElementById("asmp-corporate-occ").value, 10) || 1;
  current.assumptions.weddingOccupancy = parseInt(document.getElementById("asmp-wedding-occ").value, 10) || 3;
  current.assumptions.socialOccupancy = parseInt(document.getElementById("asmp-social-occ").value, 10) || 2;
  current.assumptions.defaultRoomType = document.getElementById("asmp-default-room").value;

  // Update Discounts
  document.querySelectorAll(".disc-thresh").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.discountRules[idx].threshold = parseInt(input.value, 10) || 0;
  });
  document.querySelectorAll(".disc-pct").forEach(input => {
    const idx = parseInt(input.dataset.index, 10);
    current.discountRules[idx].discountPercent = parseFloat(input.value) || 0;
  });

  // Update Tree Rules
  current.crossSellRules.autoSizeConferenceRoom = document.getElementById("rule-offsite-conf").checked;
  current.crossSellRules.suggestDinnerOnConference = document.getElementById("rule-conf-dinner").checked;
  current.crossSellRules.suggestDrinksOnDinner = document.getElementById("rule-dinner-drinks").checked;
  current.crossSellRules.weddingPackageBundle = document.getElementById("rule-wedding-bundle").checked;

  stateStore.saveSettings(current);
}

// =============================================================================
// UTILITIES
// =============================================================================
function showToast(msg) {
  const toast = document.getElementById("toast-banner");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function renderMarkdown(text) {
  let html = escapeHTML(text);

  // Bold **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  // Headings
  html = html.replace(/^### (.*$)/gim, '<h4 style="font-family: var(--font-display); font-size: 14px; color: var(--accent-gold); margin: 12px 0 6px 0;">$1</h4>');

  // Bullets
  html = html.replace(/^• (.*$)/gim, '<div style="margin-left: 8px; margin-bottom: 4px;">• $1</div>');
  html = html.replace(/^(\d+)\. \*\*(.*?)\*\*/gim, '<div style="margin-left: 8px; margin-bottom: 6px;"><strong>$1. $2</strong></div>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr style="border: none; border-top: 1px solid var(--border-subtle); margin: 14px 0;" />');

  // Blockquotes
  html = html.replace(/^> 🎯 (.*$)/gim, '<div style="background: rgba(168, 85, 247, 0.1); border-left: 3px solid var(--accent-purple); padding: 8px 12px; border-radius: 4px; margin: 10px 0; font-size: 13px;">🎯 $1</div>');

  // Newlines to line breaks (outside formatted structures)
  html = html.replace(/\n\n/g, '<div style="height: 10px;"></div>');

  return html;
}
