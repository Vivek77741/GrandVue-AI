/**
 * Hotel Group Booking Assistant - Conversational Copywriter
 * Generates natural, warm, executive-level hospitality responses
 * adhering 100% strictly to numbers provided by the deterministic engine.
 */

import { formatINR } from "./engine.js";

export function formatSystemResponse(evaluationResult) {
  if (evaluationResult.status === "CONFIRMED") {
    return formatConfirmedResponse(evaluationResult);
  }
  if (evaluationResult.status === "NEEDS_INFO") {
    return formatFollowUpResponse(evaluationResult);
  }
  return formatQuoteResponse(evaluationResult);
}

function formatConfirmedResponse(result) {
  const { bookingId, confirmedQuote } = result;
  const guestName = result.guestName || (result.parsedData?.entities?.guestName) || extractGuestName(result.parsedData?.rawText || "");
  const greeting = guestName && guestName !== "Guest" ? `Hello ${guestName},` : "Hello,";
  const dateStr = confirmedQuote ? (confirmedQuote.dateString || "your requested dates") : "your stay";
  const total = confirmedQuote ? formatINR(confirmedQuote.finalTotal) : "";
  const rooms = confirmedQuote ? `${confirmedQuote.roomsNeeded} ${confirmedQuote.roomType?.name || 'rooms'}` : "your room block";

  return `${greeting}

🎉 **Wonderful news! Your booking has been officially confirmed and reserved!**

We have locked in **${rooms}** and event facilities for **${dateStr}** under Confirmation Reference **#${bookingId}**${total ? ` for a final binding total of **${total}**` : ""}.

**Next Steps:**
1. Our Reservations Team has queued your official booking voucher and reservation agreement to your email.
2. A dedicated Event Coordinator will contact you within 24 hours to coordinate check-in logistics and banquet timings.

Thank you for choosing **The Grand Regal Hotel & Convention Resort**. We look forward to hosting an unforgettable experience for your group!`;
}

function formatFollowUpResponse(result) {
  const { intent, followUpQuestions, parsedData } = result;
  const guestName = (parsedData?.entities?.guestName) || extractGuestName(parsedData?.rawText || "");
  const greeting = guestName ? `Hello ${guestName},` : "Hello,";

  let intro = "Thank you for reaching out!";
  if (intent.type === "wedding") {
    intro = "Congratulations on the upcoming wedding celebration!";
  } else if (intent.type === "corporate_offsite") {
    intro = "Thank you for reaching out regarding your company offsite!";
  }

  const questionsList = followUpQuestions.map((q, idx) => `${idx + 1}. **${q}**`).join("\n");

  return `${greeting}

${intro} To send you an instant quote and verify room blocks, could you please clarify:

${questionsList}

As soon as you reply, we'll send your estimate right away!`;
}

function formatQuoteResponse(quote) {
  const { intent, dateString, finalTotal, budgetAnalysis, parsedData } = quote;
  const guestName = (parsedData?.entities?.guestName) || extractGuestName(parsedData?.rawText || "");
  const greeting = guestName ? `Hello ${guestName},` : "Hello,";

  let eventTitle = "Group Stay";
  if (intent.type === "wedding") eventTitle = "Wedding Celebration";
  else if (intent.type === "corporate_offsite") eventTitle = "Corporate Offsite";
  else if (intent.type === "family_reunion") eventTitle = "Family Reunion";

  const isUpdate = Boolean(parsedData?.lastQuote);
  let leadText = isUpdate
    ? `We have updated your tailored estimate for your **${eventTitle}** (${dateString}) with **${quote.roomsNeeded} ${quote.roomType.name}s** as requested.`
    : `Thank you for reaching out! We have prepared your instant estimate for your **${eventTitle}** (${dateString}).`;

  let quoteTerm = isUpdate ? "updated quote" : "tailored initial quote";
  let budgetLine = budgetAnalysis ? `\n\n> 🎯 **Budget Note**: ${budgetAnalysis.verdict}` : "";

  return `${greeting}

${leadText}

Your ${quoteTerm} comes to **${formatINR(finalTotal)}**. To give you this quote immediately without unnecessary email exchanges, we've applied standard baseline assumptions—all of which are fully customizable anytime.${budgetLine}

Please review your itemized estimate below:`;
}

function extractGuestName(text) {
  const match = text.match(/(?:thanks|regards|cheers|sincerely|best),?\s+([a-zA-Z]+)(?:\s*,\s*[a-zA-Z]+)?$/im) ||
                text.match(/(?:thanks|regards|cheers),?\s*([a-zA-Z]+)$/im);
  return match ? match[1].trim() : null;
}
