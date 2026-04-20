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
]);

let categories = starterCategories.map(cloneCategory);

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
const starterBillIds = new Set(starterBills.map((bill) => bill.id));
const starterCategoryNames = new Set(starterCategories.map((category) => category.name));

let selectedBudgetCategory = categories[0].name;
const themeColorMeta = document.querySelector("meta[name='theme-color']");
const app = document.querySelector("#app");
const tabs = document.querySelectorAll(".tab");
const sheet = document.querySelector("#quickSheet");
const settingsSheet = document.querySelector("#settingsSheet");
const dayPickerSheet = document.querySelector("#dayPickerSheet");
const settingsContent = document.querySelector("#settingsContent");
const dayPickerContent = document.querySelector("#dayPickerContent");
const printExport = document.querySelector("#printExport");
const toastRegion = document.querySelector("#toastRegion");
const MAX_TOASTS = 3;
const toastTimers = new WeakMap();
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
  lastPushSync: "",
  theme: "system"
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

function cloneCategory(category) {
  return {
    name: category.name,
    color: category.color,
    planned: category.planned,
    assigned: category.assigned
  };
}

function cloneBill(bill) {
  return { ...bill };
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

function validTheme(value) {
  return ["system", "dark", "light"].includes(value) ? value : "system";
}

function resolvedTheme() {
  const theme = validTheme(settings.theme);
  if (theme !== "system") return theme;
  const media = window.matchMedia?.("(prefers-color-scheme: light)");
  return media?.matches ? "light" : "dark";
}

function applyTheme() {
  settings.theme = validTheme(settings.theme);
  const theme = resolvedTheme();
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = settings.theme;
  themeColorMeta?.setAttribute("content", theme === "light" ? "#edf0eb" : "#080b12");
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

function pushSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    reminderDays: PUSH_REMINDER_DAYS,
    bills: bills.map((bill) => ({
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

function inferRepeat(bill) {
  const normalized = `${bill.name} ${bill.category}`.toLowerCase();
  if (normalized.includes("property tax") || normalized.includes("insurance") || normalized.includes("fitness") || normalized.includes("registration")) return "yearly";
  if (normalized.includes("groceries") || normalized.includes("transport")) return "none";
  if (normalized.includes("rent") || normalized.includes("jps") || normalized.includes("nwc") || normalized.includes("internet") || normalized.includes("netflix") || normalized.includes("spotify") || normalized.includes("gym") || normalized.includes("loan") || normalized.includes("slb")) return "monthly";
  return bill.repeat || "none";
}

function advanceDueDate(value, repeat) {
  const next = parseDate(value);
  if (repeat === "monthly") next.setMonth(next.getMonth() + 1);
  if (repeat === "quarterly") next.setMonth(next.getMonth() + 3);
  if (repeat === "yearly") next.setFullYear(next.getFullYear() + 1);
  return toDateInputValue(next);
}

function createNextBillFrom(bill) {
  const repeat = bill.repeat || "none";
  if (repeat === "none") return null;
  return {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name: bill.name,
    category: bill.category,
    amount: bill.amount,
    due: advanceDueDate(bill.due, repeat),
    paid: false,
    repeat
  };
}

function normalizeBill(bill) {
  return {
    id: bill.id || Date.now() + Math.floor(Math.random() * 100000),
    name: bill.name || "Untitled bill",
    category: bill.category || categories[0]?.name || "Home",
    amount: cleanAmount(bill.amount),
    due: bill.due || toDateInputValue(today),
    paid: Boolean(bill.paid),
    repeat: ["none", "monthly", "quarterly", "yearly"].includes(bill.repeat) ? bill.repeat : inferRepeat(bill)
  };
}

function isValidState(state) {
  return state &&
    Array.isArray(state.bills) &&
    Array.isArray(state.categories) &&
    state.bills.every((bill) => bill && typeof bill.name === "string" && typeof bill.due === "string") &&
    state.categories.every((category) => category && typeof category.name === "string");
}

function appState() {
  return {
    version: 1,
    savedAt: new Date().toISOString(),
    bills,
    categories,
    settings,
    selectedBudgetCategory,
    selectedHistoryMonth,
    visibleCalendarMonth,
    metadata: {
      starterDataLoaded: true
    }
  };
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
    });
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      bills = bills.map(normalizeBill);
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
    selectedBudgetCategory = categories.some((category) => category.name === state.selectedBudgetCategory) ? state.selectedBudgetCategory : categories[0]?.name;
    ensureCategorySafety();
    selectedHistoryMonth = state.selectedHistoryMonth || selectedHistoryMonth;
    visibleCalendarMonth = state.visibleCalendarMonth || visibleCalendarMonth;
  } catch (error) {
    console.warn("Could not load saved UpNextBudgeting state", error);
    bills = bills.map(normalizeBill);
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
    color: "#8fd5c6",
    planned: 0,
    assigned: 0
  };
}

function ensureCategorySafety() {
  if (!categories.length) categories = [{ name: "General", color: "#8fd5c6", planned: 0, assigned: 0 }];
  const fallback = defaultCategory().name;
  bills = bills.map((bill) => categories.some((category) => category.name === bill.category) ? bill : { ...bill, category: fallback });
  selectedBudgetCategory = categories.some((category) => category.name === selectedBudgetCategory) ? selectedBudgetCategory : fallback;
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

function statusClass(bill) {
  if (bill.paid) return "is-paid";
  const days = daysUntil(bill.due);
  if (days < 0) return "is-overdue";
  if (days <= 1) return "is-tomorrow";
  if (days <= settings.reminderDays) return "is-soon";
  return "is-scheduled";
}

function monthName(date = today) {
  return new Intl.DateTimeFormat("en-JM", { month: "long", year: "numeric" }).format(date);
}

function render() {
  if (activeTab === "calendar") renderCalendar();
  if (activeTab === "budget") renderBudget();
  if (activeTab === "upcoming") renderUpcoming();
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.tab === activeTab));
  updateAppBadge();
}

function renderUpcoming() {
  const unpaid = sortBills(bills.filter((bill) => !bill.paid));
  const nextThree = unpaid.slice(0, 3);
  const overdueCount = unpaid.filter((bill) => daysUntil(bill.due) < 0).length;
  const moreThisMonth = unpaid.filter((bill) => {
    const due = parseDate(bill.due);
    return due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear();
  }).length - nextThree.filter((bill) => parseDate(bill.due).getMonth() === today.getMonth()).length;
  const nextCheckDate = parseDate(nextThree[0]?.due || today.toISOString().slice(0, 10));

  app.innerHTML = `
    <header class="topbar home-hero home-reveal" style="--delay: 0ms">
      <div class="brand-line">
        <img class="brandmark" src="assets/icon.svg" alt="">
        <div class="hero-copy">
          <p class="kicker">UpNextBudgeting</p>
          <p class="welcome-line">Welcome back, Marshall.</p>
          <h1>Due next</h1>
          <p class="hero-subtitle">Three bills need your attention first.</p>
        </div>
      </div>
      <button class="icon-button primary-cta" id="openSheet" type="button" aria-label="Add a bill">
        ${icon("plus")}
        <span>Add bill</span>
      </button>
    </header>

    <section class="attention-summary home-reveal" aria-label="Bill summary" style="--delay: 45ms">
      <article class="summary-metric ${overdueCount ? "is-overdue" : ""}">
        <span>Overdue</span>
        <strong>${overdueCount}</strong>
      </article>
      <article class="summary-metric">
        <span>This month</span>
        <strong>${Math.max(moreThisMonth, 0)} more</strong>
      </article>
      <article class="summary-metric">
        <span>Next check</span>
        <strong>${dateFormat.format(nextCheckDate)}</strong>
      </article>
    </section>

    <section class="due-stack" aria-label="Next unpaid bills">
      ${nextThree.map((bill, index) => renderBillCard(bill, index)).join("")}
    </section>

    ${renderRecurringPrompt()}

    ${renderReminderStrip()}

    <section class="planning-layer home-reveal" style="--delay: 260ms" aria-label="Planning notes">
    <aside class="notice-panel guidance-panel">
      <span class="notice-mark">${icon("alert")}</span>
      <div>
        <h3>Property tax stays visible</h3>
        <p class="small-note">Due April 1 yearly in Jamaica. Full, half-yearly, or quarterly planning is supported, with April 30 as the first-payment warning date.</p>
      </div>
    </aside>

    <section class="preset-disclosure">
      <button class="disclosure-button" id="togglePresets" type="button" aria-expanded="${presetsOpen}">
        <span>
          <span class="mini-label">Memory prompts</span>
          <strong>Preset reminders</strong>
        </span>
        <span class="disclosure-count">${presets.length}</span>
        <span class="disclosure-arrow ${presetsOpen ? "is-open" : ""}" aria-hidden="true">${icon("chevron")}</span>
      </button>
      <div class="preset-panel ${presetsOpen ? "is-open" : ""}" aria-hidden="${!presetsOpen}">
        <section class="preset-grid" aria-label="Suggested Jamaica-first bill types">
          ${presets.slice(0, 6).map(renderPresetCard).join("")}
        </section>
      </div>
    </section>
    </section>
  `;

  document.querySelector("#openSheet").addEventListener("click", () => openSheet());
  document.querySelector("#togglePresets").addEventListener("click", () => {
    presetsOpen = !presetsOpen;
    render();
  });
  document.querySelector("#createNextBill")?.addEventListener("click", () => {
    const bill = bills.find((item) => item.id === pendingRecurringBillId);
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
  });
  document.querySelector("#dismissRecurring")?.addEventListener("click", () => {
    pendingRecurringBillId = null;
    saveState();
    render();
    showToast("Recurring prompt skipped.");
  });
  document.querySelectorAll("[data-paid]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const bill = bills.find((item) => item.id === Number(button.dataset.paid));
      if (bill) {
        const previousPending = pendingRecurringBillId;
        bill.paid = true;
        pendingRecurringBillId = bill.repeat && bill.repeat !== "none" ? bill.id : null;
        saveState();
        showToast(`${bill.name} marked paid.`, {
          undo: () => {
            const current = bills.find((item) => item.id === bill.id);
            if (!current) return;
            current.paid = false;
            pendingRecurringBillId = previousPending;
            saveState();
            render();
            showToast(`${bill.name} marked unpaid.`);
          }
        });
      }
      render();
    });
  });
  bindEditableBillCards();
}

function renderReminderStrip() {
  const reminders = getReminderItems();
  if (!reminders.length) return "";
  const overdue = reminders.filter((bill) => daysUntil(bill.due) < 0).length;
  const dueSoon = reminders.length - overdue;
  return `
    <section class="reminder-strip home-reveal" aria-label="Due reminders" style="--delay: 220ms">
      <span class="notice-mark">${icon("alert")}</span>
      <div>
        <strong>${overdue ? `${overdue} overdue` : `${dueSoon} due soon`}</strong>
        <p class="small-note">${reminders.slice(0, 2).map((bill) => bill.name).join(" and ")} need attention within ${settings.reminderDays} days.</p>
      </div>
    </section>
  `;
}

function renderBillCard(bill, index = 0) {
  const category = getCategory(bill.category);
  const overdue = !bill.paid && daysUntil(bill.due) < 0;
  const urgencyClass = statusClass(bill);
  return `
    <article class="bill-card home-reveal ${overdue ? "is-overdue" : ""}" style="--accent:${category.color}; --delay:${95 + index * 54}ms" data-edit-bill="${bill.id}" tabindex="0" role="button" aria-label="Edit ${bill.name}">
      <div class="bill-card-top">
        <h3>${bill.name}</h3>
        <span class="urgency-badge ${urgencyClass}">${statusText(bill)}</span>
      </div>
      <p class="amount">${money.format(bill.amount)}</p>
      <div class="bill-card-bottom">
        <div class="bill-meta">
          <span>${dateFormat.format(parseDate(bill.due))}</span>
          <span>${bill.category}</span>
        </div>
        <button class="mark-button" data-paid="${bill.id}" type="button">Mark paid</button>
      </div>
    </article>
  `;
}

function renderRecurringPrompt() {
  const bill = bills.find((item) => item.id === pendingRecurringBillId);
  if (!bill) return "";
  return `
    <section class="recurring-prompt home-reveal" aria-label="Recurring bill follow-up" style="--delay: 210ms">
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

function renderPresetCard(preset) {
  const category = getCategory(preset.category);
  return `
    <article class="preset-card" style="border-left: 5px solid ${category.color}">
      <strong>${preset.name}</strong>
      <p>${preset.note}</p>
    </article>
  `;
}

function renderCalendar() {
  const visibleMonth = new Date(`${visibleCalendarMonth}-01T12:00:00`);
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = visibleMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];

  for (let i = 0; i < firstWeekday; i += 1) days.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) days.push(day);

  const monthBills = sortBills(bills.filter((bill) => {
    const due = parseDate(bill.due);
    return due.getFullYear() === year && due.getMonth() === month;
  }));

  app.innerHTML = `
    <header class="topbar home-reveal">
      <div class="brand-line">
        <img class="brandmark" src="assets/icon.svg" alt="">
        <div>
          <p class="kicker">Due-date view</p>
          <h1>Calendar</h1>
        </div>
      </div>
      <button class="icon-button light" id="openSheet" type="button" aria-label="Add a bill">${icon("plus")}</button>
    </header>

    <div class="month-line calendar-controls home-reveal" style="--delay: 45ms">
      <button class="secondary-action month-nav" id="prevMonth" type="button" aria-label="Previous month">${icon("chevron")}</button>
      <h2>${monthName(visibleMonth)}</h2>
      <button class="secondary-action month-nav next" id="nextMonth" type="button" aria-label="Next month">${icon("chevron")}</button>
      <span class="status">${monthBills.filter((bill) => !bill.paid).length} unpaid</span>
    </div>

    <section class="calendar-grid home-reveal" aria-label="${monthName(visibleMonth)} calendar" style="--delay: 95ms">
      ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<div class="weekday">${day}</div>`).join("")}
      ${days.map((day, index) => renderCalendarDay(day, monthBills, index)).join("")}
    </section>

    <div class="section-heading home-reveal" style="--delay: 145ms">
      <h2>Agenda</h2>
      <span class="mini-label">${monthLabel(visibleCalendarMonth)}</span>
    </div>
    <section class="agenda-list">
      ${monthBills.map((bill, index) => renderAgendaCard(bill, index)).join("")}
    </section>
  `;

  document.querySelector("#openSheet").addEventListener("click", () => openSheet());
  document.querySelector("#prevMonth").addEventListener("click", () => {
    visibleCalendarMonth = shiftMonth(visibleCalendarMonth, -1);
    saveState();
    render();
  });
  document.querySelector("#nextMonth").addEventListener("click", () => {
    visibleCalendarMonth = shiftMonth(visibleCalendarMonth, 1);
    saveState();
    render();
  });
  bindCalendarDayEditing(monthBills);
  bindEditableBillCards();
}

function renderCalendarDay(day, monthBills, index = 0) {
  if (!day) return `<div class="calendar-day is-muted" aria-hidden="true"></div>`;
  const matches = monthBills.filter((bill) => parseDate(bill.due).getDate() === day);
  const hasOverdue = matches.some((bill) => !bill.paid && daysUntil(bill.due) < 0);
  const hasDueSoon = matches.some((bill) => !bill.paid && daysUntil(bill.due) >= 0 && daysUntil(bill.due) <= settings.reminderDays);
  const hasPaidOnly = matches.length && matches.every((bill) => bill.paid);
  const isToday = toDateInputValue(today) === `${visibleCalendarMonth}-${String(day).padStart(2, "0")}`;
  const category = matches[0] ? getCategory(matches[0].category) : null;
  return `
    <div class="calendar-day ${matches.length ? "has-bill" : ""} ${hasOverdue ? "has-overdue" : ""} ${hasDueSoon ? "has-due-soon" : ""} ${hasPaidOnly ? "has-paid-only" : ""} ${isToday ? "is-today" : ""}" style="--accent:${category?.color || "var(--teal)"}; --delay:${Math.min(index * 8, 220)}ms" ${matches.length ? `data-calendar-day="${day}" tabindex="0" role="button" aria-label="Edit bills due ${dateFormat.format(parseDate(`${visibleCalendarMonth}-${String(day).padStart(2, "0")}`))}"` : ""}>
      ${day}
      ${matches.length ? `<span class="dot" style="--accent:${category.color}"></span>` : ""}
    </div>
  `;
}

function renderAgendaCard(bill, index = 0) {
  const category = getCategory(bill.category);
  const state = statusClass(bill);
  return `
    <article class="agenda-card home-reveal ${state}" style="--accent:${category.color}; --delay:${185 + index * 42}ms" data-edit-bill="${bill.id}" tabindex="0" role="button" aria-label="Edit ${bill.name}">
      <div class="budget-line">
        <div>
          <p class="eyebrow">${longDateFormat.format(parseDate(bill.due))}</p>
          <h3 class="agenda-title">${bill.name}</h3>
        </div>
        <p class="amount">${money.format(bill.amount)}</p>
      </div>
      <div class="card-meta compact">
        <span class="urgency-badge ${state}">${bill.paid ? "Paid" : statusText(bill)}</span>
        <span class="small-note">${bill.category}</span>
      </div>
    </article>
  `;
}

function renderBudget() {
  const totalAssigned = categories.reduce((sum, category) => sum + category.assigned, 0);
  const totalPlanned = categories.reduce((sum, category) => sum + category.planned, 0);

  app.innerHTML = `
    <header class="topbar home-reveal">
      <div class="brand-line">
        <img class="brandmark" src="assets/icon.svg" alt="">
        <div>
          <p class="kicker">Light planning</p>
          <h1>Budget</h1>
        </div>
      </div>
      <div class="top-actions">
        <button class="icon-button light" id="openSettings" type="button" aria-label="Open settings">${icon("gear")}</button>
        <button class="icon-button light" id="openSheet" type="button" aria-label="Add a bill">${icon("plus")}</button>
      </div>
    </header>

    <section class="budget-total home-reveal" style="--delay: 45ms">
      <div>
        <p>Assigned this cycle</p>
        <strong>${money.format(totalAssigned)}</strong>
      </div>
      <span class="status">${totalPlanned ? Math.round((totalAssigned / totalPlanned) * 100) : 0}%</span>
    </section>

    <div class="section-heading home-reveal" style="--delay: 95ms">
      <h2>Categories</h2>
      <span class="mini-label">simple plan</span>
    </div>

    <section class="budget-list">
      ${categories.map((category, index) => renderBudgetCard(category, index)).join("")}
    </section>
  `;

  document.querySelector("#openSheet").addEventListener("click", () => openSheet());
  document.querySelector("#openSettings").addEventListener("click", openSettingsSheet);
}

function renderBudgetCard(category, index = 0) {
  const percent = category.planned ? Math.min(100, Math.round((category.assigned / category.planned) * 100)) : 0;
  const glyph = categoryIconName(category.name);
  return `
    <article class="budget-card home-reveal" style="--accent:${category.color}; --value:${percent}%; --delay:${135 + index * 34}ms">
      <div class="budget-line">
        <div class="bill-heading">
          <span class="category-glyph" aria-hidden="true">${icon(glyph)}</span>
          <div>
            <h3 class="budget-name">${category.name}</h3>
            <p class="small-note">${money.format(category.assigned)} assigned of ${money.format(category.planned)}</p>
          </div>
        </div>
        <span class="status">${percent}%</span>
      </div>
      <div class="meter" aria-hidden="true"><span></span></div>
    </article>
  `;
}

function openSheet(billId = null) {
  lastTrigger = document.activeElement;
  editingBillId = billId;
  const bill = bills.find((item) => item.id === billId);
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
    billPaid.checked = Boolean(bill.paid);
  } else {
    billForm.reset();
    syncBillCategoryOptions();
    billDate.value = toDateInputValue(today);
    billRepeat.value = "none";
    billPaid.checked = false;
  }
  sheet.hidden = false;
  backdrop.hidden = false;
  billName.focus();
}

function closeSheet() {
  sheet.hidden = true;
  if (settingsSheet.hidden && dayPickerSheet.hidden) backdrop.hidden = true;
  billForm.reset();
  editingBillId = null;
  deleteBillButton.hidden = true;
  paidRow.hidden = true;
  document.querySelector("#sheetTitle").textContent = "Add a bill";
  billForm.querySelector(".primary-action").textContent = "Add to Upcoming";
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
  if (sheet.hidden && dayPickerSheet.hidden) backdrop.hidden = true;
  lastTrigger?.focus?.();
}

function openDayPicker(day, monthBills) {
  const dayBills = sortBills(monthBills.filter((bill) => parseDate(bill.due).getDate() === day));
  if (!dayBills.length) return;
  if (dayBills.length === 1) {
    openSheet(dayBills[0].id);
    return;
  }
  lastTrigger = document.activeElement;
  const date = parseDate(`${visibleCalendarMonth}-${String(day).padStart(2, "0")}`);
  document.querySelector("#dayPickerTitle").textContent = longDateFormat.format(date);
  dayPickerContent.innerHTML = dayBills.map(renderDayPickerBill).join("");
  dayPickerSheet.hidden = false;
  backdrop.hidden = false;
  dayPickerSheet.querySelector("[data-day-picker-bill]")?.focus();
  dayPickerSheet.querySelectorAll("[data-day-picker-bill]").forEach((button) => {
    button.addEventListener("click", () => {
      const billId = Number(button.dataset.dayPickerBill);
      closeDayPicker(false);
      openSheet(billId);
    });
  });
}

function renderDayPickerBill(bill) {
  const category = getCategory(bill.category);
  const state = statusClass(bill);
  return `
    <button class="day-picker-item ${state}" type="button" data-day-picker-bill="${bill.id}" style="--accent:${category.color}">
      <span>
        <strong>${bill.name}</strong>
        <small>${bill.category} · ${statusText(bill)}</small>
      </span>
      <span>${money.format(bill.amount)}</span>
    </button>
  `;
}

function closeDayPicker(restoreFocus = true) {
  dayPickerSheet.hidden = true;
  dayPickerContent.innerHTML = "";
  if (sheet.hidden && settingsSheet.hidden) backdrop.hidden = true;
  if (restoreFocus) lastTrigger?.focus?.();
}

function bindEditableBillCards() {
  document.querySelectorAll("[data-edit-bill]").forEach((card) => {
    const edit = () => openSheet(Number(card.dataset.editBill));
    card.addEventListener("click", edit);
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        edit();
      }
    });
  });
}

function bindCalendarDayEditing(monthBills) {
  document.querySelectorAll("[data-calendar-day]").forEach((dayCell) => {
    const open = () => openDayPicker(Number(dayCell.dataset.calendarDay), monthBills);
    dayCell.addEventListener("click", open);
    dayCell.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  });
}

function closeAllSheets() {
  if (!sheet.hidden) closeSheet();
  if (!settingsSheet.hidden) closeSettingsSheet();
  if (!dayPickerSheet.hidden) closeDayPicker(false);
  backdrop.hidden = true;
}

function syncBillCategoryOptions(preferred = billCategory.value) {
  const fallback = categories[0]?.name || "";
  billCategory.innerHTML = categories.map((category) => `<option>${category.name}</option>`).join("");
  billCategory.value = categories.some((category) => category.name === preferred) ? preferred : fallback;
}

function renderSettingsContent() {
  const selected = getCategory(selectedBudgetCategory);
  const months = getAvailableMonths();
  if (!months.includes(selectedHistoryMonth)) selectedHistoryMonth = months[months.length - 1] || "2026-04";
  const summary = getMonthSummary(selectedHistoryMonth);
  settingsContent.innerHTML = `
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Appearance</h3>
        <span class="mini-label">theme</span>
      </div>
      <p class="settings-copy">Choose the glass theme, or let the app follow your device.</p>
      <label>
        <span>Theme</span>
        <select id="themePreference">
          <option value="system" ${settings.theme === "system" ? "selected" : ""}>System</option>
          <option value="dark" ${settings.theme === "dark" ? "selected" : ""}>Dark</option>
          <option value="light" ${settings.theme === "light" ? "selected" : ""}>Light</option>
        </select>
      </label>
    </section>
    <section class="settings-section">
      <div class="section-heading compact">
        <h3>Monthly history</h3>
        <span class="mini-label">export</span>
      </div>
      <p class="settings-copy">Choose a month, review what happened, then export the record.</p>
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
      <p class="settings-copy">Show overdue and due-soon reminders when you open Upcoming.</p>
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
        <h3>Budget categories</h3>
        <span class="mini-label">active</span>
      </div>
      <p class="settings-copy">Adjust planned amounts, add a category, or remove one from your light budget plan.</p>
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
    <section class="settings-section quiet">
      <p class="mini-label">Later</p>
      <p class="settings-copy">More app settings can live here later.</p>
    </section>
  `;
  setupAppearanceControls();
  setupMonthlyHistory();
  setupReminderSettings();
  setupPushControls();
  setupBackupControls();
  setupStarterClearControls();
  setupBudgetControls();
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
        <span>${bill.paid ? "Paid" : statusText(bill)}</span>
      </div>
    </div>
  `;
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
  });

  billForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const wasEditing = Boolean(editingBillId);
    const payload = {
      name: billName.value.trim(),
      category: billCategory.value,
      amount: cleanAmount(billAmount.value),
      due: billDate.value,
      paid: editingBillId ? billPaid.checked : false,
      repeat: billRepeat.value
    };
    if (editingBillId) {
      const bill = bills.find((item) => item.id === editingBillId);
      if (bill) Object.assign(bill, payload);
    } else {
      bills.push({ id: Date.now(), ...payload });
    }
    saveState();
    closeSheet();
    activeTab = "upcoming";
    render();
    showToast(wasEditing ? `${payload.name} updated.` : `${payload.name} added.`);
  });

  deleteBillButton.addEventListener("click", () => {
    if (!editingBillId) return;
    const bill = bills.find((item) => item.id === editingBillId);
    if (!bill || !confirm(`Delete ${bill.name}?`)) return;
    const deletedBill = cloneBill(bill);
    const previousPending = pendingRecurringBillId;
    bills = bills.filter((item) => item.id !== editingBillId);
    pendingRecurringBillId = pendingRecurringBillId === editingBillId ? null : pendingRecurringBillId;
    saveState();
    closeSheet();
    render();
    showToast(`${deletedBill.name} deleted.`, {
      undo: () => {
        if (!bills.some((item) => item.id === deletedBill.id)) bills.push(cloneBill(deletedBill));
        pendingRecurringBillId = previousPending;
        saveState();
        render();
        showToast(`${deletedBill.name} restored.`);
      }
    });
  });

  document.querySelector("#closeSheet").addEventListener("click", closeSheet);
  document.querySelector("#closeSettingsSheet").addEventListener("click", closeSettingsSheet);
  document.querySelector("#closeDayPickerSheet").addEventListener("click", closeDayPicker);
  backdrop.addEventListener("click", closeAllSheets);
}

function cleanAmount(value) {
  return Math.max(0, Number(String(value).replace(/[^0-9.]/g, "")) || 0);
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
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
    bill.paid ? "Paid" : statusText(bill),
    "",
    "",
    "",
    ""
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
                <td>${bill.paid ? "Paid" : statusText(bill)}</td>
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
  selectedBudgetCategory = categories.some((category) => category.name === state.selectedBudgetCategory) ? state.selectedBudgetCategory : categories[0]?.name;
  selectedHistoryMonth = state.selectedHistoryMonth || selectedHistoryMonth;
  visibleCalendarMonth = state.visibleCalendarMonth || visibleCalendarMonth;
  pendingRecurringBillId = null;
  ensureCategorySafety();
  applyTheme();
  syncBillCategoryOptions(selectedBudgetCategory);
  saveState();
  render();
  renderSettingsContent();
  showToast("Backup restored.");
}

function setupAppearanceControls() {
  const themePreference = document.querySelector("#themePreference");
  themePreference.addEventListener("change", () => {
    settings.theme = validTheme(themePreference.value);
    applyTheme();
    saveState(false);
    showToast(`${themePreference.options[themePreference.selectedIndex].text} theme applied.`);
  });
}

function snapshotForUndo() {
  return {
    bills: bills.map(cloneBill),
    categories: categories.map(cloneCategory),
    selectedBudgetCategory,
    selectedHistoryMonth,
    visibleCalendarMonth,
    pendingRecurringBillId
  };
}

function restoreSnapshot(snapshot, message = "Restored.") {
  bills = snapshot.bills.map(cloneBill);
  categories = snapshot.categories.map(cloneCategory);
  selectedBudgetCategory = snapshot.selectedBudgetCategory;
  selectedHistoryMonth = snapshot.selectedHistoryMonth;
  visibleCalendarMonth = snapshot.visibleCalendarMonth;
  pendingRecurringBillId = snapshot.pendingRecurringBillId;
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
  }
  if (mode === "categories" || mode === "both") {
    categories = categories.filter((category) => !starterCategoryNames.has(category.name));
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

function setupMonthlyHistory() {
  const historyMonth = document.querySelector("#historyMonth");
  const exportCsvButton = document.querySelector("#exportCsv");
  const exportPdfButton = document.querySelector("#exportPdf");

  historyMonth.addEventListener("change", () => {
    selectedHistoryMonth = historyMonth.value;
    saveState();
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

function activeSheet() {
  if (!dayPickerSheet.hidden) return dayPickerSheet;
  if (!settingsSheet.hidden) return settingsSheet;
  if (!sheet.hidden) return sheet;
  return null;
}

function setupAccessibility() {
  document.addEventListener("keydown", (event) => {
    const currentSheet = activeSheet();
    if (!currentSheet) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (currentSheet === dayPickerSheet) closeDayPicker();
      if (currentSheet === settingsSheet) closeSettingsSheet();
      if (currentSheet === sheet) closeSheet();
      return;
    }
    if (event.key !== "Tab") return;
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
    const selected = getCategory(editCategory.value);
    selected.planned = cleanAmount(editPlanned.value);
    selectedBudgetCategory = selected.name;
    syncBillCategoryOptions(selected.name);
    saveState();
    render();
    renderSettingsContent();
    showToast(`${selected.name} plan updated.`);
  });

  removeCategory.addEventListener("click", () => {
    if (categories.length <= 1) return;
    const snapshot = snapshotForUndo();
    const index = categories.findIndex((category) => category.name === editCategory.value);
    if (index < 0) return;
    const removedName = categories[index].name;
    categories.splice(index, 1);
    selectedBudgetCategory = categories[Math.max(0, index - 1)].name;
    ensureCategorySafety();
    syncBillCategoryOptions(selectedBudgetCategory);
    saveState();
    render();
    renderSettingsContent();
    showToast(`${removedName} removed.`, {
      undo: () => restoreSnapshot(snapshot, `${removedName} restored.`)
    });
  });

  addCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = newCategoryName.value.trim();
    if (!name) return;
    if (categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      showToast(`${name} already exists.`);
      return;
    }
    categories.push({
      name,
      color: categoryColors[categories.length % categoryColors.length],
      planned: cleanAmount(newCategoryAmount.value),
      assigned: 0
    });
    selectedBudgetCategory = name;
    syncBillCategoryOptions(name);
    saveState();
    render();
    renderSettingsContent();
    showToast(`${name} category added.`);
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeTab = tab.dataset.tab;
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
setupAccessibility();
render();
