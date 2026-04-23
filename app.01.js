const DEMO_MODE = false;
const DEMO_DATE = "2026-04-19";
const STORAGE_KEY = "upnextbudgeting:v1";
const PUSH_REMINDER_DAYS = 5;
const SUPABASE_CONFIG = {
  url: "",
  anonKey: "",
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

let categories = [
  { name: "Home", color: "#5cae9f", planned: 160000, assigned: 141500 },
  { name: "Utilities", color: "#e38a7f", planned: 36000, assigned: 25370 },
  { name: "Phone & internet", color: "#6c98c6", planned: 22000, assigned: 15000 },
  { name: "Vehicle", color: "#8f87cf", planned: 28000, assigned: 17100 },
  { name: "Insurance", color: "#b17ca0", planned: 50000, assigned: 42000 },
  { name: "Transport", color: "#86a95f", planned: 24000, assigned: 22000 },
  { name: "Subscriptions", color: "#d890ba", planned: 7000, assigned: 3050 },
  { name: "Wellness", color: "#7bbf9c", planned: 12000, assigned: 7000 },
  { name: "Loans", color: "#c7a64d", planned: 56000, assigned: 37500 },
  { name: "School", color: "#70a0a8", planned: 30000, assigned: 18000 },
  { name: "Medical", color: "#e39a70", planned: 16000, assigned: 12000 },
  { name: "Groceries", color: "#a7b86f", planned: 46000, assigned: 42000 },
  { name: "Savings", color: "#5d9fb0", planned: 45000, assigned: 45000 },
  { name: "Tax planning", color: "#9ba566", planned: 24000, assigned: 18000 }
];

const categoryColors = ["#5cae9f", "#e38a7f", "#6c98c6", "#8f87cf", "#b17ca0", "#86a95f", "#d890ba", "#7bbf9c", "#c7a64d", "#70a0a8", "#e39a70", "#a7b86f", "#5d9fb0", "#9ba566"];

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

let bills = [
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
];

let selectedBudgetCategory = categories[0].name;
const app = document.querySelector("#app");
const tabs = document.querySelectorAll(".tab");
const sheet = document.querySelector("#quickSheet");
const settingsSheet = document.querySelector("#settingsSheet");
const settingsContent = document.querySelector("#settingsContent");
const printExport = document.querySelector("#printExport");
const backdrop = document.querySelector("#sheetBackdrop");
const billForm = document.querySelector("#billForm");
const presetRail = document.querySelector("#presetRail");
const billName = document.querySelector("#billName");
const billAmount = document.querySelector("#billAmount");
const billDate = document.querySelector("#billDate");
const billCategory = document.querySelector("#billCategory");
const billRepeat = document.querySelector("#billRepeat");
const billPaid = document.querySelector("#billPaid");
const paidRow = document.querySelector("#paidRow");
const deleteBillButton = document.querySelector("#deleteBill");
let activeTab = "upcoming";
let presetsOpen = false;
let selectedHistoryMonth = "2026-04";
let visibleCalendarMonth = "2026-04";
let editingBillId = null;
let pendingRecurringBillId = null;
let lastTrigger = null;
let settings = {
  initialized: true,
  reminderDays: 3,
  notificationToken: "",
  pushEnabled: false,
  pushEndpoint: "",
  pushStatus: "Ready",
  lastPushSync: ""
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

function parseDate(value) {
  return new Date(`${value}T12:00:00`);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthKey(value) {
  return value.slice(0, 7);
}

function monthLabel(key) {
  return monthFormat.format(new Date(`${key}-01T12:00:00`));
}

function shiftMonth(key, offset) {
  const date = new Date(`${key}-01T12:00:00`);
  date.setMonth(date.getMonth() + offset);
  return toDateInputValue(date).slice(0, 7);
}

function getAvailableMonths() {
  return [...new Set([...bills.map((bill) => monthKey(bill.due)), "2026-04"])]
    .sort();
}

function getMonthBills(key) {
  return sortBills(bills.filter((bill) => monthKey(bill.due) === key));
}

function getMonthSummary(key) {
  const items = getMonthBills(key);
  const total = items.reduce((sum, bill) => sum + bill.amount, 0);
  const paid = items.filter((bill) => bill.paid).reduce((sum, bill) => sum + bill.amount, 0);
  const unpaidItems = items.filter((bill) => !bill.paid);
  const overdueItems = unpaidItems.filter((bill) => daysUntil(bill.due) < 0);
  return { items, total, paid, unpaidItems, overdueItems };
}

function getReminderItems() {
  return sortBills(bills.filter((bill) => {
    if (bill.paid) return false;
    const days = daysUntil(bill.due);
    return days < 0 || days <= settings.reminderDays;
  }));
}

function getPushReminderItems() {
  return sortBills(bills.filter((bill) => {
    if (bill.paid) return false;
    const days = daysUntil(bill.due);
    return days >= 0 && days <= PUSH_REMINDER_DAYS;
  }));
}

function pushSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
