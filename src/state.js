/**
 * Hotel Group Booking Assistant - Application State & Settings Store
 * Matches all specifications from the problem statement.
 */

export const DEFAULT_SETTINGS = {
  hotelName: "The Grand Regal Hotel & Convention Resort",
  
  // 1. Room Types & Inventory (PDF Section 3 & 6)
  rooms: [
    { id: "deluxe", name: "Deluxe Room", maxPeople: 3, pricePerNight: 5000, availableRooms: 40 },
    { id: "super_deluxe", name: "Super Deluxe Room", maxPeople: 3, pricePerNight: 7500, availableRooms: 25 },
    { id: "suite", name: "Executive Suite", maxPeople: 3, pricePerNight: 12000, availableRooms: 10 }
  ],

  // 2. Conference & Event Rooms (PDF Section 3 & 6)
  conferenceRooms: [
    { id: "boardroom", name: "Boardroom", maxPeople: 15, pricePerDay: 15000 },
    { id: "summit_hall", name: "Summit Hall", maxPeople: 50, pricePerDay: 40000 },
    { id: "grand_hall", name: "Grand Hall (Weddings & Galas)", maxPeople: 200, pricePerDay: 120000 }
  ],

  // 3. Dinner Packages (PDF Section 3 & 6)
  dinnerPackages: [
    { id: "classic_veg", name: "Classic Veg Buffet", pricePerPerson: 1200, description: "Pure vegetarian buffet with starters, mains, and dessert" },
    { id: "classic_non_veg", name: "Classic Non-Veg Buffet", pricePerPerson: 1500, description: "Curated veg and non-veg buffet with chef specials" },
    { id: "premium_buffet", name: "Premium Buffet", pricePerPerson: 2200, description: "Live counters, artisanal roasts, gourmet desserts" },
    { id: "wedding_feast", name: "Wedding Feast Banquet", pricePerPerson: 3000, description: "Grand royal spread, plated table-side service & live stations" }
  ],

  // 4. Extras & Add-ons (PDF Section 3 & 6)
  extras: [
    { id: "drinks_package", name: "Premium Drinks Package", price: 1000, pricingType: "per_person", description: "Cocktails, mocktails, soft beverages & mixers" },
    { id: "wedding_decor", name: "Luxury Wedding Floral & Stage Decor", price: 150000, pricingType: "flat", description: "Stage styling, floral backdrops, entrance arches & ambient lighting" }
  ],

  // 5. Minimum Details Needed for a Quote (PDF Section 6 - Rule of 3)
  minimumDetails: {
    guestCount: { required: true, label: "Number of Guests" },
    dates: { required: true, label: "Check-in / Check-out Dates or Nights" },
    bookingType: { required: true, label: "Booking Type / Intent" },
    budget: { required: false, label: "Budget (Optional)" },
    roomTier: { required: false, label: "Preferred Room Category (Optional)" }
  },

  // 6. Default Assumptions Matrix (PDF Section 4.5 & 6)
  assumptions: {
    corporateOccupancy: 1,      // 1 person per room for Corporate/Offsite
    weddingOccupancy: 3,        // Up to max capacity (3) for Wedding
    socialOccupancy: 2,         // 2 persons per room for Family/Social
    defaultRoomType: "deluxe",  // Default room category
    offsiteRequiresHall: true,  // Offsite implies 1 conference room per full day
    defaultDinnerPackage: "classic_veg" // Default dinner package if not specified
  },

  // 7. Deterministic Discount Rules (PDF Section 4.4 & 6)
  discountRules: [
    { id: "room_volume_20", name: "20+ Rooms Volume Discount", type: "rooms_count", threshold: 20, discountPercent: 10, appliesTo: "rooms", description: "20 or more rooms -> 10% off room tariff" },
    { id: "extended_stay_4", name: "4+ Nights Extended Stay", type: "nights_count", threshold: 4, discountPercent: 5, appliesTo: "rooms", description: "4 or more nights -> 5% off room tariff" },
    { id: "advance_booking_60", name: "60+ Days Advance Booking", type: "advance_days", threshold: 60, discountPercent: 5, appliesTo: "total", description: "Booking 60+ days in advance -> 5% off total quote" }
  ],

  // 8. Cross-Sell Rules & Inventory Tree (PDF Section 4.3 & 6)
  crossSellRules: {
    suggestDinnerOnConference: true, // Books conference room -> suggest dinner package
    suggestDrinksOnDinner: true,     // Books dinner -> suggest drinks package
    autoSizeConferenceRoom: true,    // Offsite -> conference room sized to group
    weddingPackageBundle: true       // Wedding -> Grand Hall, Wedding Feast, Decor, Bridal Suite
  }
};

const STORAGE_KEY = "hotel_assistant_settings_v1";

class StateStore {
  constructor() {
    this.settings = this.loadSettings();
    this.listeners = [];
  }

  loadSettings() {
    try {
      if (typeof localStorage !== "undefined") {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (e) {
      console.warn("Failed to load settings from localStorage:", e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  }

  saveSettings(newSettings) {
    this.settings = JSON.parse(JSON.stringify(newSettings));
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
      }
    } catch (e) {
      console.error("Failed to save settings to localStorage:", e);
    }
    this.notify();
  }

  resetToDefaults() {
    this.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
    this.notify();
    return this.settings;
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.settings));
  }
}

export const stateStore = new StateStore();
