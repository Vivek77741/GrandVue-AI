/**
 * GrandVue AI - Live Gemini 2.5 Flash Integration Service
 * Uses Google's official @google/genai SDK with structured output.
 */

import { GoogleGenAI } from "@google/genai";
import { parseInboundEmail } from "./parser.js";
import { formatSystemResponse } from "./copywriter.js";

/**
 * Dynamically resolves Gemini API Key:
 * 1. Checks browser localStorage ("grandvue_gemini_key" or "gemini_api_key")
 * 2. Checks Vite environment variable (import.meta.env.VITE_GEMINI_API_KEY)
 */
export function getGeminiApiKey() {
  if (typeof localStorage !== "undefined") {
    const stored = localStorage.getItem("grandvue_gemini_key") || localStorage.getItem("gemini_api_key");
    if (stored && stored.trim()) return stored.trim();
  }
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_GEMINI_API_KEY) {
    return import.meta.env.VITE_GEMINI_API_KEY.trim();
  }
  return "";
}

export const GEMINI_MODEL = "gemini-2.5-flash";

function getAIClient() {
  const apiKey = getGeminiApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

/**
 * Uses Gemini 2.5 Flash to semantically parse the inbound email into structured JSON.
 */
export async function parseEmailWithGemini(emailText, previousContext = null) {
  const prompt = `
You are the AI Parser for GrandVue Hotel's Group Booking System.
Analyze this inbound email from a prospective group guest and extract structured parameters.

Inbound Email:
"""
${emailText}
"""

${previousContext ? `Previous Conversation Context:
- Previous Intent: ${previousContext.intent ? previousContext.intent.label : "None"} (type: ${previousContext.intent ? previousContext.intent.type : "None"})
- Previous Entities: ${JSON.stringify(previousContext.entities, null, 2)}
` : ""}

CRITICAL MULTI-TURN RULES:
1. INTENT INHERITANCE: If this is an ongoing thread and the guest is updating details or confirming (e.g. "update to super deluxe and confirm the booking"), KEEP the existing event intent type (${previousContext && previousContext.intent ? previousContext.intent.type : 'corporate_offsite'}). Do NOT downgrade to "general_group"!
2. CONFIRMATION DETECTION: If the user says "confirm", "confirm it", "confirm the booking", "proceed", "let's book", "we accept", mark "isConfirmation": true!
3. UPGRADES: If user requests "super deluxe", set roomTierRequested = "super_deluxe". If "suite", set "suite". If "deluxe", set "deluxe".
4. PRESERVE UNCHANGED DATA: Retain guestCount, nights, dates, and guestName from previous context if not explicitly changed!

Return ONLY valid JSON matching this schema:
{
  "intent": {
    "type": "corporate_offsite" | "wedding" | "conference" | "family_reunion" | "general_group" | "confirmation",
    "label": string,
    "confidence": number between 0.8 and 1.0,
    "isConfirmation": boolean,
    "reasons": string[]
  },
  "entities": {
    "guestCount": number | null,
    "nights": number | null,
    "checkInDate": string | null,
    "checkOutDate": string | null,
    "dateString": string | null,
    "roughMonth": string | null,
    "advanceDays": number,
    "budget": number | null,
    "roomTierRequested": string | null,
    "hallRequested": boolean,
    "dinnerRequested": boolean,
    "drinksRequested": boolean,
    "guestName": string | null
  }
}
`;

  const ai = getAIClient();
  if (!ai) {
    return parseInboundEmail(emailText, previousContext);
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const parsedJson = JSON.parse(response.text.trim());

    // Comprehensive confirmation regex matcher
    const isConfirm = Boolean(
      parsedJson.intent?.isConfirmation ||
      /(?:confirm|confirmed|confirming|please confirm|proceed|book it|let'?s book|go ahead and book|yes please|we accept|lock it in|reserve it|finalize|confirm the booking|confirm booking|book this)/i.test(emailText)
    );

    // Merge previous entities with newly extracted entities so nothing is lost!
    const mergedEntities = {
      ...(previousContext ? previousContext.entities : {}),
      ...parsedJson.entities
    };

    // Explicit room tier extraction override if mentioned
    if (/super deluxe/i.test(emailText)) {
      mergedEntities.roomTierRequested = "super_deluxe";
    } else if (/suite/i.test(emailText)) {
      mergedEntities.roomTierRequested = "suite";
    } else if (/deluxe/i.test(emailText) && !/super/i.test(emailText)) {
      mergedEntities.roomTierRequested = "deluxe";
    }

    // STRICT INTENT INHERITANCE:
    // If an event archetype was previously established (e.g. corporate_offsite or wedding),
    // NEVER allow Gemini to downgrade it to general_group unless user explicitly states a new event type!
    let finalIntent = parsedJson.intent || {};
    const hasExplicitNewEventType = /wedding|marriage|shaadi|reception|bride|groom/i.test(emailText) ||
                                  /offsite|corporate|software company|employee|team retreat/i.test(emailText) ||
                                  /conference|summit|boardroom|convention/i.test(emailText) ||
                                  /reunion|family|anniversary/i.test(emailText);

    if (!hasExplicitNewEventType && previousContext && previousContext.intent && previousContext.intent.type && previousContext.intent.type !== "general_group") {
      finalIntent = {
        ...previousContext.intent,
        confidence: 1.0,
        reasons: [...(previousContext.intent.reasons || []), "Maintained from active conversation context"]
      };
    }

    finalIntent.isConfirmation = isConfirm;

    return {
      rawText: emailText,
      intent: finalIntent,
      entities: mergedEntities,
      isConfirmation: isConfirm,
      lastQuote: previousContext ? previousContext.lastQuote : null,
      timestamp: new Date().toISOString(),
      source: "gemini-2.5-flash"
    };
  } catch (error) {
    console.warn("Gemini parsing failed or rate-limited (429), falling back seamlessly to local parser:", error.message || error);
    return parseInboundEmail(emailText, previousContext);
  }
}

/**
 * Uses Gemini 2.5 Flash to synthesize polite, high-end hospitality prose
 * strictly incorporating the deterministic numbers calculated by code.
 */
export async function draftReplyWithGemini(evaluationResult, quoteDetailsText) {
  const { status, intent, followUpQuestions, parsedData } = evaluationResult;
  const guestName = (parsedData && parsedData.entities && parsedData.entities.guestName) || "Guest";

  let prompt = "";
  if (status === "CONFIRMED") {
    prompt = `
You are the Reservations Concierge at The Grand Regal Hotel.
The guest wrote: "${parsedData.rawText}" to confirm their booking.
Confirmation Reference: #${evaluationResult.bookingId}
Dates: ${evaluationResult.confirmedQuote ? evaluationResult.confirmedQuote.dateString : "your stay"}
Grand Total: ${evaluationResult.confirmedQuote ? evaluationResult.confirmedQuote.finalTotal : ""}

Write an enthusiastic, warm, and concise confirmation email (maximum 3-4 sentences total).
- Warmly celebrate and thank them for confirming their booking!
- State that their room block and event facilities are now officially locked in under Confirmation #${evaluationResult.bookingId}.
- Mention that their official booking voucher has been emailed, and an Event Coordinator will connect with them within 24 hours to coordinate check-in and timings.
- Keep it concise, friendly, and joyful. Do NOT include subject lines.
`;
  } else if (status === "NEEDS_INFO") {
    prompt = `
You are the Reservations Concierge at The Grand Regal Hotel.
The guest wrote: "${parsedData.rawText}"

Write a VERY SHORT, warm reply (maximum 3-4 sentences total).
Acknowledge the event (${intent.label}) politely.
Ask ONLY these missing questions directly:
${followUpQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Do NOT include subject lines, placeholders, or long marketing filler. Keep it brief, friendly, and direct.
`;
  } else {
    prompt = `
You are the Reservations Concierge at The Grand Regal Hotel.
The guest wrote: "${parsedData.rawText}"

Our deterministic engine calculated this exact estimate:
- Final Total: ${quoteDetailsText}
- Assumptions: Stated in attached quote card

Write a VERY SHORT, friendly email intro (maximum 2-3 short sentences total).
State that their instant initial estimate is ready below for their ${intent.label}. Mention the grand total.
Remind them that baseline assumptions (room type, meals) are applied so they get an immediate estimate without delay, and can be customized anytime.

CRITICAL RULES:
- Maximum 50-60 words total!
- Do NOT include subject lines.
- Do NOT repeat the full line item table (it is already rendered in the quote card below).
- Be crisp, welcoming, and concise.
`;
  }

  const ai = getAIClient();
  if (!ai) {
    return formatSystemResponse(evaluationResult);
  }

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });

    return response.text.trim();
  } catch (error) {
    console.warn("Gemini copywriter failed or rate-limited, using high-end deterministic copywriter:", error.message || error);
    return formatSystemResponse(evaluationResult);
  }
}
