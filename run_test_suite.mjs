/**
 * Comprehensive Automated Test Suite for GrandVue AI Hotel Group Booking Assistant
 * Covers all 4 PDF Benchmark Scenarios, Multi-Turn Workflows, and 12+ Edge Cases.
 */

import fs from 'fs';
import { parseInboundEmail, classifyIntent, parseEntities, extractGuestName } from './src/parser.js';
import { evaluateInquiry, formatINR } from './src/engine.js';
import { formatSystemResponse } from './src/copywriter.js';
import { stateStore } from './src/state.js';

const defaultSettings = JSON.parse(JSON.stringify(stateStore.settings));

class TestRunner {
  constructor() {
    this.results = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    try {
      const details = fn();
      this.passed++;
      this.results.push({ name, status: 'PASSED', details });
      console.log(`✓ [PASS] ${name}`);
    } catch (err) {
      this.failed++;
      this.results.push({ name, status: 'FAILED', error: err.message, stack: err.stack });
      console.error(`✗ [FAIL] ${name}: ${err.message}`);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(`${message || 'Assertion failed'} - Expected: ${expected}, Got: ${actual}`);
    }
  }

  generateMarkdownReport(outputPath) {
    let md = `# GrandVue AI - Comprehensive Test Suite Execution Report\n`;
    md += `**Execution Timestamp**: ${new Date().toISOString()}\n`;
    md += `**Total Tests**: ${this.passed + this.failed} | **Passed**: ${this.passed} | **Failed**: ${this.failed}\n\n`;
    md += `---\n\n`;

    md += `## 1. Executive Summary & Test Matrix\n\n`;
    md += `| # | Test Scenario Category | Description | Status |\n`;
    md += `|---|---|---|:---:|\n`;

    this.results.forEach((r, idx) => {
      const badge = r.status === 'PASSED' ? '✅ PASS' : '❌ FAIL';
      md += `| ${idx + 1} | ${r.name.split(':')[0]} | ${r.name.split(':').slice(1).join(':').trim() || r.name} | ${badge} |\n`;
    });

    md += `\n---\n\n## 2. Detailed Test Results & Mathematical Audits\n\n`;

    this.results.forEach((r, idx) => {
      md += `### Test ${idx + 1}: ${r.name}\n`;
      md += `**Result**: ${r.status === 'PASSED' ? '✅ PASSED' : '❌ FAILED'}\n\n`;

      if (r.error) {
        md += `> [!CAUTION]\n> **Error**: ${r.error}\n\n`;
      }

      if (r.details) {
        md += `\`\`\`json\n${JSON.stringify(r.details, null, 2)}\n\`\`\`\n\n`;
        if (r.details.copywriterSnippet) {
          md += `**Generated Assistant Copy**:\n> ${r.details.copywriterSnippet.replace(/\n/g, '\n> ')}\n\n`;
        }
      }
      md += `---\n\n`;
    });

    fs.writeFileSync(outputPath, md, 'utf-8');
    console.log(`\n📄 Detailed report written to: ${outputPath}`);
  }
}

const runner = new TestRunner();

// =============================================================================
// CATEGORY 1: OFFICIAL PDF BENCHMARK SCENARIOS (SECTION 9)
// =============================================================================

runner.test('Benchmark A (Turn 1): Missing Details (Wedding in Dec)', () => {
  const email = "Hi, we are planning my sister's wedding at your hotel sometime in December. Can you share the rates? Thanks, Priya";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.status, 'NEEDS_INFO', 'Status must be NEEDS_INFO');
  runner.assertEqual(evalResult.intent.type, 'wedding', 'Intent must be wedding');
  runner.assertEqual(evalResult.followUpQuestions.length, 2, 'Must ask exactly 2 follow-up questions');
  runner.assert(evalResult.followUpQuestions[0].includes('guests'), 'Must ask for guest count');
  runner.assert(evalResult.followUpQuestions[1].includes('December'), 'Must ask for specific dates in December');

  const copy = formatSystemResponse(evalResult);
  runner.assert(copy.includes('Priya'), 'Must greet guest by name');
  runner.assert(copy.includes('wedding'), 'Must acknowledge wedding');

  return {
    status: evalResult.status,
    intent: evalResult.intent.label,
    missingFields: evalResult.auditTrace.missingFields,
    followUpQuestions: evalResult.followUpQuestions,
    copywriterSnippet: copy
  };
});

runner.test('Benchmark A (Turn 2): Multi-Turn Resolution of Missing Details', () => {
  // Turn 1 setup
  const p1 = parseInboundEmail("Hi, we are planning my sister's wedding at your hotel sometime in December. Can you share the rates? Thanks, Priya");
  const e1 = evaluateInquiry(p1, defaultSettings);
  p1.lastQuote = e1;

  // Turn 2: Guest provides missing dates & pax
  const turn2Email = "We are expecting around 80 guests from 18 to 21 December 2026.";
  const p2 = parseInboundEmail(turn2Email, p1);
  const e2 = evaluateInquiry(p2, defaultSettings);

  runner.assertEqual(e2.status, 'QUOTED', 'Turn 2 must produce a QUOTE');
  runner.assertEqual(e2.intent.type, 'wedding', 'Must inherit wedding intent');
  runner.assertEqual(e2.guestCount, 80, 'Must record 80 guests');
  runner.assertEqual(e2.nights, 3, '18 to 21 Dec = 3 nights');
  runner.assertEqual(e2.roomsNeeded, 27, '80 guests / 3 per room = 27 rooms');

  // Math audit:
  // Rooms: 27 rooms * 5,000 * 3 = 4,05,000
  // Grand Hall: 1,20,000
  // Wedding Feast: 80 * 3,000 = 2,40,000
  // Wedding Decor: 1,50,000
  // Subtotal = 9,15,000
  // Volume Discount: 27 >= 20 rooms -> 10% on 4,05,000 = -40,500
  // Advance Discount (18 Dec 2026 is >60d): 5% on 9,15,000 = -45,750
  // Net = 9,15,000 - 86,250 = 8,28,750
  runner.assertEqual(e2.finalTotal, 828750, 'Final total must be exactly ₹8,28,750');

  return {
    status: e2.status,
    roomsAllocated: `${e2.roomsNeeded} ${e2.roomType.name}s`,
    lineItems: e2.lineItems.map(l => `${l.name}: ${formatINR(l.subtotal)}`),
    discounts: e2.discounts.map(d => `${d.name}: -${formatINR(d.savings)}`),
    finalTotal: formatINR(e2.finalTotal)
  };
});

runner.test('Benchmark B (Turn 1): Corporate Offsite (30 pax, Nov 12-14)', () => {
  const email = "Hello, we are a software company planning an offsite for 30 employees from 12 to 14 November 2026. Please send a quote. Regards, Arjun, HR";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.status, 'QUOTED', 'Turn 1 must produce instant quote');
  runner.assertEqual(evalResult.intent.type, 'corporate_offsite', 'Intent must be corporate_offsite');
  runner.assertEqual(evalResult.roomsNeeded, 30, 'Corporate policy requires 1 pax/room = 30 rooms');
  runner.assertEqual(evalResult.nights, 2, '12 to 14 Nov = 2 nights');

  // Pricing math:
  // 30 Deluxe * 5000 * 2 = 3,00,000
  // Summit Hall * 2 days = 80,000
  // Classic Veg * 30 * 2 = 72,000
  // Gross Subtotal = 4,52,000
  // 10% Volume discount on rooms: 10% of 3,00,000 = -30,000
  // Net = 4,22,000
  runner.assertEqual(evalResult.grossSubtotal, 452000, 'Subtotal must be ₹4,52,000');
  runner.assertEqual(evalResult.totalDiscountAmount, 30000, 'Discounts must be ₹30,000');
  runner.assertEqual(evalResult.finalTotal, 422000, 'Net total must be ₹4,22,000');

  const copy = formatSystemResponse(evalResult);
  runner.assert(copy.includes('Arjun'), 'Must address Arjun');
  runner.assert(copy.includes('4,22,000'), 'Must include exact total ₹4,22,000');

  return {
    status: evalResult.status,
    guest: evalResult.parsedData.entities.guestName,
    rooms: `${evalResult.roomsNeeded} Deluxe Rooms (Single Occupancy)`,
    conferenceHall: 'Summit Hall (Capacity: 50, 2 days)',
    dining: 'Classic Veg Buffet (30 pax x 2 dinners)',
    subtotal: formatINR(evalResult.grossSubtotal),
    discount: formatINR(evalResult.totalDiscountAmount),
    netTotal: formatINR(evalResult.finalTotal),
    copywriterSnippet: copy
  };
});

runner.test('Benchmark B (Turn 2): Compound Modification + Confirmation', () => {
  // Turn 1 setup
  const p1 = parseInboundEmail("Hello, we are a software company planning an offsite for 30 employees from 12 to 14 November 2026. Please send a quote. Regards, Arjun, HR");
  const e1 = evaluateInquiry(p1, defaultSettings);
  p1.lastQuote = e1;

  // Turn 2: Compound upgrade + confirm
  const turn2Email = "update to super deluxe and confirm the booking";
  const p2 = parseInboundEmail(turn2Email, p1);
  const e2 = evaluateInquiry(p2, defaultSettings);

  runner.assertEqual(e2.status, 'CONFIRMED', 'Status must be CONFIRMED');
  runner.assertEqual(e2.intent.type, 'corporate_offsite', 'Must maintain corporate_offsite intent');
  runner.assertEqual(e2.roomType.id, 'super_deluxe', 'Room type must be upgraded to super_deluxe');
  runner.assertEqual(e2.roomsNeeded, 30, 'Must maintain 30 rooms (1 pax/room single occupancy)');
  runner.assert(e2.bookingId.startsWith('BK-'), 'Must generate official PMS booking ID');

  // Pricing math:
  // 30 Super Deluxe * 7,500 * 2 = 4,50,000
  // Summit Hall * 2 days = 80,000
  // Classic Veg * 30 * 2 = 72,000
  // Gross Subtotal = 6,02,000
  // 10% Volume discount on rooms: 10% of 4,50,000 = -45,000
  // Net = 5,57,000
  runner.assertEqual(e2.finalTotal, 557000, 'Final total must be exactly ₹5,57,000');

  const copy = formatSystemResponse(e2);
  runner.assert(copy.includes('Arjun'), 'Must address Arjun');
  runner.assert(copy.includes(e2.bookingId), 'Must cite PMS booking reference');
  runner.assert(copy.includes('5,57,000'), 'Must cite final binding total');

  return {
    status: e2.status,
    bookingId: e2.bookingId,
    guest: p2.entities.guestName,
    upgradedTier: e2.roomType.name,
    roomsAllocated: `${e2.roomsNeeded} rooms`,
    netTotal: formatINR(e2.finalTotal),
    copywriterSnippet: copy
  };
});

runner.test('Benchmark C (Turn 1): Wedding (90 pax, Jan 20-23, 2027 + Reception Hall)', () => {
  const email = "We have a wedding on 20 to 23 January 2027. Around 90 guests will stay. We will also need a hall for the reception. Please quote. Rahul";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.status, 'QUOTED', 'Turn 1 must produce instant quote');
  runner.assertEqual(evalResult.intent.type, 'wedding', 'Intent must be wedding');
  runner.assertEqual(evalResult.guestCount, 90, 'Headcount must be 90');
  runner.assertEqual(evalResult.nights, 3, '20 to 23 Jan = 3 nights');
  runner.assertEqual(evalResult.roomsNeeded, 30, 'Wedding policy 3 pax/room: 90 / 3 = 30 rooms');

  // Math audit:
  // 30 Deluxe * 5000 * 3 = 4,50,000
  // Grand Hall (Reception 1 day) = 1,20,000
  // Wedding Feast (90 pax * 3,000) = 2,70,000
  // Wedding Decor = 1,50,000
  // Gross Subtotal = 9,90,000
  // 1. 20+ Rooms Volume Discount: 10% on 4,50,000 = -45,000
  // 2. 60+ Days Advance Booking Discount: 5% on 9,90,000 = -49,500
  // Total Discounts = -94,500
  // Net Total = 9,90,000 - 94,500 = 8,95,500
  runner.assertEqual(evalResult.grossSubtotal, 990000, 'Gross subtotal must be ₹9,90,000');
  runner.assertEqual(evalResult.totalDiscountAmount, 94500, 'Total discounts must be ₹94,500');
  runner.assertEqual(evalResult.finalTotal, 895500, 'Net total must be ₹8,95,500');

  return {
    status: evalResult.status,
    guest: evalResult.parsedData.entities.guestName,
    rooms: `${evalResult.roomsNeeded} Deluxe Rooms`,
    receptionHall: 'Grand Hall',
    dining: 'Wedding Feast Banquet (90 pax)',
    decor: 'Luxury Stage & Floral Decor Included',
    bridalSuite: 'Complimentary Upgrade Included',
    discounts: evalResult.discounts.map(d => `${d.name}: -${formatINR(d.savings)}`),
    netTotal: formatINR(evalResult.finalTotal)
  };
});

runner.test('Benchmark C (Turn 2): Booking Confirmation via Direct Request', () => {
  const p1 = parseInboundEmail("We have a wedding on 20 to 23 January 2027. Around 90 guests will stay. We will also need a hall for the reception. Please quote. Rahul");
  const e1 = evaluateInquiry(p1, defaultSettings);
  p1.lastQuote = e1;

  const turn2Email = "Please confirm the booking. Thanks, Rahul";
  const p2 = parseInboundEmail(turn2Email, p1);
  const e2 = evaluateInquiry(p2, defaultSettings);

  runner.assertEqual(e2.status, 'CONFIRMED', 'Status must be CONFIRMED');
  runner.assertEqual(e2.intent.type, 'wedding', 'Intent must be wedding');
  runner.assertEqual(e2.finalTotal, 895500, 'Must confirm at ₹8,95,500');

  const copy = formatSystemResponse(e2);
  runner.assert(copy.includes('Rahul'), 'Must greet Rahul');
  runner.assert(copy.includes(e2.bookingId), 'Must cite booking ID');

  return {
    status: e2.status,
    bookingId: e2.bookingId,
    guest: p2.entities.guestName,
    confirmedTotal: formatINR(e2.finalTotal),
    copywriterSnippet: copy
  };
});

runner.test('Benchmark D: Budget-Based Inquiry (₹3 Lakh, 2-night family reunion, 25 pax)', () => {
  const email = "Our budget is ₹3 lakh for a 2-night family reunion in February, about 25 people. What packages do you have? Meena";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.status, 'QUOTED', 'Must generate Turn 1 quote');
  runner.assertEqual(evalResult.intent.type, 'family_reunion', 'Intent must be family_reunion');
  runner.assertEqual(evalResult.guestCount, 25, 'Guest count must be 25');
  runner.assertEqual(evalResult.roomsNeeded, 13, '2 pax/room social occupancy: ceil(25/2) = 13 rooms');

  // Math audit:
  // 13 Deluxe * 5,000 * 2 = 1,30,000
  // Gathering Hall (Summit Hall 1 day) = 40,000
  // Classic Veg (25 pax * 2 nights * 1,200) = 60,000
  // Subtotal = 2,30,000 (No volume discount because 13 < 20 rooms)
  // Net = 2,30,000
  // Budget = 3,00,000
  // Difference = +70,000 surplus
  runner.assertEqual(evalResult.finalTotal, 230000, 'Final total must be ₹2,30,000');
  runner.assert(evalResult.budgetAnalysis !== null, 'Budget analysis object must be present');
  runner.assert(evalResult.budgetAnalysis.isWithinBudget === true, 'Must be within budget');
  runner.assertEqual(evalResult.budgetAnalysis.difference, 70000, 'Surplus buffer must be ₹70,000');

  const copy = formatSystemResponse(evalResult);
  runner.assert(copy.includes('Meena'), 'Must greet Meena');
  runner.assert(copy.includes('surplus buffer of ₹70,000'), 'Must mention surplus in copy');

  return {
    status: evalResult.status,
    guest: evalResult.parsedData.entities.guestName,
    budgetStated: formatINR(300000),
    packageCost: formatINR(evalResult.finalTotal),
    surplusBuffer: formatINR(evalResult.budgetAnalysis.difference),
    verdict: evalResult.budgetAnalysis.verdict,
    copywriterSnippet: copy
  };
});

// =============================================================================
// CATEGORY 2: EDGE CASES & SYSTEM BOUNDARIES
// =============================================================================

runner.test('Edge Case 1: Empty or Zero-Detail Inbound Email', () => {
  const email = "Hi, I want to book some rooms for an event.";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.status, 'NEEDS_INFO', 'Must require info');
  runner.assertEqual(evalResult.followUpQuestions.length, 2, 'Must ask for missing dates and headcount');

  return {
    status: evalResult.status,
    missingFields: evalResult.auditTrace.missingFields.map(m => m.field),
    followUpQuestions: evalResult.followUpQuestions
  };
});

runner.test('Edge Case 2: Only Headcount Provided (No Dates, No Booking Type)', () => {
  const email = "Hello, we need rooms for 45 people. Can you quote?";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.status, 'NEEDS_INFO', 'Must request missing fields');
  runner.assert(evalResult.auditTrace.missingFields.some(f => f.field === 'dates'), 'Must flag missing dates');

  return {
    status: evalResult.status,
    detectedGuests: evalResult.parsedData.entities.guestCount,
    missingFields: evalResult.auditTrace.missingFields.map(m => m.field)
  };
});

runner.test('Edge Case 3: Only Date Range Provided (No Pax, No Booking Type)', () => {
  const email = "Do you have rooms available from 15 to 18 March 2027?";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.status, 'NEEDS_INFO', 'Must request missing fields');
  runner.assertEqual(evalResult.parsedData.entities.nights, 3, 'Must parse 3 nights');
  runner.assert(evalResult.auditTrace.missingFields.some(f => f.field === 'guestCount'), 'Must flag missing guestCount');

  return {
    status: evalResult.status,
    detectedDates: evalResult.parsedData.entities.dateString,
    missingFields: evalResult.auditTrace.missingFields.map(m => m.field)
  };
});

runner.test('Edge Case 4: Volume Discount Boundary (19 Rooms vs 20 Rooms)', () => {
  // Case A: 19 rooms corporate (19 pax, 1 night)
  const email19 = "Corporate retreat for 19 employees for 1 night on 10 Nov 2026";
  const p19 = parseInboundEmail(email19);
  const e19 = evaluateInquiry(p19, defaultSettings);
  runner.assertEqual(e19.roomsNeeded, 19, 'Must need 19 rooms');
  runner.assertEqual(e19.discounts.filter(d => d.name.includes('20+ Rooms')).length, 0, '19 rooms must get 0% volume discount');

  // Case B: 20 rooms corporate (20 pax, 1 night)
  const email20 = "Corporate retreat for 20 employees for 1 night on 10 Nov 2026";
  const p20 = parseInboundEmail(email20);
  const e20 = evaluateInquiry(p20, defaultSettings);
  runner.assertEqual(e20.roomsNeeded, 20, 'Must need 20 rooms');
  runner.assertEqual(e20.discounts.filter(d => d.name.includes('20+ Rooms')).length, 1, '20 rooms must trigger 10% volume discount');
  runner.assertEqual(e20.discounts[0].savings, 10000, '10% of (20 * 5000 * 1) = 10,000');

  return {
    rooms19Savings: 0,
    rooms20Savings: e20.discounts[0].savings,
    boundaryProof: 'Threshold condition (rooms >= 20) verified strictly'
  };
});

runner.test('Edge Case 5: Extended Stay Discount (4+ Nights)', () => {
  const email = "Corporate team workshop for 10 employees from 10 to 15 November 2026 (5 nights stay)";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.nights, 5, 'Must calculate 5 nights');
  const extendedStay = evalResult.discounts.find(d => d.name.includes('Extended Stay'));
  runner.assert(extendedStay !== undefined, 'Must trigger 4+ Nights Extended Stay discount');
  runner.assertEqual(extendedStay.percent, 5, 'Must be 5% discount');

  // Math: 10 rooms * 5,000 * 5 nights = 2,50,000 -> 5% = 12,500
  runner.assertEqual(extendedStay.savings, 12500, '5% of 2,50,000 = 12,500');

  return {
    nights: evalResult.nights,
    discountName: extendedStay.name,
    savings: formatINR(extendedStay.savings)
  };
});

runner.test('Edge Case 6: Multiple Discounts Stacking (Volume + Extended + Advance)', () => {
  // 25 rooms (>= 20) + 5 nights (>= 4) + Year 2027 (>= 60 days advance)
  const email = "Corporate convention for 25 employees from 10 to 15 January 2027";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.roomsNeeded, 25, '25 rooms');
  runner.assertEqual(evalResult.nights, 5, '5 nights');
  runner.assert(evalResult.discounts.length >= 3, 'Must trigger all 3 discount rules');

  const vol = evalResult.discounts.find(d => d.id === 'volume_20_rooms' || d.name.includes('20+ Rooms'));
  const ext = evalResult.discounts.find(d => d.id === 'extended_stay_4_nights' || d.name.includes('Extended Stay'));
  const adv = evalResult.discounts.find(d => d.id === 'advance_booking_60_days' || d.name.includes('Advance Booking'));

  runner.assert(vol !== undefined, 'Volume discount triggered');
  runner.assert(ext !== undefined, 'Extended stay discount triggered');
  runner.assert(adv !== undefined, 'Advance booking discount triggered');

  return {
    discountsApplied: evalResult.discounts.map(d => `${d.name} (${d.percent}%): -${formatINR(d.savings)}`),
    totalSavings: formatINR(evalResult.totalDiscountAmount),
    netTotal: formatINR(evalResult.finalTotal)
  };
});

runner.test('Edge Case 7: Small Executive Meeting Hall Fit (12 Pax -> Boardroom)', () => {
  const email = "Board meeting for 12 directors from 10 to 11 November 2026. Need meeting room.";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  const hallItem = evalResult.lineItems.find(l => l.category.includes('Conference') || l.category.includes('Meeting'));
  runner.assert(hallItem !== undefined, 'Conference item must be allocated');
  runner.assert(hallItem.name.includes('Boardroom'), 'Must allocate Boardroom (cap 15) for 12 pax');

  return {
    headcount: 12,
    hallAllocated: hallItem.name,
    hallPricePerDay: formatINR(hallItem.unitPrice)
  };
});

runner.test('Edge Case 8: Mega Convention Hall Fit (150 Pax -> Grand Hall)', () => {
  const email = "Corporate annual conference for 150 employees from 10 to 12 November 2026.";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  const hallItem = evalResult.lineItems.find(l => l.category.includes('Conference'));
  runner.assert(hallItem !== undefined, 'Conference item must be allocated');
  runner.assert(hallItem.name.includes('Grand Hall'), 'Must allocate Grand Hall (cap 200) for 150 pax');

  return {
    headcount: 150,
    hallAllocated: hallItem.name
  };
});

runner.test('Edge Case 9: Explicit Executive Suite Request in Turn 1', () => {
  const email = "Corporate retreat for 10 executives from 10 to 12 November 2026. Please quote Executive Suites only.";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.roomType.id, 'suite', 'Must allocate suite tier');
  runner.assertEqual(evalResult.roomType.pricePerNight, 12000, 'Suite price is ₹12,000/night');

  return {
    requestedTier: evalResult.roomType.name,
    unitPrice: formatINR(evalResult.roomType.pricePerNight),
    roomSubtotal: formatINR(evalResult.lineItems[0].subtotal)
  };
});

runner.test('Edge Case 10: Budget Exceeded Handling', () => {
  // Budget is only ₹1 Lakh, but corporate offsite for 30 pax costs > ₹4 Lakh
  const email = "We have a strict budget of ₹1 lakh for a 30 employee offsite on 12 to 14 November 2026.";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assert(evalResult.budgetAnalysis !== null, 'Budget analysis must be created');
  runner.assertEqual(evalResult.budgetAnalysis.isWithinBudget, false, 'Must flag budget as exceeded');
  runner.assert(evalResult.budgetAnalysis.difference < 0, 'Difference must be negative (deficit)');

  return {
    statedBudget: formatINR(100000),
    packageCost: formatINR(evalResult.finalTotal),
    deficit: formatINR(Math.abs(evalResult.budgetAnalysis.difference)),
    verdict: evalResult.budgetAnalysis.verdict
  };
});

runner.test('Edge Case 11: Inventory Shortage Alert (Overbooking Warning)', () => {
  // Deluxe room stock is 40 rooms. Request 50 rooms.
  const email = "Corporate offsite for 50 employees from 12 to 14 November 2026.";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, defaultSettings);

  runner.assertEqual(evalResult.roomsNeeded, 50, '50 rooms needed');
  runner.assert(evalResult.auditTrace.inventoryAlerts.length > 0, 'Must log inventory alert');
  runner.assert(evalResult.auditTrace.inventoryAlerts[0].needed > evalResult.auditTrace.inventoryAlerts[0].available, 'Alert must note needed > available');

  return {
    roomsNeeded: evalResult.roomsNeeded,
    stockAvailable: evalResult.roomType.availableRooms,
    alertMessage: evalResult.auditTrace.inventoryAlerts[0].message
  };
});

runner.test('Edge Case 12: Dynamic Settings Hot-Reload & Zero Hardcoding', () => {
  // Hotel increases Deluxe price to ₹6,500 and decreases Volume discount to 15 rooms @ 15%
  const customSettings = JSON.parse(JSON.stringify(defaultSettings));
  customSettings.rooms[0].pricePerNight = 6500; // Deluxe = 6500
  customSettings.discountRules[0].threshold = 15; // 15 rooms
  customSettings.discountRules[0].discountPercent = 15; // 15%

  const email = "Corporate offsite for 16 employees from 12 to 14 November 2026.";
  const parsed = parseInboundEmail(email);
  const evalResult = evaluateInquiry(parsed, customSettings);

  // 16 rooms * 6,500 * 2 nights = 2,08,000
  runner.assertEqual(evalResult.lineItems[0].unitPrice, 6500, 'Must use customized rate ₹6,500');
  runner.assertEqual(evalResult.lineItems[0].subtotal, 208000, 'Must calculate subtotal with new rate');

  const volDiscount = evalResult.discounts.find(d => d.id === 'volume_20_rooms' || d.name.includes('20+ Rooms'));
  runner.assert(volDiscount !== undefined, 'Must trigger customized 15-room threshold');
  runner.assertEqual(volDiscount.percent, 15, 'Must apply new 15% rate');
  runner.assertEqual(volDiscount.savings, 31200, '15% of 2,08,000 = 31,200');

  return {
    customizedRoomPrice: formatINR(customSettings.rooms[0].pricePerNight),
    customizedDiscount: `${customSettings.discountRules[0].threshold}+ rooms -> ${customSettings.discountRules[0].discountPercent}%`,
    computedSavings: formatINR(volDiscount.savings),
    totalNet: formatINR(evalResult.finalTotal)
  };
});

runner.test('Edge Case 13: Multi-Turn Modification Without Confirmation', () => {
  const p1 = parseInboundEmail("Hello, we are a software company planning an offsite for 30 employees from 12 to 14 November 2026. Please send a quote. Regards, Arjun, HR");
  const e1 = evaluateInquiry(p1, defaultSettings);
  p1.lastQuote = e1;

  // Guest requests update WITHOUT confirming
  const turn2Email = "Can you please update the room tier to Super Deluxe and send revised pricing?";
  const p2 = parseInboundEmail(turn2Email, p1);
  const e2 = evaluateInquiry(p2, defaultSettings);

  runner.assertEqual(e2.status, 'QUOTED', 'Status must be QUOTED (Not confirmed yet)');
  runner.assertEqual(e2.roomType.id, 'super_deluxe', 'Must update room tier');
  runner.assertEqual(e2.finalTotal, 557000, 'Must calculate updated total ₹5,57,000');

  const copy = formatSystemResponse(e2);
  runner.assert(copy.includes('updated'), 'Must indicate that estimate is updated');
  runner.assert(copy.includes('Arjun'), 'Must address Arjun');

  return {
    status: e2.status,
    tierUpdated: e2.roomType.name,
    updatedTotal: formatINR(e2.finalTotal),
    copywriterSnippet: copy
  };
});

// =============================================================================
// RUN & GENERATE REPORT
// =============================================================================

console.log('\n======================================================');
console.log(`TEST SUITE SUMMARY: ${runner.passed} Passed, ${runner.failed} Failed`);
console.log('======================================================\n');

runner.generateMarkdownReport('TEST_RESULTS_REPORT.md');
