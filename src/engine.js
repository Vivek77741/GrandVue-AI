/**
 * Hotel Group Booking Assistant - Deterministic Pricing & Calculation Engine
 * 
 * CRITICAL RULE (PDF Section 7):
 * All prices, discounts, room allocations, and totals MUST be calculated 
 * strictly by code and rules. Zero guessing, zero AI math hallucinations.
 */

export function formatINR(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

export function evaluateInquiry(parsedData, settings) {
  const { intent, entities } = parsedData;

  const auditTrace = {
    step: "EVALUATION",
    intent: intent,
    checkedRequiredFields: [],
    missingFields: [],
    appliedAssumptions: [],
    triggeredDiscounts: [],
    crossSellPath: [],
    inventoryAlerts: [],
    mathBreakdown: []
  };

  // ----------------------------------------------------
  // STEP 1: Rule of 3 Gatekeeper (Minimum Details Check)
  // ----------------------------------------------------
  const minConfig = settings.minimumDetails;

  if (minConfig.guestCount && minConfig.guestCount.required) {
    if (!entities.guestCount) {
      auditTrace.missingFields.push({ field: "guestCount", label: "Number of Guests" });
    } else {
      auditTrace.checkedRequiredFields.push({ field: "guestCount", value: entities.guestCount });
    }
  }

  if (minConfig.dates && minConfig.dates.required) {
    if (!entities.nights && !entities.checkInDate) {
      auditTrace.missingFields.push({ field: "dates", label: "Dates or Number of Nights" });
    } else {
      auditTrace.checkedRequiredFields.push({ field: "dates", value: entities.dateString || `${entities.nights} nights` });
    }
  }

  if (minConfig.bookingType && minConfig.bookingType.required) {
    if (!intent || !intent.type) {
      auditTrace.missingFields.push({ field: "bookingType", label: "Booking Type / Event Intent" });
    } else {
      auditTrace.checkedRequiredFields.push({ field: "bookingType", value: intent.label });
    }
  }

  // If key details are missing, return early with targeted follow-up questions
  if (auditTrace.missingFields.length > 0) {
    return {
      status: "NEEDS_INFO",
      intent,
      auditTrace,
      parsedData,
      followUpQuestions: generateFollowUpQuestions(auditTrace.missingFields, intent, entities)
    };
  }

  // ----------------------------------------------------
  // STEP 2: Resolve Assumptions (PDF Section 4.5 & Settings)
  // ----------------------------------------------------
  const guests = entities.guestCount;
  const nights = entities.nights || 2; // Conservative fallback if duration not given

  // 2.1 Occupancy per room based on booking archetype
  let occupancyPerRoom = 1;
  let occupancyRationale = "";

  if (intent.type === "corporate_offsite" || intent.type === "conference") {
    occupancyPerRoom = settings.assumptions.corporateOccupancy || 1;
    occupancyRationale = `Corporate policy: Single occupancy (${occupancyPerRoom} employee per room for privacy)`;
  } else if (intent.type === "wedding") {
    occupancyPerRoom = settings.assumptions.weddingOccupancy || 3;
    occupancyRationale = `Wedding policy: Maximum room capacity (${occupancyPerRoom} guests per room)`;
  } else {
    occupancyPerRoom = settings.assumptions.socialOccupancy || 2;
    occupancyRationale = `Social/Family policy: Shared occupancy (${occupancyPerRoom} guests per room)`;
  }

  auditTrace.appliedAssumptions.push({
    title: "Room Occupancy Density",
    description: occupancyRationale,
    value: `${occupancyPerRoom} pax/room`
  });

  // 2.2 Room Allocation
  const roomsNeeded = Math.ceil(guests / occupancyPerRoom);
  
  // 2.3 Room Tier Selection
  const requestedTierId = entities.roomTierRequested || settings.assumptions.defaultRoomType || "deluxe";
  const selectedRoom = settings.rooms.find(r => r.id === requestedTierId) || settings.rooms[0];

  auditTrace.appliedAssumptions.push({
    title: "Room Category",
    description: entities.roomTierRequested 
      ? `Explicitly requested ${selectedRoom.name}` 
      : `Default baseline assumption: ${selectedRoom.name}`,
    value: selectedRoom.name
  });

  // 2.4 Inventory check
  if (roomsNeeded > selectedRoom.availableRooms) {
    auditTrace.inventoryAlerts.push({
      roomType: selectedRoom.name,
      needed: roomsNeeded,
      available: selectedRoom.availableRooms,
      message: `Requested ${roomsNeeded} rooms exceeds available stock of ${selectedRoom.availableRooms}. Booking subject to waitlist or multi-tier split.`
    });
  }

  // Calculate Base Room Cost
  const roomPricePerNight = selectedRoom.pricePerNight;
  const grossRoomCost = roomsNeeded * roomPricePerNight * nights;

  auditTrace.mathBreakdown.push({
    item: "Accommodations",
    formula: `${roomsNeeded} rooms × ${formatINR(roomPricePerNight)} × ${nights} nights`,
    total: grossRoomCost
  });

  // ----------------------------------------------------
  // STEP 3: Cross-Sell Inventory Tree & Facilities (PDF 4.3)
  // ----------------------------------------------------
  const lineItems = [
    {
      category: "Accommodation",
      name: `${selectedRoom.name} (${roomsNeeded} rooms, ${nights} nights)`,
      unitPrice: roomPricePerNight,
      quantity: roomsNeeded * nights,
      subtotal: grossRoomCost,
      isCore: true
    }
  ];

  let hallCost = 0;
  let diningCost = 0;
  let extrasCost = 0;

  // 3.1 Offsite Inventory Branch
  if (intent.type === "corporate_offsite" || intent.type === "conference") {
    // Sized conference room fit
    const eligibleHalls = settings.conferenceRooms.filter(h => h.maxPeople >= guests);
    eligibleHalls.sort((a, b) => a.maxPeople - b.maxPeople);
    const chosenHall = eligibleHalls[0] || settings.conferenceRooms[settings.conferenceRooms.length - 1];

    if (settings.crossSellRules.autoSizeConferenceRoom || entities.hallRequested) {
      const hallDays = nights; // Full days assumption
      hallCost = chosenHall.pricePerDay * hallDays;
      lineItems.push({
        category: "Conference & Meeting Facility",
        name: `${chosenHall.name} (Capacity: ${chosenHall.maxPeople} pax, ${hallDays} day${hallDays > 1 ? 's' : ''})`,
        unitPrice: chosenHall.pricePerDay,
        quantity: hallDays,
        subtotal: hallCost,
        ruleTriggered: "Offsite Rule: Auto-sized conference room for full duration of stay"
      });

      auditTrace.crossSellPath.push({
        stage: "Conference Room Allocation",
        chosen: chosenHall.name,
        reason: `Smallest conference room holding ${guests} pax (Max capacity: ${chosenHall.maxPeople})`
      });

      auditTrace.appliedAssumptions.push({
        title: "Conference Space",
        description: `Group requires 1 dedicated conference hall for each day (${hallDays} days)`,
        value: chosenHall.name
      });
    }

    // Next node in tree: Conference room -> Suggest Dinner Package
    if (settings.crossSellRules.suggestDinnerOnConference || entities.dinnerRequested) {
      const defaultDinner = settings.dinnerPackages.find(d => d.id === settings.assumptions.defaultDinnerPackage) || settings.dinnerPackages[0];
      const mealQuantity = guests * nights;
      diningCost = defaultDinner.pricePerPerson * mealQuantity;

      lineItems.push({
        category: "Food & Beverage",
        name: `${defaultDinner.name} (${guests} pax × ${nights} dinners)`,
        unitPrice: defaultDinner.pricePerPerson,
        quantity: mealQuantity,
        subtotal: diningCost,
        ruleTriggered: "Cross-Sell Tree: Conference room booked -> Dinner package suggested"
      });

      auditTrace.crossSellPath.push({
        stage: "F&B Dinner Package",
        chosen: defaultDinner.name,
        reason: "Triggered by conference room inclusion; defaulted to Classic Veg buffet"
      });

      auditTrace.appliedAssumptions.push({
        title: "Dining Package",
        description: "Assumed standard Classic Veg buffet for all delegates",
        value: defaultDinner.name
      });
    }
  }

  // 3.2 Wedding Inventory Branch
  if (intent.type === "wedding") {
    // Grand Hall is designated for weddings
    const grandHall = settings.conferenceRooms.find(h => h.id === "grand_hall") || settings.conferenceRooms[settings.conferenceRooms.length - 1];
    const hallDays = 1; // 1 major reception day unless specified
    hallCost = grandHall.pricePerDay * hallDays;

    lineItems.push({
      category: "Wedding Banquet Venue",
      name: `${grandHall.name} (Reception Venue, ${hallDays} day)`,
      unitPrice: grandHall.pricePerDay,
      quantity: hallDays,
      subtotal: hallCost,
      ruleTriggered: "Wedding Rule: Grand Hall recommended for wedding reception"
    });

    auditTrace.crossSellPath.push({
      stage: "Wedding Reception Venue",
      chosen: grandHall.name,
      reason: "Grand Hall allocated as prime banquet space for wedding reception"
    });

    // Wedding Feast Dinner
    const weddingFeast = settings.dinnerPackages.find(d => d.id === "wedding_feast") || settings.dinnerPackages[settings.dinnerPackages.length - 1];
    diningCost = weddingFeast.pricePerPerson * guests;

    lineItems.push({
      category: "Wedding Banquet Dining",
      name: `${weddingFeast.name} (${guests} attendees)`,
      unitPrice: weddingFeast.pricePerPerson,
      quantity: guests,
      subtotal: diningCost,
      ruleTriggered: "Wedding Rule: Wedding Feast dinner package suggested"
    });

    auditTrace.crossSellPath.push({
      stage: "Wedding Catering",
      chosen: weddingFeast.name,
      reason: "High-touch premium served menu for wedding attendees"
    });

    // Wedding Decoration
    const decor = settings.extras.find(e => e.id === "wedding_decor");
    if (decor) {
      extrasCost += decor.price;
      lineItems.push({
        category: "Event Production & Decor",
        name: decor.name,
        unitPrice: decor.price,
        quantity: 1,
        subtotal: decor.price,
        ruleTriggered: "Wedding Rule: Luxury stage and floral decoration included"
      });

      auditTrace.crossSellPath.push({
        stage: "Event Decor",
        chosen: decor.name,
        reason: "Full stage & floral production cross-sell for weddings"
      });
    }

    // Bridal Suite
    const suite = settings.rooms.find(r => r.id === "suite");
    if (suite) {
      lineItems.push({
        category: "Complimentary VIP Upgrade",
        name: `Couple's Executive Bridal Suite (${nights} nights)`,
        unitPrice: 0,
        quantity: nights,
        subtotal: 0,
        ruleTriggered: "Wedding Courtesy: Complimentary Bridal Suite upgrade for the couple"
      });

      auditTrace.appliedAssumptions.push({
        title: "Couple's Suite",
        description: "1 Executive Suite allocated for the couple with wedding package",
        value: "Complimentary Upgrade"
      });
    }
  }

  // 3.3 Family Reunion / Social Group
  if (intent.type === "family_reunion" || intent.type === "general_group") {
    // Check if budget allows or if requested
    if (entities.hallRequested || entities.budget) {
      const eligibleHalls = settings.conferenceRooms.filter(h => h.maxPeople >= guests);
      eligibleHalls.sort((a, b) => a.maxPeople - b.maxPeople);
      const chosenHall = eligibleHalls[0] || settings.conferenceRooms[0];
      hallCost = chosenHall.pricePerDay * 1;

      lineItems.push({
        category: "Gathering Space",
        name: `${chosenHall.name} (Private hall for 1 day)`,
        unitPrice: chosenHall.pricePerDay,
        quantity: 1,
        subtotal: hallCost,
        ruleTriggered: "Social Group: Private gathering space included"
      });

      auditTrace.crossSellPath.push({
        stage: "Gathering Space",
        chosen: chosenHall.name,
        reason: `Sized for family gathering of ${guests} pax`
      });
    }

    // Dinner buffet
    const defaultDinner = settings.dinnerPackages.find(d => d.id === "classic_veg") || settings.dinnerPackages[0];
    diningCost = defaultDinner.pricePerPerson * guests * nights;

    lineItems.push({
      category: "Group Dining",
      name: `${defaultDinner.name} (${guests} pax × ${nights} dinners)`,
      unitPrice: defaultDinner.pricePerPerson,
      quantity: guests * nights,
      subtotal: diningCost,
      ruleTriggered: "Group Dining: Classic Veg buffet dinner"
    });
  }

  // ----------------------------------------------------
  // STEP 4: Discount Rules Evaluation (PDF Section 4.4)
  // ----------------------------------------------------
  let totalDiscountsAmount = 0;
  const appliedDiscounts = [];

  const grossSubtotal = grossRoomCost + hallCost + diningCost + extrasCost;

  settings.discountRules.forEach(rule => {
    let qualifies = false;
    let deduction = 0;
    let baseAmount = rule.appliesTo === "rooms" ? grossRoomCost : grossSubtotal;

    if (rule.type === "rooms_count" && roomsNeeded >= rule.threshold) {
      qualifies = true;
    } else if (rule.type === "nights_count" && nights >= rule.threshold) {
      qualifies = true;
    } else if (rule.type === "advance_days" && entities.advanceDays >= rule.threshold) {
      qualifies = true;
    }

    if (qualifies) {
      deduction = Math.round(baseAmount * (rule.discountPercent / 100));
      totalDiscountsAmount += deduction;
      appliedDiscounts.push({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        percent: rule.discountPercent,
        appliesTo: rule.appliesTo,
        savings: deduction
      });

      auditTrace.triggeredDiscounts.push({
        rule: rule.name,
        percent: `${rule.discountPercent}%`,
        amount: deduction,
        reason: rule.description
      });
    }
  });

  const finalTotal = Math.max(0, grossSubtotal - totalDiscountsAmount);

  // ----------------------------------------------------
  // STEP 5: Budget-Based Requests Optimization (PDF 4.6)
  // ----------------------------------------------------
  let budgetAnalysis = null;
  if (entities.budget) {
    const budgetAmount = entities.budget;
    const difference = budgetAmount - finalTotal;

    budgetAnalysis = {
      budgetSpecified: budgetAmount,
      finalTotal: finalTotal,
      isWithinBudget: finalTotal <= budgetAmount,
      difference: difference,
      verdict: finalTotal <= budgetAmount 
        ? `Package fits comfortably within your budget of ${formatINR(budgetAmount)}, leaving a surplus buffer of ${formatINR(difference)}.`
        : `Package exceeds the targeted budget of ${formatINR(budgetAmount)} by ${formatINR(Math.abs(difference))}. Recommendations below show closest tier options.`
    };
  }

  const isConfirmed = parsedData.isConfirmation || (intent && intent.isConfirmation) || intent.type === "confirmation";

  if (isConfirmed) {
    const bookingId = `BK-${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      status: "CONFIRMED",
      bookingId,
      intent,
      guestCount: guests,
      nights: nights,
      dateString: entities.dateString || `${nights} Nights Stay`,
      roomsNeeded,
      roomType: selectedRoom,
      occupancyPerRoom,
      lineItems,
      grossSubtotal,
      discounts: appliedDiscounts,
      totalDiscountAmount: totalDiscountsAmount,
      finalTotal,
      confirmedQuote: {
        quoteId: `Q-${Date.now().toString(36).toUpperCase()}`,
        roomsNeeded,
        roomType: selectedRoom,
        dateString: entities.dateString || `${nights} Nights Stay`,
        guestCount: guests,
        finalTotal,
        lineItems,
        discounts: appliedDiscounts,
        grossSubtotal
      },
      appliedAssumptions: auditTrace.appliedAssumptions,
      auditTrace: {
        ...auditTrace,
        step: "BOOKING_CONFIRMED",
        bookingStatus: "LOCKED_IN_PMS",
        message: `Booking #${bookingId} confirmed! ${roomsNeeded} ${selectedRoom.name}s and event facilities officially reserved.`
      },
      parsedData
    };
  }

  // Return the comprehensive quote result
  return {
    status: "QUOTED",
    quoteId: `Q-${Date.now().toString(36).toUpperCase()}`,
    intent,
    guestCount: guests,
    nights: nights,
    dateString: entities.dateString || `${nights} Nights Stay`,
    roomsNeeded,
    roomType: selectedRoom,
    occupancyPerRoom,
    lineItems,
    grossSubtotal,
    discounts: appliedDiscounts,
    totalDiscountAmount: totalDiscountsAmount,
    finalTotal,
    budgetAnalysis,
    appliedAssumptions: auditTrace.appliedAssumptions,
    auditTrace,
    parsedData
  };
}

function generateFollowUpQuestions(missingFields, intent, entities) {
  const questions = [];

  missingFields.forEach(mf => {
    if (mf.field === "dates") {
      if (entities.roughMonth) {
        questions.push(`What specific check-in and check-out dates in ${entities.roughMonth} are you planning for?`);
      } else {
        questions.push("What dates or how many nights are you planning your stay for?");
      }
    } else if (mf.field === "guestCount") {
      questions.push("Approximately how many guests or attendees will be staying at the hotel?");
    } else if (mf.field === "bookingType") {
      questions.push("Could you share what type of event this is (e.g., wedding, corporate offsite, conference, or family gathering)?");
    }
  });

  return questions;
}
