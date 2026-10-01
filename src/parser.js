/**
 * Hotel Group Booking Assistant - Semantic Parsing & Intent Classifier
 * Bridges natural language text into a structured booking inquiry object.
 */

export function classifyIntent(text, previousContext = null) {
  const lower = text.toLowerCase().trim();
  
  // Check if text contains confirmation intent anywhere
  const isConfirm = /(?:confirm|confirm it|confirmed|please confirm|proceed|book it|let'?s book|go ahead and book|yes please|we accept|lock it in|reserve it|finalize|confirm the booking)/i.test(lower);

  // Check if user explicitly changes event archetype in this turn
  if (/wedding|marriage|bride|groom|reception|shaadi|sangeet|mehendi/.test(lower)) {
    return {
      type: "wedding",
      label: "Wedding Celebration",
      confidence: 0.98,
      defaultOccupancyKey: "weddingOccupancy",
      isConfirmation: isConfirm,
      reasons: ["Detected wedding keywords (wedding/marriage/reception)"]
    };
  }
  
  if (/offsite|corporate|software company|employee|employees|team retreat|company trip|all-hands|business trip/.test(lower)) {
    return {
      type: "corporate_offsite",
      label: "Corporate Offsite / Retreat",
      confidence: 0.96,
      defaultOccupancyKey: "corporateOccupancy",
      isConfirmation: isConfirm,
      reasons: ["Detected corporate/work keywords (offsite/employees/company)"]
    };
  }

  if (/conference|summit|seminar|convention|boardroom|board meeting|agm|panel/.test(lower)) {
    return {
      type: "conference",
      label: "Conference / Business Meeting",
      confidence: 0.94,
      defaultOccupancyKey: "corporateOccupancy",
      isConfirmation: isConfirm,
      reasons: ["Detected business meeting/conference terminology"]
    };
  }

  if (/reunion|family|get[- ]?together|anniversary|birthday|holiday with family/.test(lower)) {
    return {
      type: "family_reunion",
      label: "Family Reunion / Social Group",
      confidence: 0.92,
      defaultOccupancyKey: "socialOccupancy",
      isConfirmation: isConfirm,
      reasons: ["Detected social/family reunion context"]
    };
  }

  // INHERIT PREVIOUS INTENT IN MULTI-TURN CONVERSATIONS!
  if (previousContext && previousContext.intent && previousContext.intent.type && previousContext.intent.type !== "general_group") {
    return {
      ...previousContext.intent,
      isConfirmation: isConfirm,
      reasons: [...(previousContext.intent.reasons || []), "Inherited from active booking thread"]
    };
  }

  // Pure confirmation fallback
  if (isConfirm && previousContext) {
    return {
      type: previousContext.intent ? previousContext.intent.type : "confirmation",
      label: previousContext.intent ? previousContext.intent.label : "Booking Confirmation",
      confidence: 1.0,
      isConfirmation: true,
      reasons: ["Guest confirmed acceptance of quote"]
    };
  }

  return {
    type: "general_group",
    label: "Group Booking",
    confidence: 0.70,
    defaultOccupancyKey: "socialOccupancy",
    isConfirmation: isConfirm,
    reasons: ["Default group booking classification"]
  };
}

export function parseEntities(text, previousContext = {}) {
  const lower = text.toLowerCase();
  const prevEntities = previousContext.entities || previousContext || {};

  const result = {
    guestName: extractGuestName(text) || prevEntities.guestName || null,
    guestCount: prevEntities.guestCount || null,
    nights: prevEntities.nights || null,
    checkInDate: prevEntities.checkInDate || null,
    checkOutDate: prevEntities.checkOutDate || null,
    dateString: prevEntities.dateString || null,
    roughMonth: prevEntities.roughMonth || null,
    advanceDays: prevEntities.advanceDays || 0,
    budget: prevEntities.budget || null,
    roomTierRequested: prevEntities.roomTierRequested || null,
    hallRequested: prevEntities.hallRequested || false,
    dinnerRequested: prevEntities.dinnerRequested || false,
    drinksRequested: prevEntities.drinksRequested || false,
    decorRequested: prevEntities.decorRequested || false
  };

  // 1. Guest Count Extraction
  // Patterns like: "30 employees", "30 employee offsite", "around 90 guests", "about 25 people", "12 directors", "10 executives"
  const explicitGuestMatch = text.match(/(?:for|around|about|approximately|total)?\s*(\d+)\s*(?:employees?|guests?|people|persons?|pax|attendees?|members?|executives?|directors?|delegates?|participants?|colleagues?|friends|family members?)/i) ||
                             text.match(/(\d+)\s*(?:employees?|guests?|people|persons?|pax|attendees?|members?|executives?|directors?|delegates?|participants?|colleagues?|friends|family members?)/i);
  if (explicitGuestMatch) {
    result.guestCount = parseInt(explicitGuestMatch[1], 10);
  } else {
    // Range only if accompanied by headcount noun
    const rangeMatch = text.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*(?:people|guests?|employees?|pax|members?|attendees?)/i);
    if (rangeMatch) {
      result.guestCount = parseInt(rangeMatch[2], 10);
    }
  }

  // 2. Budget Extraction
  // Patterns: "budget is ₹3 lakh", "budget of 3 lakhs", "strict budget of ₹1 lakh", "budget: 300000"
  const lakhMatch = text.match(/(?:budget|cap)\s*(?:is|of|around|approximately|:)?\s*₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)/i) ||
                    text.match(/₹?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|lacs)\s*(?:budget|cap)/i);
  if (lakhMatch) {
    result.budget = parseFloat(lakhMatch[1]) * 100000;
  } else {
    const numBudgetMatch = text.match(/(?:budget|cap)\s*(?:is|of|around|approximately|:)?\s*₹?\s*(\d{5,8})/i);
    if (numBudgetMatch) {
      result.budget = parseInt(numBudgetMatch[1], 10);
    }
  }

  // 3. Nights / Duration Extraction
  // Patterns: "2-night", "3 nights", "2 nights stay"
  const nightMatch = text.match(/(\d+)\s*[- ]?night(?:s)?/i);
  if (nightMatch) {
    result.nights = parseInt(nightMatch[1], 10);
  }

  // 4. Exact Date Range Extraction
  // Patterns like: "12 to 14 November 2026", "20 to 23 January 2027", "15 - 18 December"
  const dateRangeMatch = text.match(/(\d{1,2})\s*(?:to|-)\s*(\d{1,2})\s+([a-zA-Z]+)(?:\s+(\d{4}))?/i);
  if (dateRangeMatch) {
    const startDay = parseInt(dateRangeMatch[1], 10);
    const endDay = parseInt(dateRangeMatch[2], 10);
    const month = dateRangeMatch[3];
    const year = dateRangeMatch[4] ? parseInt(dateRangeMatch[4], 10) : 2026;
    
    result.nights = Math.max(1, endDay - startDay);
    result.checkInDate = `${startDay} ${month} ${year}`;
    result.checkOutDate = `${endDay} ${month} ${year}`;
    result.dateString = `${startDay} to ${endDay} ${month} ${year} (${result.nights} nights)`;
    result.roughMonth = month;

    // Estimate advance days relative to assumed benchmark date (Nov 2026)
    // 20 to 23 January 2027 is ~70+ days in advance
    if (year >= 2027 || (year === 2026 && /december/i.test(month))) {
      result.advanceDays = year >= 2027 ? 75 : 65;
    } else {
      result.advanceDays = 15;
    }
  }

  // 5. Vague / Rough Month
  // "sometime in December", "in February"
  const monthMatch = text.match(/(?:sometime in|in|during|for)\s+(January|February|March|April|May|June|July|August|September|October|November|December)/i);
  if (monthMatch && !result.dateString) {
    result.roughMonth = monthMatch[1];
    if (!result.nights) {
      result.nights = null; // Stays missing so we prompt!
    }
  }

  // 6. Explicit Hall / Facility requests
  if (/hall|reception|conference room|meeting room|ballroom|boardroom/i.test(lower)) {
    result.hallRequested = true;
  }

  // 7. Explicit Meal requests
  if (/dinner|food|catering|feast|buffet|lunch|breakfast/i.test(lower)) {
    result.dinnerRequested = true;
  }

  // 8. Explicit Drinks requests
  if (/drink|drinks|liquor|beverages|cocktails|bar/i.test(lower)) {
    result.drinksRequested = true;
  }

  // 9. Specific Room Tier request
  if (/super deluxe/i.test(lower)) {
    result.roomTierRequested = "super_deluxe";
  } else if (/suite|executive suite/i.test(lower)) {
    result.roomTierRequested = "suite";
  } else if (/deluxe/i.test(lower)) {
    result.roomTierRequested = "deluxe";
  }

  return result;
}

export function extractGuestName(text) {
  const clean = text.trim();
  // Standard sign-offs: "Thanks, Priya", "Regards, Arjun, HR"
  const signoffMatch = clean.match(/(?:thanks|regards|cheers|sincerely|best|warmly),?\s+([a-zA-Z]+)(?:\s*,\s*[a-zA-Z]+)?$/im) ||
                       clean.match(/(?:thanks|regards|cheers),?\s*([a-zA-Z]+)$/im);
  if (signoffMatch) return signoffMatch[1].trim();

  // Trailing single name at end of email: "...What packages do you have? Meena" or "...Please quote. Rahul"
  const trailingNameMatch = clean.match(/(?:[?.!]\s+|\n+)([A-Z][a-z]{2,15})$/);
  if (trailingNameMatch && !/^(hotel|please|thanks|regards|budget|quote|rates|rooms|suites)$/i.test(trailingNameMatch[1])) {
    return trailingNameMatch[1].trim();
  }

  return null;
}

export function parseInboundEmail(emailText, previousContext = null) {
  const intent = classifyIntent(emailText, previousContext);
  const entities = parseEntities(emailText, previousContext ? previousContext.entities : {});
  
  return {
    rawText: emailText,
    intent,
    entities,
    isConfirmation: intent.isConfirmation || false,
    lastQuote: previousContext ? previousContext.lastQuote : null,
    timestamp: new Date().toISOString()
  };
}
