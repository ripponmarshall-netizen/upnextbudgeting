const DEMO_MODE = false;
const DEMO_DATE = "2026-04-19";
const STORAGE_KEY = "upnextbudgeting:v1";
const PUSH_REMINDER_DAYS = 5;
const SUPABASE_CONFIG = {
  url: "https://nmrtjlattlurektpkzzi.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5tcnRqbGF0dGx1cmVrdHBrenppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2ODAzNDYsImV4cCI6MjA5MTI1NjM0Nn0.qy8n7HQo7qDRTZt2YsmX8a8A_WsYewaG0JCASteBv5w",
  vapidPublicKey: "BH7l15H00yaZzqxZBHORO0CFoM7zWkskDjdTmeyEYORYK5p3QfqySFE_pw_EuzZGIAX3nQwweyxraki-Wx4tLOY"
};

function getToday() {
  if (DEMO_MODE) return new Date(`${DEMO_DATE}T12:00:00`);
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);
}

const today = getToday();

const icons = {
  plus: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  gear: `<svg viewBox="0 0 24 24"><path d="M12 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z"/><path d="M19.3 13.8a7.9 7.9 0 0 0 .05-1.8l2-1.55-2-3.45-2.5 1a8.35 8.35 0 0 0-1.55-.9L14.9 4h-4l-.4 3.1c-.55.24-1.07.54-1.55.9l-2.5-1-2 3.45 2 1.55a7.9 7.9 0 0 0 .05 1.8l-2 1.55 2 3.45 2.5-1c.48.36 1 .66 1.55.9l.4 3.1h4l.4-3.1c.55-.24 1.07-.54 1.55-.9l2.5 1 2-3.45-2.1-1.55Z"/></svg>`,
  alert: `<svg viewBox="0 0 24 24"><path d="M12 8v5"/><path d="M12 17h.01"/><path d="M10.4 4.8 3.2 17.3A2 2 0 0 0 4.9 20h14.2a2 2 0 0 0 1.7-2.7L13.6 4.8a1.85 1.85 0 0 0-3.2 0Z"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24"><path d="m7 10 5 5 5-5"/></svg>`,
  back: `<svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>`,
  edit: `<svg viewBox="0 0 24 24"><path d="m4 20 4.5-1 9-9a2.12 2.12 0 0 0-3-3l-9 9L4 20Z"/><path d="m13 7 4 4"/></svg>`,
  archive: `<svg viewBox="0 0 24 24"><path d="M4 7.5h16v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-11Z"/><path d="M3 7.5h18V4.75a1.25 1.25 0 0 0-1.25-1.25H4.25A1.25 1.25 0 0 0 3 4.75V7.5Z"/><path d="M10 12h4"/></svg>`,
  restore: `<svg viewBox="0 0 24 24"><path d="M4 12a8 8 0 1 0 2.35-5.65"/><path d="M4 4v4h4"/></svg>`,
  bell: `<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 1 1 12 0c0 6 2 7.5 2 7.5H4S6 15 6 9"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24"><path d="M17 17H7a3 3 0 0 1 0-6h10"/><path d="m14 8 3-3 3 3"/><path d="M7 7h10a3 3 0 1 1 0 6H7"/><path d="m10 16-3 3-3-3"/></svg>`,
  home: `<svg viewBox="0 0 24 24"><path d="m4 10 8-6 8 6"/><path d="M6.5 9.5V20h11V9.5"/><path d="M10 20v-6h4v6"/></svg>`,
  utilities: `<svg viewBox="0 0 24 24"><path d="M13 2 6 13h5l-1 9 8-13h-5l1-7Z"/></svg>`,
  vehicle: `<svg viewBox="0 0 24 24"><path d="M5 16h14l-1.5-5.5A2 2 0 0 0 15.6 9H8.4a2 2 0 0 0-1.9 1.5L5 16Z"/><path d="M7 16v2.5M17 16v2.5M7.5 13h.01M16.5 13h.01"/></svg>`,
  life: `<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 10c0 5.65-7 10-7 10Z"/></svg>`,
  savings: `<svg viewBox="0 0 24 24"><path d="M6 11.5c0-3 2.7-5.5 6-5.5s6 2.5 6 5.5S15.3 17 12 17s-6-2.5-6-5.5Z"/><path d="M12 17v4M8 21h8M12 8.25v6.5M9.5 11.5h5"/></svg>`,
  tax: `<svg viewBox="0 0 24 24"><path d="M7 3.5h10l2 3.5v13.5H5V7l2-3.5Z"/><path d="M8 9h8M8 13h8M8 17h5"/></svg>`,
  phone: `<svg viewBox="0 0 24 24"><path d="M8 3.5h8a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Z"/><path d="M10.5 17.5h3"/></svg>`,
  insurance: `<svg viewBox="0 0 24 24"><path d="M12 3.5 5.5 6v5.5c0 4.25 2.8 7.3 6.5 9 3.7-1.7 6.5-4.75 6.5-9V6L12 3.5Z"/><path d="m9 12 2 2 4-4"/></svg>`,
  transport: `<svg viewBox="0 0 24 24"><path d="M6.5 5.5h11A2.5 2.5 0 0 1 20 8v7.5H4V8a2.5 2.5 0 0 1 2.5-2.5Z"/><path d="M7 18.5h.01M17 18.5h.01M4 11h16"/></svg>`,
  subscriptions: `<svg viewBox="0 0 24 24"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="m10 9.5 5 2.5-5 2.5V9.5Z"/></svg>`,
  wellness: `<svg viewBox="0 0 24 24"><path d="M5 14c4.5 0 7-2.5 7-7 0 4.5 2.5 7 7 7-4.5 0-7 2.5-7 7 0-4.5-2.5-7-7-7Z"/><path d="M5 6h4M15 6h4"/></svg>`,
  loans: `<svg viewBox="0 0 24 24"><path d="M5 8.5h14v10H5z"/><path d="M7 6h10M8 12h8M8 15h5"/></svg>`,
  school: `<svg viewBox="0 0 24 24"><path d="m3.5 8.5 8.5-4 8.5 4-8.5 4-8.5-4Z"/><path d="M6.5 10v4.5c1.7 1.4 3.5 2 5.5 2s3.8-.6 5.5-2V10"/></svg>`,
  medical: `<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/><rect x="4.5" y="4.5" width="15" height="15" rx="3"/></svg>`,
  groceries: `<svg viewBox="0 0 24 24"><path d="M7 8h12l-1.5 11h-10L6 8Z"/><path d="M9 8a3 3 0 0 1 6 0"/><path d="M5 8h2"/></svg>`,
  category: `<svg viewBox="0 0 24 24"><path d="M4.5 5.5h6v6h-6zM13.5 5.5h6v6h-6zM4.5 14.5h6v6h-6zM13.5 14.5h6v6h-6z"/></svg>`
};

function icon(name) {
  return icons[name] || icons.category;
}

const starterCategories = Object.freeze([
  { name: "Home", color: "#c4b5fd", planned: 160000, assigned: 141500 },
  { name: "Utilities", color: "#fed7aa", planned: 36000, assigned: 25370 },
  { name: "Phone & internet", color: "#bae6fd", planned: 22000, assigned: 15000 },
  { name: "Vehicle", color: "#ddd6fe", planned: 28000, assigned: 17100 },
  { name: "Insurance", color: "#fecaca", planned: 50000, assigned: 42000 },
  { name: "Transport", color: "#bbf7d0", planned: 24000, assigned: 22000 },
  { name: "Subscriptions", color: "#f0abfc", planned: 7000, assigned: 3050 },
  { name: "Wellness", color: "#99f6e4", planned: 12000, assigned: 7000 },
  { name: "Loans", color: "#fef08a", planned: 56000, assigned: 37500 },
  { name: "School", color: "#a5f3fc", planned: 30000, assigned: 18000 },
  { name: "Medical", color: "#fed7aa", planned: 16000, assigned: 12000 },
  { name: "Groceries", color: "#d9f99d", planned: 46000, assigned: 42000 },
  { name: "Savings", color: "#6ee7b7", planned: 45000, assigned: 45000 },
  { name: "Tax planning", color: "#e9d5ff", planned: 24000, assigned: 18000 }
]);

function cloneCategory(category) {
  return {
    name: category.name,
    color: category.color,
    planned: category.planned,
    assigned: category.assigned
  };
}

function normalizeActivity(events) {
  if (!Array.isArray(events)) return [];
  return events
    .filter((event) => event && typeof event.type === "string")
    .map((event) => ({ ...event, at: event.at || new Date().toISOString() }));
}

function cloneBill(bill) {
  return {
    ...bill,
    activity: normalizeActivity(bill.activity)
  };
}

function cloneExpense(expense) {
  return {
    ...expense
  };
}

let categories = starterCategories.map(cloneCategory);

const categoryColors = [
  "#c4b5fd",
  "#fed7aa",
  "#bae6fd",
  "#ddd6fe",
  "#fecaca",
  "#bbf7d0",
  "#f0abfc",
  "#99f6e4",
  "#fef08a",
  "#a5f3fc",
  "#fed7aa",
  "#d9f99d",
  "#6ee7b7",
  "#e9d5ff"
];

const presets = [
  { name: "JPS electricity", category: "Utilities", amount: 18500, note: "Monthly electricity bill." },
  { name: "NWC water", category: "Utilities", amount: 6800, note: "Monthly or catch-up water bill." },
  { name: "Rent", category: "Home", amount: 95000, note: "Monthly housing payment." },
  { name: "Mortgage", category: "Home", amount: 135000, note: "Monthly home loan payment." },
  { name: "Property tax", category: "Tax planning", amount: 18000, note: "Due April 1 yearly; full, half-yearly, or quarterly. First payments after April 30 may attract 10% penalty." },
  { name: "Vehicle insurance", category: "Insurance", amount: 42000, note: "Keep current before licensing." },
  { name: "Vehicle fitness", category: "Vehicle", amount: 4500, note: "Validity can vary by vehicle type and age." },
  { name: "Vehicle registration", category: "Vehicle", amount: 12600, note: "Registration depends on valid insurance and fitness; licensing periods can vary." },
  { name: "Internet", category: "Phone & internet", amount: 9500, note: "Monthly home internet." },
  { name: "Phone", category: "Phone & internet", amount: 5500, note: "Mobile plan or top-up." },
  { name: "Taxi / transport", category: "Transport", amount: 22000, note: "Route taxi, bus, rides, fuel, or parking." },
  { name: "Netflix", category: "Subscriptions", amount: 1850, note: "Streaming subscription." },
  { name: "Spotify", category: "Subscriptions", amount: 1200, note: "Music subscription." },
  { name: "Gym / fitness", category: "Wellness", amount: 7000, note: "Membership or classes." },
  { name: "Student loan / SLB", category: "Loans", amount: 14500, note: "Monthly loan payment." },
  { name: "Personal loan", category: "Loans", amount: 23000, note: "Bank or private loan." },
  { name: "Credit union loan", category: "Loans", amount: 18000, note: "Credit union repayment." },
  { name: "School costs", category: "School", amount: 30000, note: "Fees, books, uniforms, lunch money." },
  { name: "Medical", category: "Medical", amount: 12000, note: "Pharmacy, doctor visit, insurance gaps." },
  { name: "Groceries", category: "Groceries", amount: 42000, note: "Weekly food planning." },
  { name: "Savings", category: "Savings", amount: 30000, note: "Pay yourself first." },
  { name: "GCT / tax planning", category: "Tax planning", amount: 15000, note: "For business-related reminders; standard GCT is currently 15% for many taxable items." }
];

const starterBills = Object.freeze([
  { id: 101, name: "Rent", category: "Home", amount: 95000, due: "2026-01-05", paid: true },
  { id: 102, name: "JPS electricity", category: "Utilities", amount: 17200, due: "2026-01-22", paid: true },
  { id: 103, name: "NWC water", category: "Utilities", amount: 6400, due: "2026-01-25", paid: true },
  { id: 104, name: "Internet", category: "Phone & internet", amount: 9500, due: "2026-01-28", paid: true },
  { id: 105, name: "Netflix", category: "Subscriptions", amount: 1850, due: "2026-01-20", paid: true },
  { id: 106, name: "Spotify", category: "Subscriptions", amount: 1200, due: "2026-01-23", paid: true },
  { id: 107, name: "Groceries", category: "Groceries", amount: 41000, due: "2026-01-31", paid: true },
  { id: 108, name: "SLB loan payment", category: "Loans", amount: 14500, due: "2026-01-18", paid: true },
  { id: 109, name: "Taxi / transport", category: "Transport", amount: 21500, due: "2026-01-30", paid: true },
  { id: 110, name: "Rent", category: "Home", amount: 95000, due: "2026-02-05", paid: true },
  { id: 111, name: "JPS electricity", category: "Utilities", amount: 18100, due: "2026-02-22", paid: true },
  { id: 112, name: "NWC water", category: "Utilities", amount: 6700, due: "2026-02-25", paid: true },
  { id: 113, name: "Internet", category: "Phone & internet", amount: 9500, due: "2026-02-28", paid: true },
  { id: 114, name: "Netflix", category: "Subscriptions", amount: 1850, due: "2026-02-20", paid: true },
  { id: 115, name: "Spotify", category: "Subscriptions", amount: 1200, due: "2026-02-23", paid: true },
  { id: 116, name: "Groceries", category: "Groceries", amount: 42500, due: "2026-02-28", paid: true },
  { id: 117, name: "Vehicle insurance", category: "Insurance", amount: 42000, due: "2026-02-09", paid: true },
  { id: 118, name: "SLB loan payment", category: "Loans", amount: 14500, due: "2026-02-18", paid: true },
  { id: 119, name: "Rent", category: "Home", amount: 95000, due: "2026-03-05", paid: true },
  { id: 120, name: "JPS electricity", category: "Utilities", amount: 17950, due: "2026-03-22", paid: true },
  { id: 121, name: "NWC water", category: "Utilities", amount: 6500, due: "2026-03-25", paid: true },
  { id: 122, name: "Internet", category: "Phone & internet", amount: 9500, due: "2026-03-28", paid: true },
  { id: 123, name: "Netflix", category: "Subscriptions", amount: 1850, due: "2026-03-20", paid: true },
  { id: 124, name: "Spotify", category: "Subscriptions", amount: 1200, due: "2026-03-23", paid: true },
  { id: 125, name: "Groceries", category: "Groceries", amount: 43000, due: "2026-03-31", paid: true },
  { id: 126, name: "Medical", category: "Medical", amount: 12000, due: "2026-03-15", paid: true },
  { id: 127, name: "SLB loan payment", category: "Loans", amount: 14500, due: "2026-03-18", paid: true },
  { id: 1, name: "Property tax", category: "Tax planning", amount: 18000, due: "2026-04-01", paid: false },
  { id: 2, name: "Netflix", category: "Subscriptions", amount: 1850, due: "2026-04-20", paid: false },
  { id: 3, name: "JPS electricity", category: "Utilities", amount: 18470, due: "2026-04-22", paid: false },
  { id: 4, name: "Spotify", category: "Subscriptions", amount: 1200, due: "2026-04-23", paid: false },
  { id: 5, name: "NWC water", category: "Utilities", amount: 6900, due: "2026-04-25", paid: false },
  { id: 6, name: "Internet", category: "Phone & internet", amount: 9500, due: "2026-04-28", paid: false },
  { id: 7, name: "Gym / fitness", category: "Wellness", amount: 7000, due: "2026-04-30", paid: false },
  { id: 8, name: "Vehicle insurance", category: "Insurance", amount: 42000, due: "2026-05-09", paid: false },
  { id: 9, name: "Vehicle fitness", category: "Vehicle", amount: 4500, due: "2026-05-12", paid: false },
  { id: 10, name: "Vehicle registration", category: "Vehicle", amount: 12600, due: "2026-05-14", paid: false },
  { id: 11, name: "SLB loan payment", category: "Loans", amount: 14500, due: "2026-04-29", paid: false },
  { id: 12, name: "Rent", category: "Home", amount: 95000, due: "2026-04-05", paid: true }
]);

let bills = starterBills.map(cloneBill);
const starterExpenses = Object.freeze([
  { id: 3001, amount: 8200, category: "Groceries", merchant: "Hi-Lo groceries", note: "Weekly shop", date: "2026-04-18", paymentSource: "Debit card" },
  { id: 3002, amount: 1800, category: "Transport", merchant: "Taxi", note: "Town errands", date: "2026-04-19", paymentSource: "Cash" },
  { id: 3003, amount: 2600, category: "Medical", merchant: "Pharmacy", note: "Prescription refill", date: "2026-04-20", paymentSource: "Debit card" },
  { id: 3004, amount: 4200, category: "Groceries", merchant: "Market run", note: "Produce", date: "2026-04-21", paymentSource: "Cash" },
  { id: 3005, amount: 1500, category: "Wellness", merchant: "Juice bar", note: "Post-gym", date: "2026-04-22", paymentSource: "Debit card" }
]);
let expenses = starterExpenses.map(cloneExpense);
let expenseCategories = starterCategories.map((category) => category.name);
const starterBillIds = new Set(starterBills.map((bill) => bill.id));
const starterCategoryNames = new Set(starterCategories.map((category) => category.name));

const repeatLabels = {
  none: "Does not repeat",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly"
};

const themeColorMeta = document.querySelector("meta[name='theme-color']");
const app = document.querySelector("#app");
const tabbar = document.querySelector("#tabbar");
const tabs = document.querySelectorAll(".tab");
const sheet = document.querySelector("#quickSheet");
const settingsSheet = document.querySelector("#settingsSheet");
const actionSheet = document.querySelector("#actionSheet");
const settingsContent = document.querySelector("#settingsContent");
const actionSheetTitle = document.querySelector("#actionSheetTitle");
const actionSheetContent = document.querySelector("#actionSheetContent");
const expenseSheet = document.querySelector("#expenseSheet");
const expenseForm = document.querySelector("#expenseForm");
const expenseAmount = document.querySelector("#expenseAmount");
const expenseCategory = document.querySelector("#expenseCategory");
const expenseMerchant = document.querySelector("#expenseMerchant");
const expenseDate = document.querySelector("#expenseDate");
const expenseSource = document.querySelector("#expenseSource");
const printExport = document.querySelector("#printExport");
const toastRegion = document.querySelector("#toastRegion");
const backdrop = document.querySelector("#sheetBackdrop");
const billForm = document.querySelector("#billForm");
const presetRail = document.querySelector("#presetRail");
const billName = document.querySelector("#billName");
const billAmount = document.querySelector("#billAmount");
const billDate = document.querySelector("#billDate");
const billCategory = document.querySelector("#billCategory");
const billRepeat = document.querySelector("#billRepeat");
const propertyTaxPlanRow = document.querySelector("#propertyTaxPlanRow");
const propertyTaxPlan = document.querySelector("#propertyTaxPlan");
const billPaid = document.querySelector("#billPaid");
const paidRow = document.querySelector("#paidRow");
const deleteBillButton = document.querySelector("#deleteBill");
const MAX_TOASTS = 3;
const toastTimers = new WeakMap();

let activeTab = "home";
let activeBillId = null;
let editingBillId = null;
let pendingRecurringBillId = null;
let selectedBudgetCategory = categories[0].name;
let selectedHistoryMonth = monthKey(toDateInputValue(today));
let visibleCalendarMonth = monthKey(toDateInputValue(today));
let selectedExpenseCategory = "All";
let selectedCalendarDay = null;
let billFilter = "all";
let billSearch = "";
let billSort = "due";
let lastTrigger = null;
let actionBillId = null;
let settings = {
  initialized: true,
  reminderDays: 3,
  notificationToken: "",
  pushEnabled: false,
  pushEndpoint: "",
  pushStatus: "Ready",
  lastPushSync: "",
  theme: "system",
  cashflow: {
    monthlyStartingBalance: 260000,
    safeSpendBuffer: 20000,
    paymentSources: ["Cash", "Debit card", "Credit card", "Bank transfer"]
  }
};

const money = new Intl.NumberFormat("en-JM", {
  style: "currency",
  currency: "JMD",
  maximumFractionDigits: 0
});

const dateFormat = new Intl.DateTimeFormat("en-JM", {
  month: "short",
  day: "numeric"
});

const longDateFormat = new Intl.DateTimeFormat("en-JM", {
  weekday: "short",
  month: "short",
  day: "numeric"
});

const monthFormat = new Intl.DateTimeFormat("en-JM", {
  month: "long",
  year: "numeric"
});

const timelineFormat = new Intl.DateTimeFormat("en-JM", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit"
});

function parseDate(value) {
  return new Date(`${value}T12:00:00`);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nowIso() {
  return new Date().toISOString();
}

function monthKey(value) {
  return value.slice(0, 7);
}

function monthLabel(key) {
  return monthFormat.format(new Date(`${key}-01T12:00:00`));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "item";
}

function makeSeriesKey(source) {
  return `${slugify(source?.name)}::${slugify(source?.category || "general")}`;
}

function shiftMonth(key, offset) {
  const date = new Date(`${key}-01T12:00:00`);
  date.setMonth(date.getMonth() + offset);
  return toDateInputValue(date).slice(0, 7);
}

function getAvailableMonths() {
  const months = [...new Set([
    ...bills.map((bill) => monthKey(bill.due)),
    ...expenses.map((expense) => monthKey(expense.date))
  ])].sort();
  return months.length ? months : [monthKey(toDateInputValue(today))];
}

function getMonthBills(key) {
  return sortBills(bills.filter((bill) => monthKey(bill.due) === key));
}

function getMonthSummary(key) {
  const items = getMonthBills(key);
  const total = items.reduce((sum, bill) => sum + bill.amount, 0);
  const paid = items.filter((bill) => bill.paid).reduce((sum, bill) => sum + bill.amount, 0);
  const unpaidItems = items.filter((bill) => !bill.paid && !bill.archived);
  const overdueItems = unpaidItems.filter((bill) => daysUntil(bill.due) < 0);
  return { items, total, paid, unpaidItems, overdueItems };
}

function getMonthExpenses(key = monthKey(toDateInputValue(today))) {
  return [...expenses]
    .filter((expense) => monthKey(expense.date) === key)
    .sort((a, b) => parseDate(b.date) - parseDate(a.date) || b.id - a.id);
}

function getExpenseTotal(key = monthKey(toDateInputValue(today)), category = "All") {
  return getMonthExpenses(key)
    .filter((expense) => category === "All" || expense.category === category)
    .reduce((sum, expense) => sum + expense.amount, 0);
}

function getUnpaidBillTotal(key = monthKey(toDateInputValue(today))) {
  return bills
    .filter((bill) => !bill.paid && !bill.archived && monthKey(bill.due) === key)
    .reduce((sum, bill) => sum + bill.amount, 0);
}

function getSafeToSpend(key = monthKey(toDateInputValue(today))) {
  const starting = settings.cashflow?.monthlyStartingBalance || 0;
  const buffer = settings.cashflow?.safeSpendBuffer || 0;
  return starting - getUnpaidBillTotal(key) - getExpenseTotal(key) - buffer;
}

function getRecentExpenses(limit = 5) {
  return [...expenses]
    .sort((a, b) => parseDate(b.date) - parseDate(a.date) || b.id - a.id)
    .slice(0, limit);
}

function expensesByDate(items) {
  return items.reduce((groups, expense) => {
    groups[expense.date] = groups[expense.date] || [];
    groups[expense.date].push(expense);
    return groups;
  }, {});
}

function topExpenseCategories(key = monthKey(toDateInputValue(today)), limit = 4) {
  const totals = getMonthExpenses(key).reduce((map, expense) => {
    map[expense.category] = (map[expense.category] || 0) + expense.amount;
    return map;
  }, {});
  return Object.entries(totals)
    .map(([name, amount]) => ({ name, amount, color: getCategory(name)?.color || "#4d8dff" }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

function getVisibleBills() {
  return sortBills(bills.filter((bill) => !bill.archived && !bill.paid));
}

function getArchivedBills() {
  return [...bills]
    .filter((bill) => bill.archived)
    .sort((a, b) => new Date(b.archivedAt || `${b.due}T12:00:00`) - new Date(a.archivedAt || `${a.due}T12:00:00`));
}

function getPushReminderItems() {
  return sortBills(bills.filter((bill) => {
    if (bill.paid || bill.archived) return false;
    const days = daysUntil(bill.due);
    return days >= 0 && days <= PUSH_REMINDER_DAYS;
  }));
}

function validTheme(value) {
  return ["system", "dark", "light", "pastel"].includes(value) ? value : "system";
}

function resolvedTheme() {
  const theme = validTheme(settings.theme);
  if (theme !== "system") return theme;
  // pastel is an explicit choice, system falls back to dark/light
  const media = window.matchMedia?.("(prefers-color-scheme: light)");
  return media?.matches ? "light" : "dark";
}

function applyTheme() {
  settings.theme = validTheme(settings.theme);
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = settings.theme;
  themeColorMeta?.setAttribute("content", (theme === "light" || theme === "pastel") ? "#fcf8ff" : "#111315");
}

function showToast(message, options = {}) {
  Array.from(toastRegion.children)
    .slice(0, Math.max(0, toastRegion.children.length - MAX_TOASTS + 1))
    .forEach((item) => dismissToast(item));

  const toast = document.createElement("section");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  const body = document.createElement("span");
  body.textContent = message;
  toast.append(body);
  if (typeof options.undo === "function") {
    const undoButton = document.createElement("button");
    undoButton.type = "button";
    undoButton.textContent = options.undoLabel || "Undo";
    undoButton.addEventListener("click", () => {
      options.undo();
      dismissToast(toast);
    });
    toast.append(undoButton);
  }
  toastRegion.append(toast);
  const revealTimer = window.setTimeout(() => toast.classList.add("is-visible"), 20);
  const dismissTimer = window.setTimeout(() => dismissToast(toast), options.duration || 5200);
  toastTimers.set(toast, { revealTimer, dismissTimer });
}

function dismissToast(toast) {
  if (!toast || toast.classList.contains("is-leaving")) return;
  const timers = toastTimers.get(toast);
  if (timers) {
    window.clearTimeout(timers.revealTimer);
    window.clearTimeout(timers.dismissTimer);
    toastTimers.delete(toast);
  }
  toast.classList.remove("is-visible");
  toast.classList.add("is-leaving");
  window.setTimeout(() => toast.remove(), 220);
}

function cleanAmount(value) {
  return Math.max(0, Number(String(value).replace(/[^0-9.]/g, "")) || 0);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function createActivity(type, extra = {}) {
  return {
    type,
    at: extra.at || nowIso(),
    ...extra
  };
}

function appendActivity(bill, type, extra = {}) {
  bill.activity = [...normalizeActivity(bill.activity), createActivity(type, extra)];
}

function inferRepeat(bill) {
  const normalized = `${bill.name} ${bill.category}`.toLowerCase();
  if (normalized.includes("property tax") || normalized.includes("insurance") || normalized.includes("fitness") || normalized.includes("registration")) return "yearly";
  if (normalized.includes("groceries") || normalized.includes("transport")) return "none";
  if (normalized.includes("rent") || normalized.includes("jps") || normalized.includes("nwc") || normalized.includes("internet") || normalized.includes("netflix") || normalized.includes("spotify") || normalized.includes("gym") || normalized.includes("loan") || normalized.includes("slb")) return "monthly";
  return bill.repeat || "none";
}

function isPropertyTaxBill(source) {
  return `${source?.name || ""} ${source?.category || ""}`.toLowerCase().includes("property tax");
}

function advanceDueDate(value, repeat) {
  const next = parseDate(value);
  if (repeat === "monthly") next.setMonth(next.getMonth() + 1);
  if (repeat === "quarterly") next.setMonth(next.getMonth() + 3);
  if (repeat === "yearly") next.setFullYear(next.getFullYear() + 1);
  return toDateInputValue(next);
}

function normalizeBill(bill) {
  const due = bill.due || toDateInputValue(today);
  const paid = Boolean(bill.paid);
  return {
    id: bill.id || Date.now() + Math.floor(Math.random() * 100000),
    name: bill.name || "Untitled bill",
    category: bill.category || categories[0]?.name || "Home",
    amount: cleanAmount(bill.amount),
    due,
    paid,
    repeat: ["none", "monthly", "quarterly", "yearly"].includes(bill.repeat) ? bill.repeat : inferRepeat(bill),
    propertyTaxPlan: ["full", "half-yearly", "quarterly"].includes(bill.propertyTaxPlan) ? bill.propertyTaxPlan : "full",
    seriesKey: bill.seriesKey || makeSeriesKey(bill),
    archived: Boolean(bill.archived),
    archivedAt: bill.archivedAt || null,
    completedAt: paid ? bill.completedAt || `${due}T12:00:00` : null,
    activity: normalizeActivity(bill.activity)
  };
}

function normalizeExpense(expense) {
  const createdAt = expense.createdAt || nowIso();
  return {
    id: expense.id || Date.now() + Math.floor(Math.random() * 100000),
    amount: cleanAmount(expense.amount),
    category: expense.category || defaultCategory().name,
    merchant: expense.merchant || expense.note || "Expense",
    note: expense.note || "",
    date: expense.date || toDateInputValue(today),
    paymentSource: expense.paymentSource || settings.cashflow?.paymentSources?.[0] || "Cash",
    createdAt,
    updatedAt: expense.updatedAt || createdAt
  };
}

function normalizeExpenseCategories(items) {
  const names = [...new Set([...(Array.isArray(items) ? items : []), ...categories.map((category) => category.name)])]
    .filter(Boolean);
  return names.length ? names : ["General"];
}

function normalizeCashflowSettings(source = {}) {
  const sources = Array.isArray(source.paymentSources) && source.paymentSources.length
    ? source.paymentSources
    : ["Cash", "Debit card", "Credit card", "Bank transfer"];
  return {
    monthlyStartingBalance: cleanAmount(source.monthlyStartingBalance ?? 260000),
    safeSpendBuffer: cleanAmount(source.safeSpendBuffer ?? 20000),
    paymentSources: sources
  };
}

function createNextBillFrom(bill) {
  const repeat = bill.repeat || "none";
  if (repeat === "none") return null;
  return normalizeBill({
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: bill.name,
    category: bill.category,
    amount: bill.amount,
    due: advanceDueDate(bill.due, repeat),
    paid: false,
    repeat,
    propertyTaxPlan: bill.propertyTaxPlan || "full",
    seriesKey: bill.seriesKey,
    archived: false,
    archivedAt: null,
    completedAt: null,
    activity: [createActivity("created", { note: "Next bill created from recurrence." })]
  });
}

function isValidState(state) {
  return state &&
    Array.isArray(state.bills) &&
    Array.isArray(state.categories) &&
    state.bills.every((bill) => bill && typeof bill.name === "string" && typeof bill.due === "string") &&
    state.categories.every((category) => category && typeof category.name === "string") &&
    (!state.expenses || Array.isArray(state.expenses));
}

function appState() {
  return {
    version: 3,
    savedAt: new Date().toISOString(),
    bills,
    categories,
    expenses,
    expenseCategories,
    settings,
    selectedBudgetCategory,
    selectedExpenseCategory,
    selectedHistoryMonth,
    visibleCalendarMonth,
    metadata: {
      starterDataLoaded: true
    }
  };
}

function pushSnapshot() {
  // Use settings.reminderDays (user-configurable) as the push window.
  // Falls back to PUSH_REMINDER_DAYS (5) if settings not yet initialised.
  const reminderDays = settings.reminderDays > 0 ? settings.reminderDays : PUSH_REMINDER_DAYS;
  return {
    generatedAt: new Date().toISOString(),
    reminderDays,
    bills: bills
      .filter((bill) => !bill.archived)
      .map((bill) => ({
        id: String(bill.id),
        name: bill.name,
        category: bill.category,
        amount: bill.amount,
        due: bill.due,
        paid: bill.paid,
        repeat: bill.repeat || "none"
      }))
  };
}

function isSupabasePushConfigured() {
  return Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.anonKey && SUPABASE_CONFIG.vapidPublicKey);
}

function isStandaloneApp() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function pushSupportStatus() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "Unsupported on this browser";
  if (!isStandaloneApp()) return "Needs Home Screen install";
  if (Notification.permission === "denied") return "Permission denied";
  if (settings.pushEnabled) return "Notifications enabled";
  if (!isSupabasePushConfigured()) return "Needs Supabase config";
  return "Ready";
}

function base64UrlToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replaceAll("-", "+").replaceAll("_", "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
}

async function callPushFunction(payload) {
  if (!isSupabasePushConfigured()) throw new Error("Add Supabase URL, anon key, and VAPID public key in app.js first.");
  const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/push-subscribe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_CONFIG.anonKey}`,
      apikey: SUPABASE_CONFIG.anonKey
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Notification sync failed.");
  return data;
}

async function syncPushSnapshot() {
  if (!settings.pushEnabled || !settings.notificationToken || !settings.pushEndpoint || !isSupabasePushConfigured()) return;
  await callPushFunction({
    action: "syncSnapshot",
    token: settings.notificationToken,
    endpoint: settings.pushEndpoint,
    snapshot: pushSnapshot()
  });
  settings.lastPushSync = new Date().toISOString();
  settings.pushStatus = "Notifications enabled";
  saveState(false);
}

function saveState(syncPush = true) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState()));
  } catch (error) {
    console.warn("Could not save UpNextBudgeting state", error);
  }
  if (syncPush) {
    syncPushSnapshot().catch((error) => {
      settings.pushStatus = error.message || "Notification sync failed";
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState()));
      } catch (saveError) {
        console.warn("Could not save notification sync status", saveError);
      }
      // Surface the failure so the user knows to re-sync manually.
      showToast("Notification sync failed — open Settings to retry.", { duration: 7000 });
    });
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      bills = bills.map(normalizeBill);
      expenses = expenses.map(normalizeExpense);
      expenseCategories = normalizeExpenseCategories(expenseCategories);
      settings.cashflow = normalizeCashflowSettings(settings.cashflow);
      saveState();
      applyTheme();
      return;
    }
    const state = JSON.parse(raw);
    if (!isValidState(state)) throw new Error("Invalid saved state");
    categories = state.categories.map((category, index) => ({
      name: category.name,
      color: category.color || categoryColors[index % categoryColors.length],
      planned: cleanAmount(category.planned),
      assigned: cleanAmount(category.assigned)
    }));
    bills = state.bills.map(normalizeBill);
    settings = { ...settings, ...(state.settings || {}) };
    settings.theme = validTheme(settings.theme);
    settings.cashflow = normalizeCashflowSettings(settings.cashflow);
    expenses = Array.isArray(state.expenses) ? state.expenses.map(normalizeExpense) : starterExpenses.map(normalizeExpense);
    expenseCategories = normalizeExpenseCategories(state.expenseCategories);
    selectedBudgetCategory = categories.some((category) => category.name === state.selectedBudgetCategory) ? state.selectedBudgetCategory : categories[0]?.name;
    selectedExpenseCategory = expenseCategories.includes(state.selectedExpenseCategory) ? state.selectedExpenseCategory : "All";
    selectedHistoryMonth = state.selectedHistoryMonth || selectedHistoryMonth;
    visibleCalendarMonth = state.visibleCalendarMonth || visibleCalendarMonth;
    ensureCategorySafety();
  } catch (error) {
    console.warn("Could not load saved UpNextBudgeting state", error);
    bills = bills.map(normalizeBill);
    expenses = expenses.map(normalizeExpense);
    settings.cashflow = normalizeCashflowSettings(settings.cashflow);
    ensureCategorySafety();
    saveState();
  }
  applyTheme();
}

function daysUntil(value) {
  const ms = parseDate(value) - today;
  return Math.round(ms / 86400000);
}

function getCategory(name) {
  return categories.find((category) => category.name === name) || categories[0];
}

function defaultCategory() {
  return categories.find((category) => category.name === "Home") || categories[0] || {
    name: "General",
    color: "#4d8dff",
    planned: 0,
    assigned: 0
  };
}

function ensureCategorySafety() {
  if (!categories.length) {
    categories = [{ name: "General", color: "#4d8dff", planned: 0, assigned: 0 }];
  }
  const fallback = defaultCategory().name;
  bills = bills.map((bill) => categories.some((category) => category.name === bill.category) ? bill : { ...bill, category: fallback });
  expenses = expenses.map((expense) => categories.some((category) => category.name === expense.category) ? expense : { ...expense, category: fallback });
  expenseCategories = normalizeExpenseCategories(expenseCategories);
  selectedBudgetCategory = categories.some((category) => category.name === selectedBudgetCategory) ? selectedBudgetCategory : fallback;
  selectedExpenseCategory = selectedExpenseCategory === "All" || expenseCategories.includes(selectedExpenseCategory) ? selectedExpenseCategory : "All";
}

function categoryIconName(name) {
  const normalized = name.toLowerCase();
  if (normalized.includes("home")) return "home";
  if (normalized.includes("util")) return "utilities";
  if (normalized.includes("phone") || normalized.includes("internet")) return "phone";
  if (normalized.includes("vehicle")) return "vehicle";
  if (normalized.includes("insurance")) return "insurance";
  if (normalized.includes("transport")) return "transport";
  if (normalized.includes("subscription")) return "subscriptions";
  if (normalized.includes("wellness")) return "wellness";
  if (normalized.includes("loan")) return "loans";
  if (normalized.includes("school")) return "school";
  if (normalized.includes("medical")) return "medical";
  if (normalized.includes("grocer")) return "groceries";
  if (normalized.includes("saving")) return "savings";
  if (normalized.includes("tax")) return "tax";
  if (normalized.includes("life")) return "life";
  return "category";
}

function sortBills(items) {
  return [...items].sort((a, b) => {
    if (a.archived !== b.archived) return a.archived ? 1 : -1;
    if (a.paid !== b.paid) return a.paid ? 1 : -1;
    const aOverdue = !a.paid && daysUntil(a.due) < 0;
    const bOverdue = !b.paid && daysUntil(b.due) < 0;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    return parseDate(a.due) - parseDate(b.due);
  });
}

function statusText(bill) {
  if (bill.paid) return "Paid";
  const days = daysUntil(bill.due);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

function recordStatusText(bill) {
  if (bill.archived && !bill.paid) return "Archived";
  return statusText(bill);
}

function statusClass(bill) {
  if (bill.archived && !bill.paid) return "is-archived";
  if (bill.paid) return "is-paid";
  const days = daysUntil(bill.due);
  if (days < 0) return "is-overdue";
  if (days <= 1) return "is-tomorrow";
  if (days <= settings.reminderDays) return "is-soon";
  return "is-scheduled";
}

function statusTone(bill) {
  const state = statusClass(bill);
  if (state === "is-overdue") return "danger";
  if (state === "is-tomorrow" || state === "is-soon") return "warning";
  if (state === "is-paid") return "success";
  if (state === "is-archived") return "neutral";
  return "info";
}

function monthName(date = today) {
  return new Intl.DateTimeFormat("en-JM", { month: "long", year: "numeric" }).format(date);
}

function replaceOrInsertBill(record) {
  const normalized = normalizeBill(record);
  const index = bills.findIndex((bill) => bill.id === normalized.id);
  if (index >= 0) {
    bills[index] = normalized;
  } else {
    bills.push(normalized);
  }
}

function getBillById(billId) {
  return bills.find((bill) => bill.id === billId);
}

function openBillDetail(billId) {
  const bill = getBillById(billId);
  if (!bill) return;
  lastTrigger = document.activeElement;
  activeBillId = billId;
  render();
}

function closeBillDetail(restoreFocus = true) {
  activeBillId = null;
  render();
  if (restoreFocus) {
    window.setTimeout(() => lastTrigger?.focus?.(), 0);
  }
}

function markBillPaid(billId, { quiet = false } = {}) {
  const bill = getBillById(billId);
  if (!bill || bill.paid) return;
  const snapshot = cloneBill(bill);
  const previousPending = pendingRecurringBillId;
  bill.paid = true;
  bill.completedAt = nowIso();
  appendActivity(bill, "paid", { note: "Marked paid from the app." });
  pendingRecurringBillId = bill.repeat && bill.repeat !== "none" ? bill.id : null;
  saveState();
  render();
  if (!quiet) {
    showToast(`${bill.name} marked paid.`, {
      undo: () => {
        replaceOrInsertBill(snapshot);
        pendingRecurringBillId = previousPending;
        saveState();
        render();
        showToast(`${bill.name} marked unpaid.`);
      }
    });
  }
}

function archiveBill(billId) {
  const bill = getBillById(billId);
  if (!bill || bill.archived) return;
  const snapshot = cloneBill(bill);
  bill.archived = true;
  bill.archivedAt = nowIso();
  appendActivity(bill, "archived", { note: "Archived from bill detail." });
  if (activeBillId === billId) activeBillId = null;
  if (pendingRecurringBillId === billId) pendingRecurringBillId = null;
  saveState();
  render();
  if (!settingsSheet.hidden) renderSettingsContent();
  showToast(`${bill.name} archived.`, {
    undo: () => {
      replaceOrInsertBill(snapshot);
      saveState();
      render();
      if (!settingsSheet.hidden) renderSettingsContent();
      showToast(`${bill.name} restored.`);
    }
  });
}

function restoreArchivedBill(billId) {
  const bill = getBillById(billId);
  if (!bill || !bill.archived) return;
  const snapshot = cloneBill(bill);
  bill.archived = false;
  bill.archivedAt = null;
  appendActivity(bill, "restored", { note: "Restored from archive." });
  saveState();
  render();
  if (!settingsSheet.hidden) renderSettingsContent();
  showToast(`${bill.name} restored.`, {
    undo: () => {
      replaceOrInsertBill(snapshot);
      saveState();
      render();
      if (!settingsSheet.hidden) renderSettingsContent();
      showToast(`${bill.name} archived again.`);
    }
  });
}

function snoozeBill(billId, nextDue) {
  const bill = getBillById(billId);
  if (!bill || bill.paid || bill.archived || !nextDue || nextDue === bill.due) return;
  const snapshot = cloneBill(bill);
  const previousDue = bill.due;
  bill.due = nextDue;
  appendActivity(bill, "snoozed", {
    from: previousDue,
    to: nextDue,
    note: `Snoozed from ${dateFormat.format(parseDate(previousDue))} to ${dateFormat.format(parseDate(nextDue))}.`
  });
  saveState();
  closeActionSheet(false);
  render();
  showToast(`${bill.name} moved to ${dateFormat.format(parseDate(nextDue))}.`, {
    undo: () => {
      replaceOrInsertBill(snapshot);
      saveState();
      render();
      showToast(`${bill.name} due date restored.`);
    }
  });
}

function createNextRecurringBill() {
  const bill = getBillById(pendingRecurringBillId);
  const nextBill = bill ? createNextBillFrom(bill) : null;
  if (nextBill) bills.push(nextBill);
  pendingRecurringBillId = null;
  saveState();
  render();
  if (nextBill) {
    showToast(`Next ${nextBill.name} created.`, {
      undo: () => {
        bills = bills.filter((item) => item.id !== nextBill.id);
        saveState();
        render();
        showToast("Next bill removed.");
      }
    });
  }
}

function dismissRecurringPrompt() {
  pendingRecurringBillId = null;
  saveState();
  render();
  showToast("Recurring prompt skipped.");
}

function getRelatedBills(seriesKey) {
  return [...bills]
    .filter((bill) => bill.seriesKey === seriesKey)
    .sort((a, b) => parseDate(b.due) - parseDate(a.due));
}

function activityToTimelineEntry(item, event) {
  if (event.type === "created") {
    return {
      at: event.at,
      tone: "info",
      title: "Bill created",
      detail: event.note || `${item.name} was added to your plan.`
    };
  }
  if (event.type === "edited") {
    return {
      at: event.at,
      tone: "info",
      title: "Bill updated",
      detail: event.note || `${item.name} details were changed.`
    };
  }
  if (event.type === "paid") {
    return {
      at: event.at,
      tone: "success",
      title: "Marked paid",
      detail: `${money.format(item.amount)} cleared.`
    };
  }
  if (event.type === "unpaid") {
    return {
      at: event.at,
      tone: "warning",
      title: "Marked unpaid",
      detail: "Returned to active planning."
    };
  }
  if (event.type === "snoozed") {
    return {
      at: event.at,
      tone: "warning",
      title: "Due date moved",
      detail: `${dateFormat.format(parseDate(event.from))} to ${dateFormat.format(parseDate(event.to))}`
    };
  }
  if (event.type === "archived") {
    return {
      at: event.at,
      tone: "neutral",
      title: "Archived",
      detail: "Removed from daily triage."
    };
  }
  if (event.type === "restored") {
    return {
      at: event.at,
      tone: "info",
      title: "Restored",
      detail: "Returned to active planning."
    };
  }
  return {
    at: event.at,
    tone: "info",
    title: event.type,
    detail: event.note || item.name
  };
}

function getBillTimeline(bill) {
  const entries = [];
  getRelatedBills(bill.seriesKey).forEach((item) => {
    entries.push({
      at: `${item.due}T12:00:00`,
      tone: "info",
      title: "Scheduled",
      detail: `${dateFormat.format(parseDate(item.due))} · ${money.format(item.amount)}`
    });
    const activityTypes = new Set(normalizeActivity(item.activity).map((event) => event.type));
    if (item.paid && !activityTypes.has("paid")) {
      entries.push({
        at: item.completedAt || `${item.due}T12:00:00`,
        tone: "success",
        title: "Marked paid",
        detail: `${money.format(item.amount)} cleared.`
      });
    }
    if (item.archived && !activityTypes.has("archived")) {
      entries.push({
        at: item.archivedAt || `${item.due}T12:00:00`,
        tone: "neutral",
        title: "Archived",
        detail: "Removed from daily triage."
      });
    }
    normalizeActivity(item.activity).forEach((event) => {
      entries.push(activityToTimelineEntry(item, event));
    });
  });
  return entries.sort((a, b) => new Date(b.at) - new Date(a.at));
}

function renderRecurringPrompt() {
  const bill = getBillById(pendingRecurringBillId);
  if (!bill) return "";
  return `
    <section class="recurring-prompt home-reveal" style="--delay: 160ms" aria-label="Recurring bill follow-up">
      <div>
        <p class="mini-label">Repeats ${bill.repeat}</p>
        <strong>Create next ${bill.name}?</strong>
        <p class="small-note">Next due date would be ${dateFormat.format(parseDate(advanceDueDate(bill.due, bill.repeat)))}.</p>
      </div>
      <div class="prompt-actions">
        <button class="primary-action small" id="createNextBill" type="button">Create next</button>
        <button class="secondary-action" id="dismissRecurring" type="button">Skip</button>
      </div>
    </section>
  `;
}

function renderWalletCard(bill, index) {
  const category = getCategory(bill.category);
  return `
    <article class="wallet-card home-reveal ${statusClass(bill)}" style="--stack-index:${index}; --accent:${category.color}; --delay:${Math.min(70 + index * 35, 320)}ms" data-open-bill="${bill.id}" tabindex="0" role="button" aria-label="Open ${bill.name}">
      <div class="wallet-card-top">
        <div class="wallet-title">
          <p class="eyebrow">${bill.category}</p>
          <h3>${bill.name}</h3>
        </div>
        <span class="state-pill ${statusClass(bill)}">${recordStatusText(bill)}</span>
      </div>
      <p class="wallet-amount">${money.format(bill.amount)}</p>
      <div class="wallet-inline-meta">
        <div>
          <p class="mini-label">Due</p>
          <strong>${dateFormat.format(parseDate(bill.due))}</strong>
        </div>
        <div>
          <p class="mini-label">Repeat</p>
          <strong>${repeatLabels[bill.repeat] || repeatLabels.none}</strong>
        </div>
      </div>
      <div class="wallet-card-bottom">
        <p class="small-note">${statusText(bill)}</p>
        <button class="mark-button" data-paid="${bill.id}" type="button">Mark paid</button>
      </div>
    </article>
  `;
}

function renderTopAppBar({ kicker, title, subtitle = "" }) {
  return `
    <header class="topbar app-topbar home-reveal" style="--delay: 0ms">
      <div class="brand-line">
        <img class="brandmark" src="assets/icon.svg" alt="">
        <div class="hero-copy">
          <p class="kicker">${kicker}</p>
          <h1>${title}</h1>
          ${subtitle ? `<p class="hero-note">${subtitle}</p>` : ""}
        </div>
      </div>
      <div class="top-actions">
        <button class="icon-button light" data-toggle-theme type="button" aria-label="Toggle theme">${icon("wellness")}</button>
        <button class="icon-button light" data-open-settings type="button" aria-label="Open settings">${icon("gear")}</button>
      </div>
    </header>
  `;
}

function renderKpiCard(label, value, detail = "", tone = "") {
  return `
    <article class="kpi-card ${tone}">
      <span>${label}</span>
      <strong>${value}</strong>
      ${detail ? `<small>${detail}</small>` : ""}
    </article>
  `;
}

function renderExpenseRow(expense) {
  const category = getCategory(expense.category);
  return `
    <article class="expense-row" style="--accent:${category.color}">
      <span class="expense-dot" aria-hidden="true"></span>
      <div>
        <strong>${expense.merchant}</strong>
        <span>${expense.category} · ${dateFormat.format(parseDate(expense.date))}${expense.paymentSource ? ` · ${expense.paymentSource}` : ""}</span>
      </div>
      <strong>${money.format(expense.amount)}</strong>
      <button class="text-action danger-text" data-delete-expense="${expense.id}" type="button">Remove</button>
    </article>
  `;
}

function renderBillListCard(bill, index = 0) {
  const category = getCategory(bill.category);
  return `
    <article class="bill-list-card home-reveal ${statusClass(bill)}" style="--accent:${category.color}; --delay:${Math.min(40 + index * 24, 260)}ms">
      <button class="bill-card-main" data-open-bill="${bill.id}" type="button" aria-label="Open ${bill.name}">
        <span class="budget-row-icon">${icon(categoryIconName(bill.category))}</span>
        <span class="budget-row-copy">
          <strong>${bill.name}</strong>
          <small>${bill.category} · ${repeatLabels[bill.repeat] || repeatLabels.none}</small>
        </span>
        <span class="bill-card-amount">${money.format(bill.amount)}</span>
      </button>
      <div class="bill-card-meta">
        <span class="state-pill ${statusClass(bill)}">${recordStatusText(bill)}</span>
        <span>${longDateFormat.format(parseDate(bill.due))}</span>
      </div>
      <div class="bill-card-actions">
        <button class="mark-button" data-paid="${bill.id}" type="button" ${bill.paid || bill.archived ? "disabled" : ""}>${bill.paid ? "Paid" : "Mark paid"}</button>
        <button class="secondary-action" data-edit-bill="${bill.id}" type="button">Edit</button>
        <button class="secondary-action" data-snooze-bill="${bill.id}" type="button" ${bill.paid || bill.archived ? "disabled" : ""}>Snooze</button>
      </div>
    </article>
  `;
}

function renderHome() {
  const unpaid = getVisibleBills();
  const overdueCount = unpaid.filter((bill) => daysUntil(bill.due) < 0).length;
  const dueSevenCount = unpaid.filter((bill) => daysUntil(bill.due) >= 0 && daysUntil(bill.due) <= 7).length;
  const dueThisMonth = unpaid.filter((bill) => monthKey(bill.due) === monthKey(toDateInputValue(today))).length;
  const currentMonth = monthKey(toDateInputValue(today));
  const spent = getExpenseTotal(currentMonth);
  const safe = getSafeToSpend(currentMonth);
  const recentExpenses = getRecentExpenses(4);
  const propertyTax = unpaid.find((bill) => bill.name.toLowerCase().includes("property tax"));

  app.innerHTML = `
    ${renderTopAppBar({ kicker: monthName(), title: "Welcome back, Marshall." })}

    <section class="quick-actions home-reveal" style="--delay: 20ms" aria-label="Quick actions">
      <button class="primary-action" data-open-bill-sheet type="button">${icon("plus")} Add bill</button>
      <button class="secondary-action" data-open-expense-sheet type="button">${icon("groceries")} Add expense</button>
    </section>

    <section class="kpi-grid home-reveal" style="--delay: 40ms" aria-label="Monthly cashflow summary">
      ${renderKpiCard("Overdue", overdueCount, "bills need action", overdueCount ? "is-alert" : "")}
      ${renderKpiCard("Due in 7 days", dueSevenCount, `${dueThisMonth} this month`)}
      ${renderKpiCard("Spent", money.format(spent), monthName())}
      ${renderKpiCard("Safe to spend", money.format(safe), `${money.format(settings.cashflow.safeSpendBuffer)} buffer`, safe < 0 ? "is-alert" : "is-safe")}
    </section>

    <section class="cashflow-card home-reveal" style="--delay: 70ms">
      <div>
        <p class="mini-label">Projected after bills</p>
        <h2>${money.format((settings.cashflow.monthlyStartingBalance || 0) - getUnpaidBillTotal(currentMonth) - spent)}</h2>
        <p class="small-note">Starting balance minus open bills and recorded expenses.</p>
      </div>
      <span class="state-pill ${safe < 0 ? "is-overdue" : "is-paid"}">${safe < 0 ? "tight" : "steady"}</span>
    </section>

    <section class="section-block">
      <div class="section-heading home-reveal" style="--delay: 90ms">
        <h2>Needs attention</h2>
        <span class="mini-label">${unpaid.length} open</span>
      </div>
      ${propertyTax ? `<article class="property-note home-reveal" style="--delay: 105ms"><strong>Property tax stays visible</strong><span>Due April 1 yearly in Jamaica. April 30 remains the first-payment warning date.</span></article>` : ""}
      <div class="wallet-stack" aria-label="Upcoming bills">
      ${unpaid.length ? unpaid.map((bill, index) => renderWalletCard(bill, index)).join("") : `
        <article class="empty-panel home-reveal" style="--delay: 70ms">
          <p class="mini-label">Clear</p>
          <h2>You are caught up.</h2>
          <p class="small-note">Add a bill to keep your next due date visible.</p>
        </article>
      `}
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading home-reveal" style="--delay: 140ms">
        <h2>Recent expenses</h2>
        <button class="text-action" data-open-expense-sheet type="button">Add expense</button>
      </div>
      <div class="expense-list compact">
        ${recentExpenses.length ? recentExpenses.map(renderExpenseRow).join("") : `<article class="empty-panel"><p class="mini-label">No expenses</p><h2>Track day-to-day spending here.</h2><p class="small-note">Fast capture keeps cashflow honest without turning this into accounting.</p></article>`}
      </div>
    </section>

    ${renderRecurringPrompt()}
  `;

  bindScreenActions();
  document.querySelector("#createNextBill")?.addEventListener("click", createNextRecurringBill);
  document.querySelector("#dismissRecurring")?.addEventListener("click", dismissRecurringPrompt);
  bindPaidButtons();
  bindBillOpenButtons();
  bindExpenseActions();
}

function renderUpcoming() {
  renderHome();
}

function renderTimelineItem(entry) {
  return `
    <article class="timeline-item ${entry.tone}">
      <span class="timeline-dot" aria-hidden="true"></span>
      <div>
        <strong>${entry.title}</strong>
        <p>${entry.detail}</p>
      </div>
      <time>${timelineFormat.format(new Date(entry.at))}</time>
    </article>
  `;
}

function renderBillDetail() {
  const bill = getBillById(activeBillId);
  if (!bill) {
    activeBillId = null;
    render();
    return;
  }
  const category = getCategory(bill.category);
  const timeline = getBillTimeline(bill).slice(0, 12);
  const isPropertyTax = isPropertyTaxBill(bill);

  app.innerHTML = `
    <section class="detail-screen">
      <header class="topbar detail-topbar home-reveal" style="--delay: 0ms">
        <button class="icon-button light" id="closeDetail" type="button" aria-label="Back to bills">${icon("back")}</button>
        <div class="detail-topbar-copy">
          <p class="kicker">${bill.category}</p>
          <h1>${bill.name}</h1>
        </div>
        <button class="icon-button light" id="detailEdit" type="button" aria-label="Edit bill">${icon("edit")}</button>
      </header>

      <section class="detail-hero home-reveal ${statusClass(bill)}" style="--accent:${category.color}; --delay: 30ms">
        <div class="detail-hero-head">
          <span class="state-pill ${statusClass(bill)}">${recordStatusText(bill)}</span>
          <span class="mini-label">${bill.archived ? "Archived" : "Active bill"}</span>
        </div>
        <p class="detail-amount">${money.format(bill.amount)}</p>
        <div class="detail-inline-meta">
          <div>
            <span>Due date</span>
            <strong>${longDateFormat.format(parseDate(bill.due))}</strong>
          </div>
          <div>
            <span>Repeat</span>
            <strong>${repeatLabels[bill.repeat] || repeatLabels.none}</strong>
          </div>
        </div>
      </section>

      <section class="detail-actions home-reveal" style="--delay: 70ms">
        <button class="primary-action" id="detailMarkPaid" type="button" ${bill.paid ? "disabled" : ""}>${bill.paid ? "Paid" : "Mark paid"}</button>
        <button class="secondary-action" id="detailSnooze" type="button" ${bill.paid || bill.archived ? "disabled" : ""}>Snooze</button>
        <button class="secondary-action" id="detailArchive" type="button" ${bill.archived ? "disabled" : ""}>Archive</button>
      </section>

      ${pendingRecurringBillId === bill.id ? renderRecurringPrompt() : ""}

      <section class="detail-grid home-reveal" style="--delay: 110ms">
        <article class="info-card">
          <div class="info-card-head">
            <span class="card-icon">${icon("repeat")}</span>
            <h3>Schedule</h3>
          </div>
          <p class="small-note">Category</p>
          <strong>${bill.category}</strong>
          <p class="small-note detail-copy">${statusText(bill)}${bill.completedAt ? ` · paid ${timelineFormat.format(new Date(bill.completedAt))}` : ""}</p>
        </article>
        <article class="info-card">
          <div class="info-card-head">
            <span class="card-icon">${icon("bell")}</span>
            <h3>Reminders</h3>
          </div>
          <p class="small-note">In-app window</p>
          <strong>${settings.reminderDays} day${settings.reminderDays === 1 ? "" : "s"}</strong>
          <p class="small-note detail-copy">${pushSupportStatus()}</p>
        </article>
      </section>

      ${isPropertyTax ? `
        <section class="property-note detail-note home-reveal" style="--delay: 130ms">
          <strong>Jamaica property tax planning</strong>
          <span>Due April 1 yearly. Current plan: ${bill.propertyTaxPlan === "half-yearly" ? "half-yearly" : bill.propertyTaxPlan}. Keep April 30 visible as the first-payment warning date.</span>
        </section>
      ` : ""}

      <section class="detail-section home-reveal" style="--delay: 150ms">
        <div class="section-heading">
          <h2>Timeline</h2>
          <span class="mini-label">${getRelatedBills(bill.seriesKey).length} entries</span>
        </div>
        <div class="timeline-list">
          ${timeline.map(renderTimelineItem).join("")}
        </div>
      </section>
    </section>
  `;

  document.querySelector("#closeDetail").addEventListener("click", () => closeBillDetail());
  document.querySelector("#detailEdit").addEventListener("click", () => openSheet(bill.id));
  document.querySelector("#detailMarkPaid").addEventListener("click", () => markBillPaid(bill.id));
  document.querySelector("#detailSnooze").addEventListener("click", () => openSnoozeSheet(bill.id));
  document.querySelector("#detailArchive").addEventListener("click", () => archiveBill(bill.id));
  document.querySelector("#createNextBill")?.addEventListener("click", createNextRecurringBill);
  document.querySelector("#dismissRecurring")?.addEventListener("click", dismissRecurringPrompt);
}

function polarPoint(cx, cy, r, angle) {
  const radians = (angle - 90) * (Math.PI / 180);
  return {
    x: cx + r * Math.cos(radians),
    y: cy + r * Math.sin(radians)
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const span = Math.max(0.01, Math.min(359.99, endAngle - startAngle));
  const start = polarPoint(cx, cy, r, endAngle);
  const end = polarPoint(cx, cy, r, startAngle);
  const largeArcFlag = span <= 180 ? 0 : 1;
  return `M ${start.x.toFixed(3)} ${start.y.toFixed(3)} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x.toFixed(3)} ${end.y.toFixed(3)}`;
}

function escapeAttribute(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderBudgetChart() {
  const totalPlanned = categories.reduce((sum, category) => sum + category.planned, 0);
  const totalAssigned = categories.reduce((sum, category) => sum + category.assigned, 0);
  const focus = getCategory(selectedBudgetCategory);
  const focusAssigned = focus?.assigned || 0;
  const focusPlanned = focus?.planned || 0;
  const centerLabel = focus ? focus.name : "All categories";
  const centerAssigned = focus ? focusAssigned : totalAssigned;
  const centerPlanned = focus ? focusPlanned : totalPlanned;
  const centerPercent = centerPlanned ? Math.round((centerAssigned / centerPlanned) * 100) : 0;

  let cursor = -90;
  const paths = categories
    .filter((category) => category.planned > 0)
    .map((category) => {
      const span = totalPlanned ? (category.planned / totalPlanned) * 360 : 0;
      const gap = categories.length > 1 ? 2.4 : 0;
      const start = cursor + gap / 2;
      const end = cursor + span - gap / 2;
      cursor += span;
      if (end <= start) return "";
      const assignedEnd = start + (end - start) * Math.min(1, category.planned ? category.assigned / category.planned : 0);
      const focused = category.name === selectedBudgetCategory;
      const encodedName = encodeURIComponent(category.name);
      return `
        <g class="chart-segment ${focused ? "is-focused" : ""}" data-chart-category="${encodedName}" tabindex="0" focusable="true" role="button" aria-label="Show ${escapeAttribute(category.name)} budget details" style="--accent:${category.color}">
          <path class="chart-segment-track" d="${describeArc(120, 120, 82, start, end)}"></path>
          ${category.assigned ? `<path class="chart-segment-fill" d="${describeArc(120, 120, 82, start, assignedEnd)}"></path>` : ""}
        </g>
      `;
    })
    .join("");
  const focusColor = focus?.color || "var(--info)";

  return `
    <section class="chart-panel home-reveal" style="--delay: 40ms">
      <div class="chart-wrap" aria-label="Budget overview chart">
        <svg viewBox="0 0 240 240" class="budget-chart" role="img" aria-label="Assigned versus planned budget chart">
          <circle cx="120" cy="120" r="82" class="chart-ring"></circle>
          ${paths}
        </svg>
        <div class="chart-center">
          <span><i class="chart-center-swatch" style="--accent:${focusColor}" aria-hidden="true"></i>${centerLabel}</span>
          <strong>${money.format(centerAssigned)}</strong>
          <small>${centerPercent}% of ${money.format(centerPlanned || 0)}</small>
        </div>
      </div>
    </section>
  `;
}

function renderBudgetRow(category, index) {
  const percent = category.planned ? Math.min(100, Math.round((category.assigned / category.planned) * 100)) : 0;
  const glyph = categoryIconName(category.name);
  const isFocused = category.name === selectedBudgetCategory;
  const encodedName = encodeURIComponent(category.name);
  return `
    <button class="budget-row home-reveal ${isFocused ? "is-focused" : ""}" style="--accent:${category.color}; --delay:${90 + index * 28}ms" data-focus-category="${encodedName}" type="button" aria-label="${escapeAttribute(isFocused ? `Adjust ${category.name}` : `Focus ${category.name}`)}">
      <span class="budget-row-icon">${icon(glyph)}</span>
      <span class="budget-row-copy">
        <strong>${category.name}</strong>
        <small>${money.format(category.assigned)} assigned of ${money.format(category.planned)}</small>
      </span>
      <span class="budget-row-side">
        <span class="budget-row-meta">${percent}%</span>
        ${isFocused ? `<span class="budget-row-hint">Adjust</span>` : ""}
      </span>
    </button>
  `;
}

function renderBudget() {
  const totalAssigned = categories.reduce((sum, category) => sum + category.assigned, 0);
  const totalPlanned = categories.reduce((sum, category) => sum + category.planned, 0);
  const totalPercent = totalPlanned ? Math.round((totalAssigned / totalPlanned) * 100) : 0;

  app.innerHTML = `
    <header class="topbar home-reveal" style="--delay: 0ms">
      <div class="brand-line">
        <img class="brandmark" src="assets/icon.svg" alt="">
        <div class="hero-copy">
          <p class="kicker">Budget awareness</p>
          <h1>Budget</h1>
          <p class="hero-note">A graphic view of what is assigned against the plan.</p>
        </div>
      </div>
      <div class="top-actions">
        <button class="icon-button light" id="openSettings" type="button" aria-label="Open settings">${icon("gear")}</button>
        <button class="icon-button light" id="openSheet" type="button" aria-label="Add a bill">${icon("plus")}</button>
      </div>
    </header>

    <section class="budget-summary home-reveal" style="--delay: 20ms">
      <div>
        <span>Assigned this cycle</span>
        <strong>${money.format(totalAssigned)}</strong>
      </div>
      <div>
        <span>Planned total</span>
        <strong>${money.format(totalPlanned)}</strong>
      </div>
      <div>
        <span>Coverage</span>
        <strong>${totalPercent}%</strong>
      </div>
    </section>

    ${renderBudgetChart()}

    <section class="budget-legend">
      <div class="section-heading home-reveal" style="--delay: 70ms">
        <h2>Categories</h2>
        <span class="mini-label">Tap again to adjust</span>
      </div>
      <div class="budget-list">
        ${categories.map((category, index) => renderBudgetRow(category, index)).join("")}
      </div>
    </section>
  `;

  document.querySelector("#openSheet").addEventListener("click", () => openSheet());
  document.querySelector("#openSettings").addEventListener("click", openSettingsSheet);
  bindBudgetCategorySelection();
}

function decodeCategoryDataset(value) {
  try {
    return decodeURIComponent(value || "");
  } catch {
    return value || "";
  }
}

function focusBudgetCategory(categoryName, options = {}) {
  const category = getCategory(categoryName);
  if (!category) return;
  if (options.openIfFocused && selectedBudgetCategory === category.name) {
    openBudgetCategorySheet(category.name);
    return;
  }
  selectedBudgetCategory = category.name;
  saveState(false);
  render();
}

function bindBudgetCategorySelection() {
  document.querySelectorAll("[data-focus-category]").forEach((button) => {
    button.addEventListener("click", () => {
      focusBudgetCategory(decodeCategoryDataset(button.dataset.focusCategory), { openIfFocused: true });
    });
  });
  document.querySelectorAll("[data-chart-category]").forEach((segment) => {
    const categoryName = decodeCategoryDataset(segment.dataset.chartCategory);
    segment.addEventListener("click", () => {
      focusBudgetCategory(categoryName);
    });
    segment.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      event.preventDefault();
      focusBudgetCategory(categoryName);
    });
  });
}

function filteredBills() {
  const search = billSearch.trim().toLowerCase();
  const filtered = bills.filter((bill) => {
    if (billFilter === "overdue" && !(daysUntil(bill.due) < 0 && !bill.paid && !bill.archived)) return false;
    if (billFilter === "due-soon" && !(daysUntil(bill.due) >= 0 && daysUntil(bill.due) <= settings.reminderDays && !bill.paid && !bill.archived)) return false;
    if (billFilter === "paid" && !bill.paid) return false;
    if (billFilter === "recurring" && (!bill.repeat || bill.repeat === "none")) return false;
    if (!search) return true;
    return `${bill.name} ${bill.category}`.toLowerCase().includes(search);
  });
  if (billSort === "amount") return filtered.sort((a, b) => b.amount - a.amount);
  if (billSort === "name") return filtered.sort((a, b) => a.name.localeCompare(b.name));
  return sortBills(filtered);
}

function renderBills() {
  const filters = [
    ["all", "All"],
    ["overdue", "Overdue"],
    ["due-soon", "Due soon"],
    ["paid", "Paid"],
    ["recurring", "Recurring"]
  ];
  const items = filteredBills();
  app.innerHTML = `
    ${renderTopAppBar({ kicker: "Bill workspace", title: "Bills" })}
    <section class="screen-controls home-reveal" style="--delay: 20ms">
      <div class="chip-row" aria-label="Bill filters">
        ${filters.map(([value, label]) => `<button class="filter-chip ${billFilter === value ? "is-active" : ""}" data-bill-filter="${value}" type="button">${label}</button>`).join("")}
      </div>
      <label class="search-box">
        <span class="mini-label">Search</span>
        <input id="billSearch" value="${escapeAttribute(billSearch)}" placeholder="JPS, rent, tax...">
      </label>
      <label class="search-box">
        <span class="mini-label">Sort</span>
        <select id="billSort">
          <option value="due" ${billSort === "due" ? "selected" : ""}>Due date</option>
          <option value="amount" ${billSort === "amount" ? "selected" : ""}>Amount</option>
          <option value="name" ${billSort === "name" ? "selected" : ""}>Name</option>
        </select>
      </label>
    </section>
    <section class="bill-list">
      ${items.length ? items.map(renderBillListCard).join("") : `<article class="empty-panel"><p class="mini-label">No matches</p><h2>No bills found.</h2><p class="small-note">Adjust filters or add a new bill.</p></article>`}
    </section>
  `;
  bindScreenActions();
  document.querySelectorAll("[data-bill-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      billFilter = button.dataset.billFilter;
      render();
    });
  });
  document.querySelector("#billSearch").addEventListener("input", (event) => {
    billSearch = event.target.value;
    renderBills();
  });
  document.querySelector("#billSort").addEventListener("change", (event) => {
    billSort = event.target.value;
    render();
  });
  bindPaidButtons();
  bindBillOpenButtons();
  bindBillSecondaryActions();
}

function renderExpenseCategoryChips() {
  return ["All", ...expenseCategories].map((category) => `
    <button class="filter-chip ${selectedExpenseCategory === category ? "is-active" : ""}" data-expense-filter="${encodeURIComponent(category)}" type="button">${category}</button>
  `).join("");
}

function renderExpenses() {
  const currentMonth = monthKey(toDateInputValue(today));
  const monthExpenses = getMonthExpenses(currentMonth)
    .filter((expense) => selectedExpenseCategory === "All" || expense.category === selectedExpenseCategory);
  const grouped = expensesByDate(monthExpenses);
  const total = getExpenseTotal(currentMonth, selectedExpenseCategory);
  const topCategories = topExpenseCategories(currentMonth, 3);
  app.innerHTML = `
    ${renderTopAppBar({ kicker: "Variable spending", title: "Expenses" })}
    <section class="quick-actions home-reveal" style="--delay: 20ms">
      <button class="primary-action" data-open-expense-sheet type="button">${icon("plus")} Add expense</button>
      <button class="secondary-action" data-open-bill-sheet type="button">${icon("tax")} Add bill</button>
    </section>
    <section class="expense-summary-grid home-reveal" style="--delay: 40ms">
      ${renderKpiCard("Spent this month", money.format(total), selectedExpenseCategory)}
      ${renderKpiCard("Transactions", monthExpenses.length, "recorded")}
      ${renderKpiCard("Safe to spend", money.format(getSafeToSpend(currentMonth)), "after bills and buffer", getSafeToSpend(currentMonth) < 0 ? "is-alert" : "is-safe")}
    </section>
    <section class="screen-controls home-reveal" style="--delay: 60ms">
      <div class="chip-row" aria-label="Expense category filters">${renderExpenseCategoryChips()}</div>
    </section>
    <section class="section-block">
      <div class="section-heading">
        <h2>Top categories</h2>
        <span class="mini-label">${monthLabel(currentMonth)}</span>
      </div>
      <div class="mini-bars">
        ${topCategories.length ? topCategories.map((item) => `<article style="--accent:${item.color}; --value:${Math.min(100, Math.round((item.amount / Math.max(total, 1)) * 100))}%"><span>${item.name}</span><strong>${money.format(item.amount)}</strong><i></i></article>`).join("") : `<p class="settings-copy">Add expenses to see category patterns.</p>`}
      </div>
    </section>
    <section class="section-block">
      <div class="section-heading">
        <h2>Recent transactions</h2>
        <span class="mini-label">${monthExpenses.length}</span>
      </div>
      <div class="date-groups">
        ${Object.keys(grouped).length ? Object.entries(grouped).map(([date, items]) => `
          <section class="date-group">
            <p class="mini-label">${longDateFormat.format(parseDate(date))}</p>
            <div class="expense-list">${items.map(renderExpenseRow).join("")}</div>
          </section>
        `).join("") : `<article class="empty-panel"><p class="mini-label">No expenses</p><h2>No spending recorded yet.</h2><p class="small-note">Use Add expense to capture a transaction in seconds.</p></article>`}
      </div>
    </section>
  `;
  bindScreenActions();
  document.querySelectorAll("[data-expense-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedExpenseCategory = decodeCategoryDataset(button.dataset.expenseFilter);
      render();
    });
  });
  bindExpenseActions();
}

function getCalendarDays(key) {
  const first = new Date(`${key}-01T12:00:00`);
  const startOffset = first.getDay();
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return toDateInputValue(date);
  });
}

function renderCalendarDay(date) {
  const key = monthKey(date);
  const billsForDay = bills.filter((bill) => bill.due === date && !bill.archived);
  const expensesForDay = expenses.filter((expense) => expense.date === date);
  const totalOut = billsForDay.reduce((sum, bill) => sum + bill.amount, 0) + expensesForDay.reduce((sum, expense) => sum + expense.amount, 0);
  const isCurrentMonth = key === visibleCalendarMonth;
  return `
    <button class="calendar-day ${isCurrentMonth ? "" : "is-muted"} ${date === toDateInputValue(today) ? "is-today" : ""}" data-calendar-day="${date}" type="button">
      <span>${parseDate(date).getDate()}</span>
      <div class="day-dots">
        ${billsForDay.length ? `<i class="bill-dot"></i>` : ""}
        ${expensesForDay.length ? `<i class="expense-dot-small"></i>` : ""}
      </div>
      ${totalOut ? `<small>${money.format(totalOut)}</small>` : ""}
    </button>
  `;
}

function renderCalendar() {
  const days = getCalendarDays(visibleCalendarMonth);
  const dayBills = selectedCalendarDay ? bills.filter((bill) => bill.due === selectedCalendarDay && !bill.archived) : [];
  const dayExpenses = selectedCalendarDay ? expenses.filter((expense) => expense.date === selectedCalendarDay) : [];
  app.innerHTML = `
    ${renderTopAppBar({ kicker: "Monthly money map", title: "Calendar" })}
    <section class="month-controls home-reveal" style="--delay: 20ms">
      <button class="secondary-action" data-shift-calendar="-1" type="button">Previous</button>
      <strong>${monthLabel(visibleCalendarMonth)}</strong>
      <button class="secondary-action" data-shift-calendar="1" type="button">Next</button>
    </section>
    <section class="calendar-grid home-reveal" style="--delay: 40ms">
      ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<span class="calendar-weekday">${day}</span>`).join("")}
      ${days.map(renderCalendarDay).join("")}
    </section>
    <section class="day-drawer home-reveal" style="--delay: 70ms">
      <div class="section-heading">
        <h2>${selectedCalendarDay ? longDateFormat.format(parseDate(selectedCalendarDay)) : "Select a day"}</h2>
        <button class="text-action" data-open-expense-sheet type="button">Add expense</button>
      </div>
      ${selectedCalendarDay ? `
        <div class="bill-list compact">${dayBills.map(renderBillListCard).join("") || `<p class="settings-copy">No bills due.</p>`}</div>
        <div class="expense-list compact">${dayExpenses.map(renderExpenseRow).join("") || `<p class="settings-copy">No expenses recorded.</p>`}</div>
      ` : `<p class="settings-copy">Tap a day to see bills, expenses, and quick actions.</p>`}
    </section>
  `;
  bindScreenActions();
  document.querySelectorAll("[data-shift-calendar]").forEach((button) => {
    button.addEventListener("click", () => {
      visibleCalendarMonth = shiftMonth(visibleCalendarMonth, Number(button.dataset.shiftCalendar));
      selectedCalendarDay = null;
      saveState(false);
      render();
    });
  });
  document.querySelectorAll("[data-calendar-day]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedCalendarDay = button.dataset.calendarDay;
      render();
    });
  });
  bindPaidButtons();
  bindBillOpenButtons();
  bindBillSecondaryActions();
  bindExpenseActions();

  // Swipe left/right on the calendar grid to navigate months.
  (function attachCalendarSwipe() {
    const grid = app.querySelector(".calendar-grid");
    if (!grid) return;
    let touchStartX = 0;
    let touchStartY = 0;
    grid.addEventListener("touchstart", (event) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
    }, { passive: true });
    grid.addEventListener("touchend", (event) => {
      const dx = event.changedTouches[0].clientX - touchStartX;
      const dy = event.changedTouches[0].clientY - touchStartY;
      // Only act on predominantly horizontal swipes of at least 48px.
      if (Math.abs(dx) < 48 || Math.abs(dy) > Math.abs(dx)) return;
      visibleCalendarMonth = shiftMonth(visibleCalendarMonth, dx < 0 ? 1 : -1);
      selectedCalendarDay = null;
      saveState(false);
      render();
    }, { passive: true });
  })();
}

function renderInsights() {
  const currentMonth = monthKey(toDateInputValue(today));
  const spent = getExpenseTotal(currentMonth);
  const unpaidBills = getUnpaidBillTotal(currentMonth);
  const subscriptions = bills
    .filter((bill) => bill.category === "Subscriptions" && !bill.archived && monthKey(bill.due) === currentMonth)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const paidThisMonth = bills.filter((bill) => bill.paid && monthKey(bill.due) === currentMonth);
  const totalThisMonth = bills.filter((bill) => monthKey(bill.due) === currentMonth);
  const onTimeRate = totalThisMonth.length ? Math.round((paidThisMonth.length / totalThisMonth.length) * 100) : 0;
  const top = topExpenseCategories(currentMonth, 5);
  app.innerHTML = `
    ${renderTopAppBar({ kicker: "Decision support", title: "Insights" })}
    <section class="insight-grid home-reveal" style="--delay: 30ms">
      ${renderKpiCard("Fixed bills open", money.format(unpaidBills), "unpaid this month")}
      ${renderKpiCard("Variable spent", money.format(spent), monthLabel(currentMonth))}
      ${renderKpiCard("Subscriptions", money.format(subscriptions), "this month")}
      ${renderKpiCard("Paid rate", `${onTimeRate}%`, "bills this month", onTimeRate >= 75 ? "is-safe" : "is-alert")}
    </section>
    ${renderBudgetChart()}
    <section class="section-block">
      <div class="section-heading">
        <h2>Top spending categories</h2>
        <span class="mini-label">variable</span>
      </div>
      <div class="mini-bars">
        ${top.length ? top.map((item) => `<article style="--accent:${item.color}; --value:${Math.min(100, Math.round((item.amount / Math.max(spent, 1)) * 100))}%"><span>${item.name}</span><strong>${money.format(item.amount)}</strong><i></i></article>`).join("") : `<p class="settings-copy">Add expenses to unlock spending insights.</p>`}
      </div>
    </section>
    <section class="cashflow-card">
      <div>
        <p class="mini-label">Projected balance</p>
        <h2>${money.format((settings.cashflow.monthlyStartingBalance || 0) - unpaidBills - spent)}</h2>
        <p class="small-note">After open bills and recorded expenses.</p>
      </div>
      <span class="state-pill ${getSafeToSpend(currentMonth) < 0 ? "is-overdue" : "is-paid"}">${getSafeToSpend(currentMonth) < 0 ? "watch" : "safe"}</span>
    </section>
  `;
  bindScreenActions();
  bindBudgetCategorySelection();
}

function renderHistoryBill(bill) {
  return `
    <div class="history-item">
      <div>
        <strong>${bill.name}</strong>
        <span>${dateFormat.format(parseDate(bill.due))} · ${bill.category}</span>
      </div>
      <div>
        <strong>${money.format(bill.amount)}</strong>
        <span>${recordStatusText(bill)}</span>
      </div>
    </div>
  `;
}

function renderArchivedBillRow(bill) {
  return `
    <div class="archived-item">
      <div>
        <strong>${bill.name}</strong>
        <span>${dateFormat.format(parseDate(bill.due))} · ${bill.category}</span>
      </div>
      <button class="secondary-action" type="button" data-restore-bill="${bill.id}">Restore</button>
    </div>
  `;
}

function renderSettingsContent() {
  const selected = getCategory(selectedBudgetCategory);
  const months = getAvailableMonths();
  const archivedBills = getArchivedBills();
  if (!months.includes(selectedHistoryMonth)) selectedHistoryMonth = months[months.length - 1] || monthKey(toDateInputValue(today));
  const summary = getMonthSummary(selectedHistoryMonth);
  settingsContent.innerHTML = `
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Appearance</h3>
        <span class="mini-label">theme</span>
      </div>
      <p class="settings-copy">Choose a matte light or dark appearance, or follow your device.</p>
      <label>
        <span>Theme</span>
        <select id="themePreference">
          <option value="system" ${settings.theme === "system" ? "selected" : ""}>System</option>
          <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark</option>
          <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light</option>
          <option value="pastel" ${settings.theme === "pastel" ? "selected" : ""}>Pastel</option>
        </select>
      </label>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Cashflow</h3>
        <span class="mini-label">safe spend</span>
      </div>
      <p class="settings-copy">Set a monthly starting balance and a cushion to power projected balance and safe-to-spend cards.</p>
      <form id="cashflowForm" class="control-form">
        <label>
          <span>Monthly starting balance</span>
          <input id="monthlyStartingBalance" inputmode="numeric" value="${settings.cashflow.monthlyStartingBalance}" aria-label="Monthly starting balance">
        </label>
        <label>
          <span>Safety buffer</span>
          <input id="safeSpendBuffer" inputmode="numeric" value="${settings.cashflow.safeSpendBuffer}" aria-label="Safe to spend buffer">
        </label>
        <button class="primary-action small" type="submit">Save cashflow</button>
      </form>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Monthly history</h3>
        <span class="mini-label">export</span>
      </div>
      <p class="settings-copy">Choose a month, review the record, then export it.</p>
      <label class="history-select">
        <span>Month</span>
        <select id="historyMonth">
          ${months.map((key) => `<option value="${key}" ${key === selectedHistoryMonth ? "selected" : ""}>${monthLabel(key)}</option>`).join("")}
        </select>
      </label>
      <div class="history-summary">
        <article>
          <span>Total due</span>
          <strong>${money.format(summary.total)}</strong>
        </article>
        <article>
          <span>Paid</span>
          <strong>${money.format(summary.paid)}</strong>
        </article>
        <article>
          <span>Open</span>
          <strong>${summary.unpaidItems.length}</strong>
        </article>
      </div>
      <div class="history-list">
        ${summary.items.slice(0, 6).map(renderHistoryBill).join("") || `<p class="settings-copy">No bills recorded for this month yet.</p>`}
      </div>
      <div class="export-actions">
        <button class="primary-action small" id="exportPdf" type="button">Export PDF</button>
        <button class="secondary-action" id="exportCsv" type="button">Export CSV</button>
      </div>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Reminders</h3>
        <span class="mini-label">in-app</span>
      </div>
      <p class="settings-copy">Controls the due-soon status used across Upcoming, bill details, and local reminder checks.</p>
      <form id="reminderForm" class="control-form">
        <label>
          <span>Reminder window</span>
          <input id="reminderDays" inputmode="numeric" value="${settings.reminderDays}" aria-label="Reminder window in days">
        </label>
        <button class="primary-action small" type="submit">Save reminder</button>
      </form>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>iPhone notifications</h3>
        <span class="mini-label">6 AM</span>
      </div>
      <p class="settings-copy">Daily Home Screen summary for unpaid bills due in 5 days or less. Due-tomorrow bills get priority wording.</p>
      <div class="notification-status">
        <strong>${pushSupportStatus()}</strong>
        <span>${settings.lastPushSync ? `Last synced ${dateFormat.format(new Date(settings.lastPushSync))}` : "Not synced yet"}</span>
      </div>
      <form id="pushForm" class="control-form">
        <label>
          <span>Notification setup code</span>
          <input id="notificationToken" autocomplete="off" value="${settings.notificationToken || ""}" placeholder="Private setup code">
        </label>
        <div class="control-actions">
          <button class="primary-action small" id="enablePush" type="submit">Enable</button>
          <button class="secondary-action" id="syncPush" type="button">Sync now</button>
        </div>
        <button class="danger-action" id="disablePush" type="button">Disable notifications</button>
      </form>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Data & backup</h3>
        <span class="mini-label">local</span>
      </div>
      <p class="settings-copy">Export a full backup for this device, or restore a backup file later.</p>
      <div class="backup-actions">
        <button class="secondary-action" id="exportBackup" type="button">Export backup</button>
        <label class="file-action">
          <input id="restoreBackup" type="file" accept="application/json,.json">
          <span>Restore backup</span>
        </label>
      </div>
      <div class="starter-actions">
        <button class="secondary-action" id="clearStarterBills" type="button">Clear starter bills</button>
        <button class="secondary-action" id="clearStarterCategories" type="button">Clear starter categories</button>
        <button class="danger-action" id="clearStarterAll" type="button">Clear starter bills & categories</button>
      </div>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Archived bills</h3>
        <span class="mini-label">${archivedBills.length}</span>
      </div>
      <p class="settings-copy">Archived bills stay out of triage, but you can restore them here.</p>
      <div class="archived-list">
        ${archivedBills.length ? archivedBills.map(renderArchivedBillRow).join("") : `<p class="settings-copy">No archived bills right now.</p>`}
      </div>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Budget categories</h3>
        <span class="mini-label">active</span>
      </div>
      <p class="settings-copy">Adjust planned amounts, add a category, or remove one from your budget plan.</p>
      <form id="editCategoryForm" class="control-form">
        <label>
          <span>Category</span>
          <select id="editCategory">${categories.map((category) => `<option ${category.name === selected.name ? "selected" : ""}>${category.name}</option>`).join("")}</select>
        </label>
        <label>
          <span>Planned amount</span>
          <input id="editPlanned" inputmode="numeric" value="${selected.planned}" aria-label="Planned amount for selected category">
        </label>
        <div class="control-actions">
          <button class="primary-action small" type="submit">Update</button>
          <button class="secondary-action" id="removeCategory" type="button">Remove</button>
        </div>
      </form>
      <form id="addCategoryForm" class="add-category-form">
        <label>
          <span>New category</span>
          <input id="newCategoryName" autocomplete="off" placeholder="Emergency">
        </label>
        <label>
          <span>Amount</span>
          <input id="newCategoryAmount" inputmode="numeric" placeholder="25000">
        </label>
        <button class="secondary-action add" type="submit">Add</button>
      </form>
    </section>
  `;
  setupAppearanceControls();
  setupCashflowControls();
  setupMonthlyHistory();
  setupReminderSettings();
  setupPushControls();
  setupBackupControls();
  setupStarterClearControls();
  setupArchivedControls();
  setupBudgetControls();
}

function openSheet(billId = null) {
  lastTrigger = document.activeElement;
  editingBillId = billId;
  const bill = getBillById(billId);
  document.querySelector("#sheetTitle").textContent = bill ? "Edit bill" : "Add a bill";
  billForm.querySelector(".primary-action").textContent = bill ? "Save changes" : "Add to Upcoming";
  deleteBillButton.hidden = !bill;
  paidRow.hidden = !bill;
  if (bill) {
    billName.value = bill.name;
    billAmount.value = bill.amount;
    billDate.value = bill.due;
    syncBillCategoryOptions(bill.category);
    billRepeat.value = bill.repeat || "none";
    propertyTaxPlan.value = bill.propertyTaxPlan || "full";
    billPaid.checked = Boolean(bill.paid);
  } else {
    billForm.reset();
    syncBillCategoryOptions();
    billDate.value = toDateInputValue(today);
    billRepeat.value = "none";
    propertyTaxPlan.value = "full";
    billPaid.checked = false;
  }
  updatePropertyTaxPlanVisibility();
  sheet.hidden = false;
  backdrop.hidden = false;
  billName.focus();
}

function closeSheet() {
  sheet.hidden = true;
  if (settingsSheet.hidden && actionSheet.hidden && expenseSheet.hidden) backdrop.hidden = true;
  billForm.reset();
  editingBillId = null;
  deleteBillButton.hidden = true;
  paidRow.hidden = true;
  document.querySelector("#sheetTitle").textContent = "Add a bill";
  billForm.querySelector(".primary-action").textContent = "Add to Upcoming";
  lastTrigger?.focus?.();
}

function syncExpenseCategoryOptions(preferred = expenseCategory.value) {
  expenseCategories = normalizeExpenseCategories(expenseCategories);
  const fallback = expenseCategories[0] || defaultCategory().name;
  expenseCategory.innerHTML = expenseCategories.map((category) => `<option>${category}</option>`).join("");
  expenseCategory.value = expenseCategories.includes(preferred) ? preferred : fallback;
  expenseSource.innerHTML = settings.cashflow.paymentSources.map((source) => `<option>${source}</option>`).join("");
}

function openExpenseSheet({ keepValues = false } = {}) {
  lastTrigger = document.activeElement;
  if (!keepValues) {
    expenseForm.reset();
    expenseDate.value = selectedCalendarDay || toDateInputValue(today);
  }
  syncExpenseCategoryOptions(selectedExpenseCategory === "All" ? undefined : selectedExpenseCategory);
  expenseSheet.hidden = false;
  backdrop.hidden = false;
  expenseAmount.focus();
}

function closeExpenseSheet() {
  expenseSheet.hidden = true;
  if (sheet.hidden && settingsSheet.hidden && actionSheet.hidden) backdrop.hidden = true;
  expenseForm.reset();
  lastTrigger?.focus?.();
}

function openSettingsSheet() {
  lastTrigger = document.activeElement;
  renderSettingsContent();
  settingsSheet.hidden = false;
  backdrop.hidden = false;
}

function closeSettingsSheet() {
  settingsSheet.hidden = true;
  if (sheet.hidden && actionSheet.hidden && expenseSheet.hidden) backdrop.hidden = true;
  lastTrigger?.focus?.();
}

function openSnoozeSheet(billId) {
  const bill = getBillById(billId);
  if (!bill) return;
  actionBillId = billId;
  lastTrigger = document.activeElement;
  actionSheetTitle.textContent = "Snooze bill";
  actionSheetContent.innerHTML = `
    <section class="action-group">
      <button class="sheet-choice" type="button" data-snooze-offset="1">Tomorrow</button>
      <button class="sheet-choice" type="button" data-snooze-offset="3">3 days</button>
      <button class="sheet-choice" type="button" data-snooze-offset="7">1 week</button>
    </section>
    <form id="pickSnoozeDate" class="action-form">
      <label>
        <span>Pick date</span>
        <input id="customSnoozeDate" type="date" value="${bill.due}" min="${toDateInputValue(today)}">
      </label>
      <button class="primary-action small" type="submit">Apply date</button>
    </form>
  `;
  actionSheet.hidden = false;
  backdrop.hidden = false;
  actionSheet.querySelector("[data-snooze-offset]")?.focus();
  actionSheet.querySelectorAll("[data-snooze-offset]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextDate = parseDate(bill.due);
      nextDate.setDate(nextDate.getDate() + Number(button.dataset.snoozeOffset));
      snoozeBill(billId, toDateInputValue(nextDate));
    });
  });
  document.querySelector("#pickSnoozeDate").addEventListener("submit", (event) => {
    event.preventDefault();
    snoozeBill(billId, document.querySelector("#customSnoozeDate").value);
  });
}

function updateCategoryPlan(name, plannedValue) {
  const selected = getCategory(name);
  selected.planned = cleanAmount(plannedValue);
  selectedBudgetCategory = selected.name;
  syncBillCategoryOptions(selected.name);
  saveState();
  render();
  if (!settingsSheet.hidden) renderSettingsContent();
  return selected;
}

function removeCategoryByName(name) {
  if (categories.length <= 1) return null;
  const snapshot = snapshotForUndo();
  const index = categories.findIndex((category) => category.name === name);
  if (index < 0) return null;
  const removedName = categories[index].name;
  categories.splice(index, 1);
  selectedBudgetCategory = categories[Math.max(0, index - 1)]?.name || defaultCategory().name;
  ensureCategorySafety();
  syncBillCategoryOptions(selectedBudgetCategory);
  saveState();
  render();
  if (!settingsSheet.hidden) renderSettingsContent();
  return { snapshot, removedName };
}

function addCategoryByName(name, plannedValue) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Enter a category name." };
  if (categories.some((category) => category.name.toLowerCase() === trimmed.toLowerCase())) {
    return { error: `${trimmed} already exists.` };
  }
  categories.push({
    name: trimmed,
    color: categoryColors[categories.length % categoryColors.length],
    planned: cleanAmount(plannedValue),
    assigned: 0
  });
  if (!expenseCategories.includes(trimmed)) expenseCategories.push(trimmed);
  selectedBudgetCategory = trimmed;
  syncBillCategoryOptions(trimmed);
  saveState();
  render();
  if (!settingsSheet.hidden) renderSettingsContent();
  return { name: trimmed };
}

function openBudgetCategorySheet(categoryName = selectedBudgetCategory) {
  const selected = getCategory(categoryName);
  if (!selected) return;
  selectedBudgetCategory = selected.name;
  lastTrigger = document.activeElement;
  actionSheetTitle.textContent = selected.name;
  actionSheetContent.innerHTML = `
    <section class="action-panel-copy">
      <p class="settings-copy">Adjust the current category without leaving Budget.</p>
    </section>
    <form id="budgetCategorySheetForm" class="action-form">
      <label>
        <span>Planned amount</span>
        <input id="budgetCategoryPlanned" inputmode="numeric" value="${selected.planned}" aria-label="Planned amount for ${selected.name}">
      </label>
      <div class="control-actions">
        <button class="primary-action small" type="submit">Update</button>
        <button class="secondary-action" id="budgetCategoryRemove" type="button">Remove</button>
      </div>
    </form>
    <form id="budgetCategoryAddForm" class="action-form">
      <label>
        <span>New category</span>
        <input id="budgetCategoryName" autocomplete="off" placeholder="Emergency">
      </label>
      <label>
        <span>Planned amount</span>
        <input id="budgetCategoryAmount" inputmode="numeric" placeholder="25000">
      </label>
      <button class="secondary-action" type="submit">Add category</button>
    </form>
  `;
  actionSheet.hidden = false;
  backdrop.hidden = false;
  document.querySelector("#budgetCategoryPlanned")?.focus();

  document.querySelector("#budgetCategorySheetForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const updated = updateCategoryPlan(selected.name, document.querySelector("#budgetCategoryPlanned").value);
    closeActionSheet(false);
    showToast(`${updated.name} plan updated.`);
  });

  document.querySelector("#budgetCategoryRemove").addEventListener("click", () => {
    const removed = removeCategoryByName(selected.name);
    if (!removed) return;
    closeActionSheet(false);
    showToast(`${removed.removedName} removed.`, {
      undo: () => restoreSnapshot(removed.snapshot, `${removed.removedName} restored.`)
    });
  });

  document.querySelector("#budgetCategoryAddForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const result = addCategoryByName(
      document.querySelector("#budgetCategoryName").value,
      document.querySelector("#budgetCategoryAmount").value
    );
    if (result.error) {
      showToast(result.error);
      return;
    }
    closeActionSheet(false);
    showToast(`${result.name} category added.`);
  });
}

function closeActionSheet(restoreFocus = true) {
  actionSheet.hidden = true;
  actionBillId = null;
  actionSheetTitle.textContent = "Quick action";
  actionSheetContent.innerHTML = "";
  if (sheet.hidden && settingsSheet.hidden && expenseSheet.hidden) backdrop.hidden = true;
  if (restoreFocus) lastTrigger?.focus?.();
}

function closeAllSheets() {
  if (!sheet.hidden) closeSheet();
  if (!settingsSheet.hidden) closeSettingsSheet();
  if (!actionSheet.hidden) closeActionSheet(false);
  if (!expenseSheet.hidden) closeExpenseSheet();
  backdrop.hidden = true;
}

function activeSheet() {
  if (!actionSheet.hidden) return actionSheet;
  if (!expenseSheet.hidden) return expenseSheet;
  if (!settingsSheet.hidden) return settingsSheet;
  if (!sheet.hidden) return sheet;
  return null;
}

function syncBillCategoryOptions(preferred = billCategory.value) {
  const fallback = categories[0]?.name || "";
  billCategory.innerHTML = categories.map((category) => `<option>${category.name}</option>`).join("");
  billCategory.value = categories.some((category) => category.name === preferred) ? preferred : fallback;
}

function updatePropertyTaxPlanVisibility() {
  propertyTaxPlanRow.hidden = !isPropertyTaxBill({ name: billName.value, category: billCategory.value });
}

function toggleThemePreference() {
  const themes = ["dark", "light", "pastel"];
  const current = resolvedTheme();
  const nextTheme = themes[(themes.indexOf(current) + 1) % themes.length];
  settings.theme = nextTheme;
  applyTheme();
  saveState(false);
  const themeLabels = { dark: "Dark", light: "Light", pastel: "Pastel" };
  showToast(`${themeLabels[nextTheme] ?? nextTheme} theme applied.`);
}

function bindScreenActions() {
  document.querySelectorAll("[data-open-bill-sheet]").forEach((button) => {
    button.addEventListener("click", () => openSheet());
  });
  document.querySelectorAll("[data-open-expense-sheet]").forEach((button) => {
    button.addEventListener("click", () => openExpenseSheet());
  });
  document.querySelectorAll("[data-open-settings]").forEach((button) => {
    button.addEventListener("click", openSettingsSheet);
  });
  document.querySelectorAll("[data-toggle-theme]").forEach((button) => {
    button.addEventListener("click", toggleThemePreference);
  });
}

function bindBillOpenButtons() {
  document.querySelectorAll("[data-open-bill]").forEach((card) => {
    const open = () => openBillDetail(Number(card.dataset.openBill));
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function bindBillSecondaryActions() {
  document.querySelectorAll("[data-edit-bill]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openSheet(Number(button.dataset.editBill));
    });
  });
  document.querySelectorAll("[data-snooze-bill]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openSnoozeSheet(Number(button.dataset.snoozeBill));
    });
  });
}

function bindPaidButtons() {
  document.querySelectorAll("[data-paid]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      markBillPaid(Number(button.dataset.paid));
    });
  });
}

function exportRows(key) {
  const billsForMonth = getMonthBills(key);
  const billRows = billsForMonth.map((bill) => [
    "Bill",
    monthLabel(key),
    bill.name,
    bill.category,
    bill.due,
    bill.amount,
    recordStatusText(bill),
    "",
    "",
    "",
    bill.archived ? "Archived from daily triage" : ""
  ]);
  const categoryRows = categories.map((category) => [
    "Category",
    monthLabel(key),
    category.name,
    category.name,
    "",
    "",
    "",
    category.planned,
    category.assigned,
    Math.max(category.planned - category.assigned, 0),
    "Current category plan snapshot"
  ]);
  return [...billRows, ...categoryRows];
}

function exportCsv(key) {
  const header = ["Record Type", "Month", "Name", "Category", "Due Date", "Amount JMD", "Status", "Planned JMD", "Assigned JMD", "Remaining JMD", "Notes"];
  const csv = [header, ...exportRows(key)]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `upnextbudgeting-${key}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast(`${monthLabel(key)} CSV exported.`);
}

function renderPrintExport(key) {
  const summary = getMonthSummary(key);
  const generated = new Intl.DateTimeFormat("en-JM", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(today);

  printExport.innerHTML = `
    <div class="print-page">
      <header class="print-header">
        <p>UpNextBudgeting</p>
        <h1>${monthLabel(key)} Monthly Record</h1>
        <span>Generated ${generated}</span>
      </header>
      <section class="print-summary">
        <article><span>Total due</span><strong>${money.format(summary.total)}</strong></article>
        <article><span>Paid</span><strong>${money.format(summary.paid)}</strong></article>
        <article><span>Open</span><strong>${summary.unpaidItems.length}</strong></article>
        <article><span>Overdue</span><strong>${summary.overdueItems.length}</strong></article>
      </section>
      <section>
        <h2>Bills</h2>
        <table>
          <thead>
            <tr><th>Name</th><th>Category</th><th>Due</th><th>Status</th><th>Amount</th></tr>
          </thead>
          <tbody>
            ${summary.items.map((bill) => `
              <tr>
                <td>${bill.name}</td>
                <td>${bill.category}</td>
                <td>${dateFormat.format(parseDate(bill.due))}</td>
                <td>${recordStatusText(bill)}</td>
                <td>${money.format(bill.amount)}</td>
              </tr>
            `).join("") || `<tr><td colspan="5">No bills recorded for this month.</td></tr>`}
          </tbody>
        </table>
      </section>
      <section>
        <h2>Category Plan Snapshot</h2>
        <table>
          <thead>
            <tr><th>Category</th><th>Planned</th><th>Assigned</th><th>Remaining</th></tr>
          </thead>
          <tbody>
            ${categories.map((category) => `
              <tr>
                <td>${category.name}</td>
                <td>${money.format(category.planned)}</td>
                <td>${money.format(category.assigned)}</td>
                <td>${money.format(Math.max(category.planned - category.assigned, 0))}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    </div>
  `;
}

function exportPdf(key) {
  renderPrintExport(key);
  window.print();
  showToast("PDF print view opened.");
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(appState(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `upnextbudgeting-backup-${toDateInputValue(today)}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("Backup exported.");
}

function applyImportedState(state) {
  if (!isValidState(state)) throw new Error("Backup file is not a valid UpNextBudgeting backup.");
  categories = state.categories.map((category, index) => ({
    name: category.name,
    color: category.color || categoryColors[index % categoryColors.length],
    planned: cleanAmount(category.planned),
    assigned: cleanAmount(category.assigned)
  }));
  bills = state.bills.map(normalizeBill);
  settings = { initialized: true, reminderDays: 3, ...(state.settings || {}) };
  settings.theme = validTheme(settings.theme);
  settings.cashflow = normalizeCashflowSettings(settings.cashflow);
  expenses = Array.isArray(state.expenses) ? state.expenses.map(normalizeExpense) : [];
  expenseCategories = normalizeExpenseCategories(state.expenseCategories);
  selectedBudgetCategory = categories.some((category) => category.name === state.selectedBudgetCategory) ? state.selectedBudgetCategory : categories[0]?.name;
  selectedExpenseCategory = expenseCategories.includes(state.selectedExpenseCategory) ? state.selectedExpenseCategory : "All";
  selectedHistoryMonth = state.selectedHistoryMonth || selectedHistoryMonth;
  visibleCalendarMonth = state.visibleCalendarMonth || visibleCalendarMonth;
  pendingRecurringBillId = null;
  activeBillId = null;
  ensureCategorySafety();
  applyTheme();
  syncBillCategoryOptions(selectedBudgetCategory);
  saveState();
  render();
  renderSettingsContent();
  showToast("Backup restored.");
}

function snapshotForUndo() {
  return {
    bills: bills.map(cloneBill),
    categories: categories.map(cloneCategory),
    expenses: expenses.map(cloneExpense),
    expenseCategories: [...expenseCategories],
    selectedBudgetCategory,
    selectedExpenseCategory,
    selectedHistoryMonth,
    visibleCalendarMonth,
    pendingRecurringBillId,
    activeBillId
  };
}

function restoreSnapshot(snapshot, message = "Restored.") {
  bills = snapshot.bills.map(cloneBill);
  categories = snapshot.categories.map(cloneCategory);
  expenses = snapshot.expenses.map(cloneExpense);
  expenseCategories = [...snapshot.expenseCategories];
  selectedBudgetCategory = snapshot.selectedBudgetCategory;
  selectedExpenseCategory = snapshot.selectedExpenseCategory;
  selectedHistoryMonth = snapshot.selectedHistoryMonth;
  visibleCalendarMonth = snapshot.visibleCalendarMonth;
  pendingRecurringBillId = snapshot.pendingRecurringBillId;
  activeBillId = snapshot.activeBillId;
  ensureCategorySafety();
  syncBillCategoryOptions(selectedBudgetCategory);
  saveState();
  render();
  if (!settingsSheet.hidden) renderSettingsContent();
  showToast(message);
}

function clearStarterData(mode) {
  const copy = {
    bills: "starter bills",
    categories: "starter categories",
    both: "starter bills and categories"
  };
  if (!confirm(`Clear ${copy[mode]}? Your user-created items will stay.`)) return;
  const snapshot = snapshotForUndo();
  if (mode === "bills" || mode === "both") {
    bills = bills.filter((bill) => !starterBillIds.has(bill.id));
    pendingRecurringBillId = pendingRecurringBillId && starterBillIds.has(pendingRecurringBillId) ? null : pendingRecurringBillId;
    if (activeBillId && starterBillIds.has(activeBillId)) activeBillId = null;
  }
  if (mode === "categories" || mode === "both") {
    categories = categories.filter((category) => !starterCategoryNames.has(category.name));
    expenseCategories = expenseCategories.filter((category) => !starterCategoryNames.has(category));
  }
  ensureCategorySafety();
  syncBillCategoryOptions(selectedBudgetCategory);
  saveState();
  render();
  renderSettingsContent();
  showToast(`Cleared ${copy[mode]}.`, {
    undo: () => restoreSnapshot(snapshot, "Starter data restored.")
  });
}

function setupAppearanceControls() {
  const themePreference = document.querySelector("#themePreference");
  themePreference.addEventListener("change", () => {
    settings.theme = validTheme(themePreference.value);
    // update theme-color meta for pastel
    applyTheme();
    saveState(false);
    showToast(`${themePreference.options[themePreference.selectedIndex].text} theme applied.`);
  });
}

function setupCashflowControls() {
  const form = document.querySelector("#cashflowForm");
  const startingBalance = document.querySelector("#monthlyStartingBalance");
  const buffer = document.querySelector("#safeSpendBuffer");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    settings.cashflow.monthlyStartingBalance = cleanAmount(startingBalance.value);
    settings.cashflow.safeSpendBuffer = cleanAmount(buffer.value);
    saveState();
    render();
    renderSettingsContent();
    showToast("Cashflow settings updated.");
  });
}

function setupMonthlyHistory() {
  const historyMonth = document.querySelector("#historyMonth");
  const exportCsvButton = document.querySelector("#exportCsv");
  const exportPdfButton = document.querySelector("#exportPdf");

  historyMonth.addEventListener("change", () => {
    selectedHistoryMonth = historyMonth.value;
    saveState(false);
    renderSettingsContent();
  });

  exportCsvButton.addEventListener("click", () => exportCsv(selectedHistoryMonth));
  exportPdfButton.addEventListener("click", () => exportPdf(selectedHistoryMonth));
}

function setupReminderSettings() {
  const reminderForm = document.querySelector("#reminderForm");
  const reminderDays = document.querySelector("#reminderDays");
  reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    settings.reminderDays = Math.max(0, Math.min(30, cleanAmount(reminderDays.value)));
    saveState();
    render();
    renderSettingsContent();
    showToast(`Reminder window set to ${settings.reminderDays} days.`);
  });
}

async function enablePushNotifications(token) {
  if (!token.trim()) throw new Error("Enter your notification setup code.");
  if (!isSupabasePushConfigured()) throw new Error("Supabase push config is not filled in yet.");
  if (pushSupportStatus() === "Unsupported on this browser") throw new Error("This browser does not support Web Push.");
  if (!isStandaloneApp()) throw new Error("Add UpNextBudgeting to your iPhone Home Screen, then open it from there.");
  const registration = await navigator.serviceWorker.ready;
  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was not granted.");
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: base64UrlToUint8Array(SUPABASE_CONFIG.vapidPublicKey)
  });
  await callPushFunction({
    action: "subscribe",
    token,
    subscription: subscription.toJSON(),
    snapshot: pushSnapshot()
  });
  settings.notificationToken = token;
  settings.pushEnabled = true;
  settings.pushEndpoint = subscription.endpoint;
  settings.pushStatus = "Notifications enabled";
  settings.lastPushSync = new Date().toISOString();
  saveState(false);
}

async function disablePushNotifications() {
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = registration ? await registration.pushManager.getSubscription() : null;
  if (subscription) {
    await callPushFunction({
      action: "disable",
      token: settings.notificationToken,
      endpoint: subscription.endpoint
    }).catch(() => {});
    await subscription.unsubscribe().catch(() => {});
  }
  settings.pushEnabled = false;
  settings.pushEndpoint = "";
  settings.pushStatus = "Ready";
  await clearAppBadge();
  saveState(false);
}

async function updateAppBadge() {
  const count = getPushReminderItems().length;
  try {
    if (count && "setAppBadge" in navigator) await navigator.setAppBadge(count);
    if (!count && "clearAppBadge" in navigator) await navigator.clearAppBadge();
  } catch (error) {
    console.warn("Could not update app badge", error);
  }
}

async function clearAppBadge() {
  try {
    if ("clearAppBadge" in navigator) await navigator.clearAppBadge();
  } catch (error) {
    console.warn("Could not clear app badge", error);
  }
}

function setupPushControls() {
  const pushForm = document.querySelector("#pushForm");
  const tokenInput = document.querySelector("#notificationToken");
  const syncPushButton = document.querySelector("#syncPush");
  const disablePushButton = document.querySelector("#disablePush");

  pushForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    settings.pushStatus = "Setting up...";
    renderSettingsContent();
    try {
      await enablePushNotifications(tokenInput.value.trim());
      showToast("Notifications enabled.");
    } catch (error) {
      settings.pushStatus = error.message || "Notification setup failed";
      saveState(false);
      showToast(settings.pushStatus);
    }
    renderSettingsContent();
  });

  syncPushButton.addEventListener("click", async () => {
    settings.notificationToken = tokenInput.value.trim() || settings.notificationToken;
    settings.pushStatus = "Syncing...";
    renderSettingsContent();
    try {
      await syncPushSnapshot();
      showToast("Notification data synced.");
    } catch (error) {
      settings.pushStatus = error.message || "Notification sync failed";
      saveState(false);
      showToast(settings.pushStatus);
    }
    renderSettingsContent();
  });

  disablePushButton.addEventListener("click", async () => {
    await disablePushNotifications();
    renderSettingsContent();
    showToast("Notifications disabled.");
  });
}

function setupBackupControls() {
  document.querySelector("#exportBackup").addEventListener("click", exportBackup);
  document.querySelector("#restoreBackup").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      try {
        const state = JSON.parse(String(reader.result));
        if (!confirm("Restore this backup? Current local data will be replaced.")) return;
        applyImportedState(state);
      } catch (error) {
        showToast(error.message || "Could not restore backup.");
      } finally {
        event.target.value = "";
      }
    });
    reader.readAsText(file);
  });
}

function setupStarterClearControls() {
  document.querySelector("#clearStarterBills").addEventListener("click", () => clearStarterData("bills"));
  document.querySelector("#clearStarterCategories").addEventListener("click", () => clearStarterData("categories"));
  document.querySelector("#clearStarterAll").addEventListener("click", () => clearStarterData("both"));
}

function setupArchivedControls() {
  document.querySelectorAll("[data-restore-bill]").forEach((button) => {
    button.addEventListener("click", () => restoreArchivedBill(Number(button.dataset.restoreBill)));
  });
}

function setupAccessibility() {
  document.addEventListener("keydown", (event) => {
    const currentSheet = activeSheet();
    if (event.key === "Escape") {
      if (currentSheet) {
        event.preventDefault();
        if (currentSheet === actionSheet) closeActionSheet();
        if (currentSheet === expenseSheet) closeExpenseSheet();
        if (currentSheet === settingsSheet) closeSettingsSheet();
        if (currentSheet === sheet) closeSheet();
        return;
      }
      if (activeBillId) {
        event.preventDefault();
        closeBillDetail();
      }
      return;
    }
    if (!currentSheet || event.key !== "Tab") return;
    const focusable = [...currentSheet.querySelectorAll("button, input, select, textarea, a[href], [tabindex]:not([tabindex='-1'])")]
      .filter((element) => !element.disabled && !element.hidden && element.offsetParent !== null);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function setupBudgetControls() {
  const editCategory = document.querySelector("#editCategory");
  const editPlanned = document.querySelector("#editPlanned");
  const editCategoryForm = document.querySelector("#editCategoryForm");
  const addCategoryForm = document.querySelector("#addCategoryForm");
  const removeCategory = document.querySelector("#removeCategory");
  const newCategoryName = document.querySelector("#newCategoryName");
  const newCategoryAmount = document.querySelector("#newCategoryAmount");

  editCategory.addEventListener("change", () => {
    selectedBudgetCategory = editCategory.value;
    const selected = getCategory(selectedBudgetCategory);
    editPlanned.value = selected.planned;
  });

  editCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const selected = updateCategoryPlan(editCategory.value, editPlanned.value);
    renderSettingsContent();
    showToast(`${selected.name} plan updated.`);
  });

  removeCategory.addEventListener("click", () => {
    const removed = removeCategoryByName(editCategory.value);
    if (!removed) return;
    renderSettingsContent();
    showToast(`${removed.removedName} removed.`, {
      undo: () => restoreSnapshot(removed.snapshot, `${removed.removedName} restored.`)
    });
  });

  addCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = addCategoryByName(newCategoryName.value, newCategoryAmount.value);
    if (result?.error) {
      showToast(result.error);
      return;
    }
    renderSettingsContent();
    showToast(`${result.name} category added.`);
  });
}

function addExpenseFromForm({ addAnother = false } = {}) {
  const expense = normalizeExpense({
    id: Date.now() + Math.floor(Math.random() * 1000),
    amount: expenseAmount.value,
    category: expenseCategory.value,
    merchant: expenseMerchant.value.trim() || expenseCategory.value,
    note: expenseMerchant.value.trim(),
    date: expenseDate.value,
    paymentSource: expenseSource.value,
    createdAt: nowIso(),
    updatedAt: nowIso()
  });
  expenses.push(expense);
  if (!expenseCategories.includes(expense.category)) expenseCategories.push(expense.category);
  saveState();
  render();
  showToast(`${expense.merchant} added.`, {
    undo: () => {
      expenses = expenses.filter((item) => item.id !== expense.id);
      saveState();
      render();
      showToast("Expense removed.");
    }
  });
  if (addAnother) {
    openExpenseSheet({ keepValues: true });
    expenseAmount.value = "";
    expenseMerchant.value = "";
  } else {
    closeExpenseSheet();
  }
}

function deleteExpense(expenseId) {
  const expense = expenses.find((item) => item.id === expenseId);
  if (!expense) return;
  const snapshot = cloneExpense(expense);
  expenses = expenses.filter((item) => item.id !== expenseId);
  saveState();
  render();
  showToast(`${snapshot.merchant} removed.`, {
    undo: () => {
      expenses.push(snapshot);
      saveState();
      render();
      showToast(`${snapshot.merchant} restored.`);
    }
  });
}

function bindExpenseActions() {
  document.querySelectorAll("[data-delete-expense]").forEach((button) => {
    button.addEventListener("click", () => deleteExpense(Number(button.dataset.deleteExpense)));
  });
}

function setupExpenseForm() {
  syncExpenseCategoryOptions();
  expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const addAnother = event.submitter?.dataset.expenseSubmit === "again";
    addExpenseFromForm({ addAnother });
  });
  document.querySelector("#closeExpenseSheet").addEventListener("click", closeExpenseSheet);
}

function setupForm() {
  syncBillCategoryOptions();
  presetRail.innerHTML = presets.map((preset) => `<button class="preset-pill" type="button" data-preset="${preset.name}">${preset.name}</button>`).join("");

  presetRail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-preset]");
    if (!button) return;
    const preset = presets.find((item) => item.name === button.dataset.preset);
    billName.value = preset.name;
    billAmount.value = preset.amount;
    billCategory.value = preset.category;
    billRepeat.value = inferRepeat(preset);
    if (isPropertyTaxBill(preset)) propertyTaxPlan.value = "full";
    updatePropertyTaxPlanVisibility();
  });

  billName.addEventListener("input", updatePropertyTaxPlanVisibility);
  billCategory.addEventListener("change", updatePropertyTaxPlanVisibility);

  billForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const wasEditing = Boolean(editingBillId);
    const payload = {
      name: billName.value.trim(),
      category: billCategory.value,
      amount: cleanAmount(billAmount.value),
      due: billDate.value,
      paid: editingBillId ? billPaid.checked : false,
      repeat: billRepeat.value,
      propertyTaxPlan: propertyTaxPlan.value
    };
    if (editingBillId) {
      const bill = getBillById(editingBillId);
      if (bill) {
        const before = cloneBill(bill);
        bill.name = payload.name;
        bill.category = payload.category;
        bill.amount = payload.amount;
        bill.due = payload.due;
        bill.repeat = payload.repeat;
        bill.propertyTaxPlan = payload.propertyTaxPlan;
        if (!before.paid && payload.paid) {
          bill.paid = true;
          bill.completedAt = nowIso();
          appendActivity(bill, "paid", { note: "Marked paid from edit view." });
        } else if (before.paid && !payload.paid) {
          bill.paid = false;
          bill.completedAt = null;
          appendActivity(bill, "unpaid", { note: "Marked unpaid from edit view." });
        } else {
          bill.paid = payload.paid;
        }
        if (
          before.name !== bill.name ||
          before.amount !== bill.amount ||
          before.category !== bill.category ||
          before.due !== bill.due ||
          before.repeat !== bill.repeat ||
          before.propertyTaxPlan !== bill.propertyTaxPlan
        ) {
          appendActivity(bill, "edited", { note: "Bill details were updated." });
        }
      }
    } else {
      bills.push(normalizeBill({
        id: Date.now(),
        ...payload,
        seriesKey: makeSeriesKey(payload),
        activity: [createActivity("created", { note: "Bill added to the plan." })],
        completedAt: payload.paid ? nowIso() : null
      }));
    }
    saveState();
    closeSheet();
    activeTab = "home";
    render();
    if (!settingsSheet.hidden) renderSettingsContent();
    showToast(wasEditing ? `${payload.name} updated.` : `${payload.name} added.`);
  });

  deleteBillButton.addEventListener("click", () => {
    if (!editingBillId) return;
    const bill = getBillById(editingBillId);
    if (!bill || !confirm(`Delete ${bill.name}?`)) return;
    const deletedBill = cloneBill(bill);
    const previousPending = pendingRecurringBillId;
    const previousActive = activeBillId;
    bills = bills.filter((item) => item.id !== editingBillId);
    if (pendingRecurringBillId === editingBillId) pendingRecurringBillId = null;
    if (activeBillId === editingBillId) activeBillId = null;
    saveState();
    closeSheet();
    render();
    showToast(`${deletedBill.name} deleted.`, {
      undo: () => {
        replaceOrInsertBill(deletedBill);
        pendingRecurringBillId = previousPending;
        activeBillId = previousActive;
        saveState();
        render();
        showToast(`${deletedBill.name} restored.`);
      }
    });
  });

  document.querySelector("#closeSheet").addEventListener("click", closeSheet);
  document.querySelector("#closeSettingsSheet").addEventListener("click", closeSettingsSheet);
  document.querySelector("#closeActionSheet").addEventListener("click", () => closeActionSheet());
  backdrop.addEventListener("click", closeAllSheets);
}

function render() {
  if (activeBillId) {
    renderBillDetail();
  } else if (activeTab === "bills") {
    renderBills();
  } else if (activeTab === "expenses") {
    renderExpenses();
  } else if (activeTab === "calendar") {
    renderCalendar();
  } else if (activeTab === "insights") {
    renderInsights();
  } else {
    renderHome();
  }
  tabs.forEach((tab) => tab.classList.toggle("is-active", !activeBillId && tab.dataset.tab === activeTab));
  if (tabbar) tabbar.hidden = Boolean(activeBillId);
  updateAppBadge();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeTab = tab.dataset.tab;
    activeBillId = null;
    render();
  });
});

const themePreferenceMedia = window.matchMedia?.("(prefers-color-scheme: light)");
const handleThemePreferenceChange = () => {
  if (settings.theme === "system") applyTheme();
};
if (themePreferenceMedia?.addEventListener) {
  themePreferenceMedia.addEventListener("change", handleThemePreferenceChange);
} else if (themePreferenceMedia?.addListener) {
  themePreferenceMedia.addListener(handleThemePreferenceChange);
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").catch((error) => {
      console.warn("Service worker registration skipped", error);
    });
  });
}

loadState();
setupForm();
setupExpenseForm();
setupAccessibility();
render();
