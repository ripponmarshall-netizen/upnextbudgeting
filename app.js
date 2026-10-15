import {
  addDays,
  advanceDueDate,
  billSpentDate,
  categoryBreakdown,
  clampStartDay,
  daysBetween,
  getBudgetPeriod,
  isActiveBill,
  newId,
  openBillsFor,
  parseDate,
  parseMoneyInput,
  periodSummary,
  roundMoney,
  shiftPeriod,
  sortOpenBills,
  sumMoney,
  toDateInputValue,
  transactionsFor
} from "./core.js";
import { guessCategory, ingestAlerts, parseBankAlert, textId } from "./alerts.js";

const STORAGE_KEY = "upnextbudgeting:v1";
// The Gmail bridge URL and key live apart from the budget so backups never
// carry them.
const BRIDGE_KEY = "upnextbudgeting:gmail-bridge";
const BRIDGE_URL_RE = /^https:\/\/script\.google\.com\/(?:a\/macros\/[^/]+|macros)\/s\/[\w-]+\/exec$/;
const BRIDGE_SCRIPT = "integrations/gmail-bridge.gs";
const AUTO_SYNC_MS = 30 * 60 * 1000;
// Keys left behind by the retired Supabase sync; cleared once on load.
const LEGACY_SYNC_KEYS = ["upnextbudgeting:sync", "upnextbudgeting:supabase-auth"];
const APP_VERSION = "3.1";
const DEFAULT_SOURCES = ["Cash", "Debit card", "Credit card", "Bank transfer"];
const REPEATS = { none: "One-time", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };
const MAX_PERIOD_OFFSET = 1;

async function resetUpNextBrowserStateIfRequested() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") !== "1") return false;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BRIDGE_KEY);
    LEGACY_SYNC_KEYS.forEach((key) => localStorage.removeItem(key));
    sessionStorage.clear();
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key.includes("upnextbudgeting")).map((key) => caches.delete(key)));
    }
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch (error) {
    console.warn("Could not fully reset UpNextBudgeting browser state", error);
  }
  params.delete("reset");
  window.location.replace(`${window.location.pathname}${params.toString() ? `?${params}` : ""}${window.location.hash}`);
  return true;
}

const icons = {
  gear: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>`,
  check: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`,
  left: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>`,
  right: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>`,
  repeat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/></svg>`,
  close: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>`,
  spark: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 13.8 10.2 20.5 12 13.8 13.8 12 20.5 10.2 13.8 3.5 12 10.2 10.2z"/></svg>`
};

// New profiles start with empty plans: the user decides where income goes.
const STARTER_CATEGORIES = [
  ["Home", "#7c8cf8"], ["Utilities", "#f59e66"], ["Phone & internet", "#4cc3d9"], ["Groceries", "#5cc98a"],
  ["Transport", "#e5b931"], ["Vehicle", "#a78bfa"], ["Insurance", "#f47c7c"], ["Loans", "#60a5fa"],
  ["Subscriptions", "#e879c6"], ["Medical", "#fb923c"], ["Savings", "#34d399"], ["Other", "#94a3b8"]
];
const CATEGORY_COLORS = STARTER_CATEGORIES.map(([, color]) => color);

// Demo records shipped by earlier versions. Only used to offer a one-tap cleanup.
const LEGACY_SAMPLE_BILL_IDS = new Set([...Array.from({ length: 12 }, (_, i) => i + 1), ...Array.from({ length: 27 }, (_, i) => i + 101)]);
const LEGACY_SAMPLE_EXPENSE_IDS = new Set([3001, 3002, 3003, 3004, 3005]);

const PRESETS = [
  { name: "JPS electricity", category: "Utilities", amount: 18500, repeat: "monthly" },
  { name: "NWC water", category: "Utilities", amount: 6800, repeat: "monthly" },
  { name: "Rent", category: "Home", amount: 95000, repeat: "monthly" },
  { name: "Mortgage", category: "Home", amount: 135000, repeat: "monthly" },
  { name: "Internet", category: "Phone & internet", amount: 9500, repeat: "monthly" },
  { name: "Phone", category: "Phone & internet", amount: 5500, repeat: "monthly" },
  { name: "Property tax", category: "Home", amount: 18000, repeat: "yearly" },
  { name: "Vehicle insurance", category: "Insurance", amount: 42000, repeat: "yearly" },
  { name: "Vehicle fitness", category: "Vehicle", amount: 4500, repeat: "yearly" },
  { name: "Vehicle registration", category: "Vehicle", amount: 12600, repeat: "yearly" },
  { name: "Student loan / SLB", category: "Loans", amount: 14500, repeat: "monthly" },
  { name: "Credit union loan", category: "Loans", amount: 18000, repeat: "monthly" },
  { name: "Netflix", category: "Subscriptions", amount: 1850, repeat: "monthly" },
  { name: "Spotify", category: "Subscriptions", amount: 1200, repeat: "monthly" },
  { name: "Gym", category: "Other", amount: 7000, repeat: "monthly" }
];

const app = document.querySelector("#app");
const tabbar = document.querySelector("#tabbar");
const dockBar = tabbar.querySelector(".dock-bar");
const sheet = document.querySelector("#sheet");
const sheetTitle = document.querySelector("#sheetTitle");
const sheetBody = document.querySelector("#sheetBody");
const toastRegion = document.querySelector("#toasts");
const themeColorMeta = document.querySelector("meta[name='theme-color']");

let today = toDateInputValue(new Date());
let categories = [];
let bills = [];
let expenses = [];
let settings = defaultSettings();
let alerts = emptyAlerts();
let syncing = false;

const ui = {
  tab: initialTab(),
  offset: 0,
  billsView: "upcoming",
  search: "",
  category: "All",
  lastCategory: "",
  claudeFocus: "review",
  sheet: null
};

/* ---------- formatting ---------- */

// Amounts read "J$12,845", the way Jamaican banks and shops write them.
const money0 = new Intl.NumberFormat("en-JM", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat("en-JM", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inputMoney = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayMonth = new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "short" });
const weekdayDate = new Intl.DateTimeFormat("en-JM", { weekday: "long", day: "numeric", month: "short" });

function money(value) {
  const n = roundMoney(value);
  const abs = Math.abs(n);
  return `${n < 0 ? "−" : ""}J$${(Number.isInteger(abs) ? money0 : money2).format(abs)}`;
}

// The big figure: a small J$, the dollars, then small cents.
function heroMoney(value) {
  const n = roundMoney(value);
  const [whole, cents] = money2.format(Math.abs(n)).split(".");
  return `${n < 0 ? "−" : ""}<span class="cur">J$</span>${whole}<span class="cents">.${cents}</span>`;
}

function formatMoneyInput(value) {
  const n = parseMoneyInput(value);
  return n ? inputMoney.format(n) : "";
}

function shortDate(value) {
  return dayMonth.format(parseDate(value));
}

function periodLabel(period) {
  return `${shortDate(period.startDate)} – ${shortDate(period.endDate)}`;
}

function dueLabel(bill) {
  if (bill.paid) return `Paid · ${shortDate(bill.due)}`;
  const days = daysBetween(today, bill.due);
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  if (days <= 14) return `Due in ${days} days`;
  return `Due ${shortDate(bill.due)}`;
}

function dueTone(bill) {
  if (bill.paid) return "";
  const days = daysBetween(today, bill.due);
  if (days < 0) return "is-danger";
  if (days <= settings.reminderDays) return "is-warning";
  return "";
}

function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Category colors come from storage and imported backups. Only allow
// plain color shapes so a crafted value cannot break out of a style attribute.
const CSS_COLOR_RE = /^(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|(?:rgb|rgba|hsl|hsla)\(\s*[\d.,%\s/-]+\s*\))$/;
function safeCssColor(value, fallback = "#94a3b8") {
  const text = String(value ?? "").trim();
  return CSS_COLOR_RE.test(text) ? text : fallback;
}

function nowIso() {
  return new Date().toISOString();
}

function slugify(value) {
  return String(value || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "item";
}

function makeSeriesKey(source) {
  return `${slugify(source?.name)}::${slugify(source?.category || "general")}`;
}

/* ---------- model ---------- */

function defaultSettings() {
  return {
    initialized: true,
    reminderDays: 3,
    theme: "system",
    profile: { onboardingComplete: false },
    cashflow: normalizeCashflowSettings({ monthlyStartingBalance: 0 })
  };
}

function validTheme(value) {
  // "pastel" was retired; fold it into light.
  if (value === "pastel") return "light";
  return ["system", "dark", "light"].includes(value) ? value : "system";
}

function normalizeCashflowSettings(source = {}) {
  return {
    ...source,
    monthlyStartingBalance: parseMoneyInput(source.monthlyStartingBalance ?? 0),
    safeSpendBuffer: parseMoneyInput(source.safeSpendBuffer ?? 0),
    budgetPeriodStartDay: clampStartDay(source.budgetPeriodStartDay),
    paymentSources: Array.isArray(source.paymentSources) && source.paymentSources.length ? source.paymentSources : DEFAULT_SOURCES
  };
}

function normalizeActivity(events) {
  if (!Array.isArray(events)) return [];
  return events.filter((event) => event && typeof event.type === "string").map((event) => ({ ...event, at: event.at || nowIso() }));
}

function normalizeBill(bill) {
  const due = bill.due || today;
  const paid = Boolean(bill.paid);
  const createdAt = bill.createdAt || bill.updatedAt || nowIso();
  return {
    id: bill.id ?? newId(),
    name: String(bill.name || "Untitled bill"),
    category: bill.category || categories[0]?.name || "Other",
    amount: parseMoneyInput(bill.amount),
    due,
    paid,
    repeat: REPEATS[bill.repeat] ? bill.repeat : "none",
    propertyTaxPlan: ["full", "half-yearly", "quarterly"].includes(bill.propertyTaxPlan) ? bill.propertyTaxPlan : "full",
    seriesKey: bill.seriesKey || makeSeriesKey(bill),
    archived: Boolean(bill.archived),
    archivedAt: bill.archivedAt || null,
    completedAt: paid ? bill.completedAt || `${due}T12:00:00` : null,
    createdAt,
    updatedAt: bill.updatedAt || createdAt,
    deletedAt: bill.deletedAt || null,
    activity: normalizeActivity(bill.activity)
  };
}

function normalizeExpense(expense) {
  const createdAt = expense.createdAt || nowIso();
  return {
    id: expense.id ?? newId(),
    amount: parseMoneyInput(expense.amount),
    category: expense.category || categories[0]?.name || "Other",
    merchant: String(expense.merchant || expense.note || expense.category || "Expense"),
    note: expense.note || "",
    date: expense.date || today,
    paymentSource: expense.paymentSource || settings.cashflow.paymentSources[0] || "Cash",
    source: expense.source === "alert" ? "alert" : "",
    createdAt,
    updatedAt: expense.updatedAt || createdAt,
    deletedAt: expense.deletedAt || null
  };
}

function emptyAlerts() {
  return { pending: [], seen: [], lastSyncAt: null };
}

// Alerts waiting for review, plus ids already handled so a sync never
// offers the same email twice.
function normalizeAlerts(source) {
  if (!source || typeof source !== "object") return emptyAlerts();
  const pending = (Array.isArray(source.pending) ? source.pending : [])
    .filter((alert) => alert && typeof alert.id === "string" && parseMoneyInput(alert.amount) > 0)
    .map((alert) => ({
      id: alert.id,
      bank: String(alert.bank || ""),
      merchant: String(alert.merchant || ""),
      amount: parseMoneyInput(alert.amount),
      currency: alert.currency === "USD" ? "USD" : "JMD",
      kind: "debit",
      date: /^\d{4}-\d{2}-\d{2}$/.test(alert.date) ? alert.date : "",
      snippet: String(alert.snippet || "").slice(0, 280)
    }));
  const seen = (Array.isArray(source.seen) ? source.seen : []).filter((id) => typeof id === "string").slice(-1500);
  return { pending, seen, lastSyncAt: typeof source.lastSyncAt === "string" ? source.lastSyncAt : null };
}

function normalizeCategory(category, index = 0, savedAt = nowIso()) {
  return {
    name: String(category.name),
    color: safeCssColor(category.color, CATEGORY_COLORS[index % CATEGORY_COLORS.length]),
    planned: parseMoneyInput(category.planned),
    assigned: parseMoneyInput(category.assigned),
    updatedAt: category.updatedAt || savedAt,
    deletedAt: category.deletedAt || null
  };
}

function starterCategories() {
  return STARTER_CATEGORIES.map(([name, color]) => ({ name, color, planned: 0, assigned: 0, updatedAt: nowIso(), deletedAt: null }));
}

function cloneBill(bill) {
  return { ...bill, activity: normalizeActivity(bill.activity) };
}

function appendActivity(bill, type, extra = {}) {
  bill.activity = [...normalizeActivity(bill.activity), { type, at: nowIso(), ...extra }];
  bill.updatedAt = nowIso();
}

function categoryByName(name) {
  return categories.find((category) => category.name === name);
}

function categoryColor(name) {
  return safeCssColor(categoryByName(name)?.color);
}

function fallbackCategoryName() {
  return (categoryByName("Other") || categories[0])?.name || "Other";
}

// Records pointing at a removed category move to the fallback.
function ensureCategorySafety() {
  if (!categories.length) categories = [normalizeCategory({ name: "Other", color: "#94a3b8" })];
  const names = new Set(categories.map((category) => category.name));
  const fallback = fallbackCategoryName();
  const stamp = nowIso();
  bills.forEach((bill) => {
    if (!names.has(bill.category)) Object.assign(bill, { category: fallback, updatedAt: stamp });
  });
  expenses.forEach((expense) => {
    if (!names.has(expense.category)) Object.assign(expense, { category: fallback, updatedAt: stamp });
  });
}

function billById(id) {
  return bills.find((bill) => String(bill.id) === String(id));
}

function expenseById(id) {
  return expenses.find((expense) => String(expense.id) === String(id));
}

function income() {
  return settings.cashflow.monthlyStartingBalance || 0;
}

function paydayStart() {
  return settings.cashflow.budgetPeriodStartDay;
}

function currentPeriod() {
  return getBudgetPeriod(paydayStart(), today);
}

function viewPeriod() {
  return shiftPeriod(currentPeriod(), ui.offset, paydayStart());
}

function activeBills() {
  return bills.filter(isActiveBill);
}

function hasCompletedOnboarding() {
  return Boolean(settings.profile?.onboardingComplete);
}

function hasSampleData() {
  return bills.some((bill) => LEGACY_SAMPLE_BILL_IDS.has(bill.id)) || expenses.some((expense) => LEGACY_SAMPLE_EXPENSE_IDS.has(expense.id));
}

/* ---------- persistence ---------- */

function appState() {
  return {
    version: 5,
    savedAt: nowIso(),
    bills,
    categories,
    expenses,
    alerts,
    expenseCategories: categories.map((category) => category.name),
    settings,
    metadata: { starterDataLoaded: true }
  };
}

function isValidState(state) {
  return state &&
    Array.isArray(state.bills) &&
    Array.isArray(state.categories) &&
    state.bills.every((bill) => bill && typeof bill.name === "string" && typeof bill.due === "string") &&
    state.categories.every((category) => category && typeof category.name === "string") &&
    (!state.expenses || Array.isArray(state.expenses));
}

function hydrate(state) {
  const fresh = defaultSettings();
  settings = { ...fresh, ...(state.settings || {}) };
  settings.theme = validTheme(settings.theme);
  settings.profile = { ...(settings.profile || {}), onboardingComplete: Boolean(settings.profile?.onboardingComplete) };
  settings.cashflow = normalizeCashflowSettings(settings.cashflow);
  settings.reminderDays = Math.max(0, Math.min(30, Math.round(Number(settings.reminderDays ?? 3)) || 0));
  ["notificationToken", "pushEnabled", "pushEndpoint", "pushStatus", "lastPushSync"].forEach((key) => delete settings[key]);
  categories = state.categories.map((category, index) => normalizeCategory(category, index, state.savedAt));
  bills = state.bills.map(normalizeBill);
  expenses = Array.isArray(state.expenses) ? state.expenses.map(normalizeExpense) : [];
  alerts = normalizeAlerts(state.alerts);
  ensureCategorySafety();
}

let quotaToastShown = false;
function reportQuotaFailure(error) {
  console.warn("UpNextBudgeting localStorage write failed", error);
  if (quotaToastShown) return;
  if (error && (error.name === "QuotaExceededError" || error.code === 22 || error.code === 1014)) {
    quotaToastShown = true;
    showToast("Storage is full. Export a backup from Settings.", { duration: 9000 });
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState()));
  } catch (error) {
    reportQuotaFailure(error);
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state = JSON.parse(raw);
      if (!isValidState(state)) throw new Error("Invalid saved state");
      hydrate(state);
    } else {
      categories = starterCategories();
    }
  } catch (error) {
    console.warn("Could not load saved UpNextBudgeting state", error);
    categories = starterCategories();
  }
  applyTheme();
}

/* ---------- mutations ---------- */

function commit() {
  saveState();
  render();
}

function removeBill(id) {
  const bill = billById(id);
  if (!bill) return null;
  bills = bills.filter((item) => item !== bill);
  return bill;
}

function restoreBill(snapshot) {
  const index = bills.findIndex((item) => String(item.id) === String(snapshot.id));
  if (index >= 0) bills[index] = cloneBill(snapshot);
  else bills.push(cloneBill(snapshot));
}

function removeExpense(id) {
  const expense = expenseById(id);
  if (!expense) return null;
  expenses = expenses.filter((item) => item !== expense);
  return expense;
}

function restoreExpense(snapshot) {
  expenses = expenses.filter((item) => String(item.id) !== String(snapshot.id));
  expenses.push({ ...snapshot });
}

// Paying a recurring bill queues its next occurrence so the plan never
// silently drops a monthly bill. Returns the new bill, or null.
function scheduleNext(bill) {
  if (bill.repeat === "none") return null;
  const due = advanceDueDate(bill.due, bill.repeat);
  const exists = activeBills().some((item) => item !== bill && item.seriesKey === bill.seriesKey && item.due === due);
  if (exists) return null;
  const next = normalizeBill({
    id: newId(),
    name: bill.name,
    category: bill.category,
    amount: bill.amount,
    due,
    repeat: bill.repeat,
    propertyTaxPlan: bill.propertyTaxPlan,
    seriesKey: bill.seriesKey,
    activity: [{ type: "created", at: nowIso(), note: "Next occurrence of a recurring bill." }]
  });
  bills.push(next);
  return next;
}

function markPaid(id) {
  const bill = billById(id);
  if (!bill || bill.paid) return;
  const before = cloneBill(bill);
  bill.paid = true;
  bill.completedAt = nowIso();
  appendActivity(bill, "paid");
  const next = scheduleNext(bill);
  commit();
  showToast(next ? `${bill.name} paid · next due ${shortDate(next.due)}` : `${bill.name} paid`, {
    undo: () => {
      restoreBill(before);
      if (next) removeBill(next.id);
      commit();
    }
  });
}

function payWithFlourish(button) {
  const id = button.dataset.id;
  const row = button.closest(".row");
  if (button.classList.contains("is-paying")) return;
  if (!row || reducedMotion()) return markPaid(id);
  button.classList.add("is-paying");
  button.setAttribute("aria-disabled", "true");
  window.setTimeout(() => {
    if (!row.isConnected || !row.animate) return markPaid(id);
    row.classList.add("is-leaving");
    const fold = row.animate(
      [{ height: `${row.offsetHeight}px`, opacity: 1 }, { height: "0px", opacity: 0 }],
      { duration: 220, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" }
    );
    fold.onfinish = () => markPaid(id);
  }, 380);
}

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function formError(form, message) {
  const el = form.querySelector(".form-error");
  if (el) {
    el.textContent = message;
    el.hidden = !message;
  }
  return false;
}

function saveBill(form) {
  const data = readForm(form);
  const name = String(data.name || "").trim();
  const amount = parseMoneyInput(data.amount);
  if (!name) return formError(form, "Give the bill a name.");
  if (!amount) return formError(form, "Enter an amount above zero.");
  if (!data.due) return formError(form, "Pick a due date.");
  const payload = { name, amount, due: data.due, category: data.category, repeat: REPEATS[data.repeat] ? data.repeat : "none" };
  const existing = billById(form.dataset.id);
  let next = null;
  if (existing) {
    const changed = ["name", "amount", "due", "category", "repeat"].some((key) => existing[key] !== payload[key]);
    Object.assign(existing, payload);
    const paid = data.paid === "on";
    if (paid !== existing.paid) {
      existing.paid = paid;
      existing.completedAt = paid ? nowIso() : null;
      appendActivity(existing, paid ? "paid" : "unpaid");
      // Ticking "Paid" here must roll a recurring bill forward, the same as
      // the tick box in a list does.
      if (paid) next = scheduleNext(existing);
    } else if (changed) {
      appendActivity(existing, "edited");
    }
  } else {
    bills.push(normalizeBill({
      id: newId(),
      ...payload,
      seriesKey: makeSeriesKey(payload),
      activity: [{ type: "created", at: nowIso() }]
    }));
  }
  closeSheet();
  commit();
  showToast(next ? `${name} paid · next due ${shortDate(next.due)}` : existing ? `${name} updated` : `${name} added`);
  return true;
}

function deleteBill(id) {
  const removed = removeBill(id);
  if (!removed) return;
  const snapshot = cloneBill(removed);
  closeSheet();
  commit();
  showToast(`${snapshot.name} deleted`, { undo: () => { restoreBill(snapshot); commit(); } });
}

function saveExpense(form) {
  const data = readForm(form);
  const amount = parseMoneyInput(data.amount);
  if (!amount) return formError(form, "Enter an amount above zero.");
  if (!data.date) return formError(form, "Pick a date.");
  const note = String(data.note || "").trim();
  const payload = { amount, category: data.category, merchant: note || data.category, note, date: data.date };
  ui.lastCategory = data.category;
  const existing = expenseById(form.dataset.id);
  const alertId = existing ? "" : String(data.alertId || "");
  const alertsBefore = alertId ? snapshotAlerts() : null;
  let created = null;
  if (existing) {
    Object.assign(existing, payload, { updatedAt: nowIso() });
  } else {
    created = normalizeExpense({ id: newId(), ...payload, source: alertId ? "alert" : "", createdAt: nowIso() });
    expenses.push(created);
    if (alertId) resolveAlert(alertId);
  }
  closeSheet();
  commit();
  showToast(existing ? "Expense updated" : `${money(amount)} · ${payload.merchant}`, created ? {
    undo: () => {
      removeExpense(created.id);
      if (alertsBefore) alerts = alertsBefore;
      commit();
    }
  } : {});
  return true;
}

/* ---------- bank alerts ---------- */

function snapshotAlerts() {
  return { pending: alerts.pending.map((alert) => ({ ...alert })), seen: [...alerts.seen], lastSyncAt: alerts.lastSyncAt };
}

function alertById(id) {
  return alerts.pending.find((alert) => alert.id === String(id));
}

// Handled (added or ignored): leave the queue, never come back.
function resolveAlert(id) {
  alerts.pending = alerts.pending.filter((alert) => alert.id !== id);
  if (!alerts.seen.includes(id)) alerts.seen = [...alerts.seen, id].slice(-1500);
}

function ignoreAlert(id) {
  const alert = alertById(id);
  if (!alert) return;
  const before = snapshotAlerts();
  resolveAlert(alert.id);
  if (ui.sheet) closeSheet();
  commit();
  showToast(`Ignored ${alert.merchant || "alert"}`, { undo: () => { alerts = before; commit(); } });
}

function draftFromAlert(alert) {
  return {
    alertId: alert.id,
    amount: alert.currency === "JMD" ? alert.amount : 0,
    foreign: alert.currency === "JMD" ? null : { currency: alert.currency, amount: alert.amount },
    merchant: alert.merchant,
    category: guessCategory(alert.merchant, expenses),
    date: alert.date && alert.date <= today ? alert.date : today,
    bank: alert.bank,
    snippet: alert.snippet
  };
}

function readPastedAlert(form) {
  const text = String(readForm(form).text || "").trim();
  if (!text) return formError(form, "Paste the alert text first.");
  const id = textId(text);
  if (alerts.seen.includes(id)) return formError(form, "You've already added or ignored this alert.");
  const alert = parseBankAlert({ id, date: nowIso(), body: text });
  if (!alert) return formError(form, "Couldn't find an amount in that text.");
  if (alert.kind === "credit") return formError(form, "That looks like money coming in, not spending.");
  stepSheet({ kind: "alert", draft: draftFromAlert(alert) });
  return true;
}

function loadBridge() {
  try {
    const value = JSON.parse(localStorage.getItem(BRIDGE_KEY) || "null");
    return value && BRIDGE_URL_RE.test(value.url) && value.key ? value : null;
  } catch {
    return null;
  }
}

function saveBridge(form) {
  const data = readForm(form);
  const url = String(data.url || "").trim();
  const key = String(data.key || "").trim();
  if (!BRIDGE_URL_RE.test(url)) return formError(form, "Paste the Web app URL from Apps Script. It ends in /exec.");
  if (!key) return formError(form, "Paste the key the setup function printed.");
  try {
    localStorage.setItem(BRIDGE_KEY, JSON.stringify({ url, key }));
  } catch (error) {
    reportQuotaFailure(error);
    return false;
  }
  renderSheet();
  syncAlerts();
  return true;
}

function disconnectBridge() {
  localStorage.removeItem(BRIDGE_KEY);
  renderSheet();
  render();
  showToast("Gmail disconnected. Queued alerts stay until you clear them.");
}

// Start from the current period on the first sync; afterwards overlap the
// last sync by a few days (ids stop duplicates) to catch late-arriving mail.
function syncSince() {
  const last = alerts.lastSyncAt ? Date.parse(alerts.lastSyncAt) : NaN;
  if (Number.isFinite(last)) return last - 3 * 86400000;
  return parseDate(currentPeriod().startDate).getTime() - 86400000;
}

async function syncAlerts({ quiet = false } = {}) {
  const bridge = loadBridge();
  if (!bridge || syncing) return;
  syncing = true;
  render();
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 20000);
  try {
    const url = new URL(bridge.url);
    url.searchParams.set("key", bridge.key);
    url.searchParams.set("since", String(syncSince()));
    const response = await fetch(url, { signal: controller.signal, cache: "no-store", credentials: "omit" });
    if (!response.ok) throw new Error(`The Gmail script answered ${response.status}.`);
    const data = await response.json();
    if (data?.error === "unauthorised") throw new Error("The key doesn't match the script. Run setup again and paste the new key.");
    if (!Array.isArray(data?.messages)) throw new Error("The Gmail script sent something unexpected.");
    const { pending, seen, counts } = ingestAlerts(alerts, data.messages);
    alerts = { pending, seen, lastSyncAt: nowIso() };
    saveState();
    if (counts.added) showToast(`${counts.added} new bank alert${counts.added === 1 ? "" : "s"} to review`);
    else if (!quiet) showToast("No new spending alerts");
  } catch (error) {
    if (!quiet) {
      // A redirect to Google's sign-in page fails CORS and surfaces as a TypeError.
      const message = error.name === "AbortError"
        ? "Gmail took too long. Try again."
        : error instanceof TypeError
          ? "Couldn't reach the script. Check the URL and that access is set to Anyone."
          : error.message;
      showToast(message, { duration: 8000 });
    }
  } finally {
    window.clearTimeout(timer);
    syncing = false;
    render();
  }
}

function maybeAutoSync() {
  if (!loadBridge() || !hasCompletedOnboarding()) return;
  const last = alerts.lastSyncAt ? Date.parse(alerts.lastSyncAt) : 0;
  if (Date.now() - last > AUTO_SYNC_MS) syncAlerts({ quiet: true });
}

/* ---------- ask Claude ---------- */

const CLAUDE_FOCUS = {
  review: {
    label: "Review",
    asks: [
      "Where is my spending drifting from plan this period, and what is driving it?",
      "Which two or three changes would free up the most money before payday?",
      "Flag anything that looks unusual, duplicated, or worth checking against my bank statement."
    ]
  },
  cut: {
    label: "Cut back",
    asks: [
      "Which categories and merchants cost me the most, and how much of that is optional?",
      "List repeat spending or subscriptions I could cancel or reduce, with the saving per month.",
      "Give me a realistic limit for each category for the rest of this period."
    ]
  },
  plan: {
    label: "Next period",
    asks: [
      "Suggest a plan per category for next period that adds up to my take-home pay and covers every bill first.",
      "Point out categories where my plan doesn't match what I actually spend.",
      "Suggest how much I could move to savings each period, and where it would come from."
    ]
  }
};

const PROMPT_TX_LIMIT = 150;

function claudePrompt(focusKey) {
  const focus = CLAUDE_FOCUS[focusKey] || CLAUDE_FOCUS.review;
  const period = currentPeriod();
  const last = shiftPeriod(period, -1, paydayStart());
  const s = periodSummary({ bills, expenses, income: income(), period, today });
  const { rows, totalPlanned } = categoryBreakdown({ categories, bills, expenses, period, today });
  const lastSpent = new Map(categoryBreakdown({ categories, bills, expenses, period: last, today }).rows.map((row) => [row.name, row.spent]));
  const open = sortOpenBills(openBillsFor(bills, period, today));
  const txs = transactionsFor({ bills, expenses, period });
  const active = rows.filter((row) => row.planned || row.spent || row.scheduled || lastSpent.get(row.name));
  return [
    "Help me with my personal budget. I live in Jamaica and all amounts are JMD. I budget payday to payday: each period runs from payday to the day before the next one.",
    "",
    `## This period: ${periodLabel(period)} (today is ${shortDate(today)}, ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} to payday)`,
    `- Take-home pay: ${money(s.income)}`,
    `- Spent so far: ${money(s.spent)} (expenses ${money(s.spentExpenses)}, bills paid ${money(s.spentBills)})`,
    `- Unpaid bills still due, including overdue: ${money(s.billsLeft)}`,
    `- Safe to spend until payday: ${money(s.safeToSpend)} (about ${money(s.perDay)} a day)`,
    `- Planned across categories: ${money(totalPlanned)}`,
    "",
    "## Categories: plan | spent | bills still due | left | spent last period",
    ...(active.length
      ? active.map((row) => `- ${row.name}: ${money(row.planned)} | ${money(row.spent)} | ${money(row.scheduled)} | ${money(row.remaining)} | ${money(lastSpent.get(row.name) || 0)}`)
      : ["- No plans or spending yet"]),
    "",
    "## Unpaid bills",
    ...(open.length
      ? open.map((bill) => `- ${bill.due} ${bill.name} (${bill.category}, ${REPEATS[bill.repeat].toLowerCase()}): ${money(bill.amount)}`)
      : ["- None"]),
    "",
    `## Transactions this period (${txs.length}): date | name | category | amount`,
    ...txs.slice(0, PROMPT_TX_LIMIT).map((tx) => `- ${tx.date} | ${tx.name} | ${tx.category}${tx.kind === "bill" ? " (bill)" : ""} | ${money(tx.amount)}`),
    ...(txs.length > PROMPT_TX_LIMIT ? [`- …and ${txs.length - PROMPT_TX_LIMIT} more not shown`] : []),
    ...(txs.length ? [] : ["- None yet"]),
    "",
    "## What I'd like",
    ...focus.asks.map((ask, index) => `${index + 1}. ${ask}`),
    "",
    "Use my numbers and be specific. Say what you're assuming and ask me if something is unclear. This is budgeting help, not investment advice."
  ].join("\n");
}

// Clipboard writes must happen inside the tap on iOS, so callers pass text
// they already have rather than awaiting a fetch first.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = Object.assign(document.createElement("textarea"), { value: text, readOnly: true });
    area.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    (sheet.open ? sheet : document.body).append(area);
    area.select();
    area.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}

async function copyClaudePrompt() {
  const text = sheetBody.querySelector("#claudePrompt")?.value || claudePrompt(ui.claudeFocus);
  const ok = await copyText(text);
  showToast(ok ? "Copied. Paste it into Claude." : "Couldn't copy. Select the text and copy it yourself.", { duration: 6000 });
}

let bridgeScriptText = "";
function prefetchBridgeScript() {
  if (bridgeScriptText) return;
  fetch(BRIDGE_SCRIPT).then((response) => (response.ok ? response.text() : "")).then((text) => { bridgeScriptText = text; }).catch(() => {});
}

async function copyBridgeScript() {
  if (!bridgeScriptText) {
    prefetchBridgeScript();
    showToast("Still loading the script. Tap again in a moment.");
    return;
  }
  const ok = await copyText(bridgeScriptText);
  showToast(ok ? "Script copied. Paste it into a new project at script.google.com." : "Couldn't copy the script.", { duration: 7000 });
}

function deleteExpense(id) {
  const removed = removeExpense(id);
  if (!removed) return;
  const snapshot = { ...removed };
  closeSheet();
  commit();
  showToast("Expense deleted", { undo: () => { restoreExpense(snapshot); commit(); } });
}

function snapshotAll() {
  return {
    bills: bills.map(cloneBill),
    expenses: expenses.map((expense) => ({ ...expense })),
    categories: categories.map((category) => ({ ...category }))
  };
}

function restoreAll(snapshot) {
  bills = snapshot.bills;
  expenses = snapshot.expenses;
  categories = snapshot.categories;
  commit();
}

function saveCategory(form) {
  const data = readForm(form);
  const name = String(data.name || "").trim();
  const planned = parseMoneyInput(data.planned);
  const originalName = form.dataset.name || "";
  if (!name) return formError(form, "Give the category a name.");
  const clash = categories.find((category) => category.name.toLowerCase() === name.toLowerCase() && category.name !== originalName);
  if (clash) return formError(form, `${clash.name} already exists.`);
  const existing = categoryByName(originalName);
  const stamp = nowIso();
  if (existing) {
    if (existing.name !== name) {
      bills.forEach((bill) => { if (bill.category === existing.name) Object.assign(bill, { category: name, updatedAt: stamp }); });
      expenses.forEach((expense) => { if (expense.category === existing.name) Object.assign(expense, { category: name, updatedAt: stamp }); });
    }
    Object.assign(existing, { name, planned, updatedAt: stamp });
  } else {
    categories.push(normalizeCategory({ name, planned, color: CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length], updatedAt: stamp }));
  }
  closeSheet();
  commit();
  showToast(existing ? `${name} updated` : `${name} added`);
  return true;
}

function deleteCategory(name) {
  const category = categoryByName(name);
  if (!category || categories.length <= 1) return;
  const snapshot = snapshotAll();
  categories = categories.filter((item) => item !== category);
  ensureCategorySafety();
  closeSheet();
  commit();
  showToast(`${name} removed`, { undo: () => restoreAll(snapshot) });
}

function saveBudgetSettings(form) {
  const data = readForm(form);
  settings.cashflow.monthlyStartingBalance = parseMoneyInput(data.income);
  settings.cashflow.budgetPeriodStartDay = clampStartDay(data.payday);
  settings.reminderDays = Math.max(0, Math.min(30, Math.round(Number(data.reminderDays)) || 0));
  commit();
  renderSheet();
  showToast("Budget settings saved");
  return true;
}

function finishOnboarding(form) {
  const data = readForm(form);
  const amount = parseMoneyInput(data.income);
  if (!amount) return formError(form, "Enter your take-home pay to calculate what's safe to spend.");
  settings.cashflow.monthlyStartingBalance = amount;
  settings.cashflow.budgetPeriodStartDay = clampStartDay(data.payday);
  settings.profile = { ...settings.profile, onboardingComplete: true, createdAt: settings.profile.createdAt || nowIso() };
  if (!categories.length) categories = starterCategories();
  ui.tab = "budget";
  commit();
  showToast("Next: give each category a plan.");
  return true;
}

function setTheme(theme) {
  settings.theme = validTheme(theme);
  applyTheme();
  saveState();
  renderSheet();
}

function removeSampleData() {
  const snapshot = snapshotAll();
  bills.filter((bill) => LEGACY_SAMPLE_BILL_IDS.has(bill.id)).forEach((bill) => removeBill(bill.id));
  expenses.filter((expense) => LEGACY_SAMPLE_EXPENSE_IDS.has(expense.id)).forEach((expense) => removeExpense(expense.id));
  commit();
  renderSheet();
  showToast("Sample data removed", { undo: () => { restoreAll(snapshot); renderSheet(); } });
}

/* ---------- export / backup ---------- */

function download(filename, type, content) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(value) {
  const text = String(value ?? "");
  // Leading =,+,-,@ would be evaluated as a formula by spreadsheet apps.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

function exportCsv() {
  const period = viewPeriod();
  const rows = [
    ["Date", "Type", "Name", "Category", "Amount JMD", "Status"],
    ...transactionsFor({ bills, expenses, period }).reverse().map((tx) => [tx.date, tx.kind === "bill" ? "Bill" : "Expense", tx.name, tx.category, tx.amount, "Paid"]),
    ...sortOpenBills(openBillsFor(bills, period, today)).map((bill) => [bill.due, "Bill", bill.name, bill.category, bill.amount, "Unpaid"])
  ];
  download(`upnext-${period.startDate}.csv`, "text/csv;charset=utf-8", rows.map((row) => row.map(csvCell).join(",")).join("\n"));
  showToast(`Exported ${periodLabel(period)}`);
}

function exportBackup() {
  settings.lastBackupAt = today;
  saveState();
  renderSheet();
  download(`upnext-backup-${today}.json`, "application/json", JSON.stringify(appState(), null, 2));
  showToast("Backup downloaded");
}

function restoreBackup(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const state = JSON.parse(String(reader.result));
      if (!isValidState(state)) throw new Error("That file isn't an UpNextBudgeting backup.");
      if (!confirm("Replace the data on this device with this backup?")) return;
      const keepProfile = settings.profile;
      hydrate(state);
      settings.profile = { ...keepProfile, ...settings.profile, onboardingComplete: true };
      applyTheme();
      closeSheet();
      commit();
      showToast("Backup restored");
    } catch (error) {
      showToast(error.message || "Could not restore that backup.");
    }
  });
  reader.readAsText(file);
}

/* ---------- theme, toasts, badge ---------- */

function applyTheme() {
  const pref = validTheme(settings.theme);
  const resolved = pref === "system" ? (window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark") : pref;
  document.documentElement.dataset.theme = resolved;
  themeColorMeta?.setAttribute("content", resolved === "light" ? "#f5f7f8" : "#06121f");
}

function showToast(message, { undo = null, undoLabel = "Undo", duration = 5000 } = {}) {
  // A modal dialog renders in the top layer and makes the rest of the page
  // inert, so toasts move inside it while a sheet is open.
  const host = sheet.open ? sheet : document.body;
  if (toastRegion.parentElement !== host) host.append(toastRegion);
  while (toastRegion.children.length >= 2) toastRegion.firstElementChild.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(text);
  const dismiss = () => {
    window.clearTimeout(timer);
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 200);
  };
  if (typeof undo === "function") {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = undoLabel;
    button.addEventListener("click", () => {
      undo();
      dismiss();
    });
    toast.append(button);
  }
  toastRegion.append(toast);
  const timer = window.setTimeout(dismiss, duration);
}

async function updateAppBadge() {
  // Same window as the "Flag bills due within" setting, so the badge and the
  // amber due dates agree.
  const count = activeBills().filter((bill) => !bill.paid && daysBetween(today, bill.due) <= settings.reminderDays).length;
  try {
    if (count && "setAppBadge" in navigator) await navigator.setAppBadge(count);
    if (!count && "clearAppBadge" in navigator) await navigator.clearAppBadge();
  } catch {
    /* badge API is best-effort */
  }
}

/* ---------- view pieces ---------- */

function pageHead(title, eyebrow = "") {
  return `
    <header class="page-head">
      ${eyebrow ? `<p class="label">${esc(eyebrow)}</p>` : ""}
      <h2>${esc(title)}</h2>
    </header>
  `;
}

// A segmented control with one ink pill that slides to the chosen option
// (see slidePills). `key` lets the pill remember where it was across renders.
function segmented(key, label, buttons) {
  return `
    <div class="segmented" role="group" aria-label="${esc(label)}" data-seg="${key}" style="--n:${buttons.length}">
      <span class="seg-pill" aria-hidden="true"></span>
      ${buttons.join("")}
    </div>
  `;
}

// A big number that counts to its value (see runCounters).
function counted(key, value, cls = "") {
  return `<p class="hero-amount ${cls}" data-count="${key}" data-value="${roundMoney(value)}">${heroMoney(value)}</p>`;
}

function periodSwitch(period) {
  const offsetCopy = ui.offset === 0 ? "This period" : ui.offset === -1 ? "Last period" : ui.offset === 1 ? "Next period" : `${Math.abs(ui.offset)} periods ago`;
  return `
    <div class="period-switch">
      <div class="period-label" aria-live="polite">
        <strong>${periodLabel(period)}</strong>
        <span>${offsetCopy}</span>
      </div>
      <button class="icon-btn" data-action="period" data-step="-1" type="button" aria-label="Previous period">${icons.left}</button>
      <button class="icon-btn" data-action="period" data-step="1" type="button" aria-label="Next period" ${ui.offset >= MAX_PERIOD_OFFSET ? "disabled" : ""}>${icons.right}</button>
    </div>
  `;
}

function sectionHead(title, action = "", target = "") {
  return `
    <div class="section-head">
      <h2>${esc(title)}</h2>
      ${action ? `<button class="link-btn" data-goto="${target}" type="button">${esc(action)}</button>` : ""}
    </div>
  `;
}

// `key` lets a bar slide to its new widths after a save (see animateMeters).
function meter(parts, total, key = "") {
  const segs = parts
    .filter((part) => part.value > 0)
    .map((part) => `<i class="${part.cls}" data-part="${part.cls}" style="width:${Math.min(100, (part.value / Math.max(total, 1)) * 100).toFixed(2)}%"></i>`)
    .join("");
  return `<div class="meter" aria-hidden="true"${key ? ` data-meter="${esc(key)}"` : ""}>${segs}</div>`;
}

// Ten capsules that fill from the bottom: dark for spent, light for bills
// still due. All red once the plan is blown.
function pills(spent, scheduled, base, over) {
  const total = Math.max(base, 1);
  const a = (spent / total) * 100;
  const b = ((spent + scheduled) / total) * 100;
  const fill = (share, k) => Math.max(0, Math.min(100, (share - k * 10) * 10)).toFixed(1);
  const cells = Array.from({ length: 10 }, (_, k) => `<i style="--a:${over ? 100 : fill(a, k)}%;--b:${over ? 100 : fill(b, k)}%;--k:${k}"></i>`).join("");
  return `<span class="pills${over ? " is-over" : ""}" aria-hidden="true">${cells}</span>`;
}

// One dot per day from payday to the day before the next, today ringed.
function tracker(period) {
  const total = daysBetween(period.startDate, period.endDate) + 1;
  const day = Math.min(total, Math.max(1, daysBetween(period.startDate, today) + 1));
  const left = total - day + 1;
  const dots = Array.from({ length: total }, (_, k) => `<i class="${k + 1 < day ? "is-past" : k + 1 === day ? "is-today" : ""}" style="--k:${k}"></i>`).join("");
  return `
    <div class="tracker">
      <div class="tracker-head"><strong>Day ${day} of ${total}</strong><span>${left === 1 ? "Last day" : `${left} days left`}</span></div>
      <div class="track" aria-hidden="true">${dots}</div>
    </div>
  `;
}

function billRow(bill) {
  const action = bill.paid
    ? `<span class="row-done" aria-hidden="true">${icons.check}</span>`
    : `<button class="check-btn" data-action="pay" data-id="${esc(bill.id)}" type="button" aria-label="Mark ${esc(bill.name)} paid">${icons.check}</button>`;
  return `
    <li class="row">
      <button class="row-main" data-action="edit-bill" data-id="${esc(bill.id)}" type="button">
        <span class="dot" style="--c:${categoryColor(bill.category)}" aria-hidden="true"></span>
        <span class="row-text">
          <span class="row-title">${esc(bill.name)}${bill.repeat !== "none" ? `<span class="repeat" title="${REPEATS[bill.repeat]}">${icons.repeat}<span class="sr-only">${REPEATS[bill.repeat]}</span></span>` : ""}</span>
          <span class="row-sub ${dueTone(bill)}">${esc(dueLabel(bill))} · ${esc(bill.category)}</span>
        </span>
        <span class="row-amount">${money(bill.amount)}</span>
      </button>
      ${action}
    </li>
  `;
}

function txRow(tx) {
  return `
    <li class="row">
      <button class="row-main" data-action="${tx.kind === "bill" ? "edit-bill" : "edit-expense"}" data-id="${esc(tx.id)}" type="button">
        <span class="dot" style="--c:${categoryColor(tx.category)}" aria-hidden="true"></span>
        <span class="row-text">
          <span class="row-title">${esc(tx.name)}</span>
          <span class="row-sub">${esc(tx.category)}${tx.kind === "bill" ? ` · Bill` : ""} · ${shortDate(tx.date)}</span>
        </span>
        <span class="row-amount">${money(tx.amount)}</span>
      </button>
    </li>
  `;
}

function alertAmount(alert) {
  return alert.currency === "JMD" ? money(alert.amount) : `US$${alert.amount.toFixed(2)}`;
}

function alertRow(alert) {
  const name = alert.merchant || "Unknown merchant";
  const sub = [alert.bank, alert.date ? shortDate(alert.date) : "", alert.currency === "JMD" ? "Tap to add" : "Convert to JMD"].filter(Boolean).join(" · ");
  return `
    <li class="row">
      <button class="row-main" data-action="review-alert" data-id="${esc(alert.id)}" type="button">
        <span class="dot dot-alert" aria-hidden="true"></span>
        <span class="row-text">
          <span class="row-title">${esc(name)}</span>
          <span class="row-sub">${esc(sub)}</span>
        </span>
        <span class="row-amount ${alert.currency === "JMD" ? "" : "is-warning"}">${esc(alertAmount(alert))}</span>
      </button>
      <button class="dismiss-btn" data-action="ignore-alert" data-id="${esc(alert.id)}" type="button" aria-label="Ignore alert from ${esc(name)}">${icons.close}</button>
    </li>
  `;
}

function alertsSection() {
  const connected = Boolean(loadBridge());
  if (!alerts.pending.length && !connected) return "";
  const shown = alerts.pending.slice(0, 8);
  const more = alerts.pending.length - shown.length;
  const checked = alerts.lastSyncAt ? `Last checked ${shortDate(toDateInputValue(new Date(alerts.lastSyncAt)))}` : "Not checked yet";
  return `
    <section class="section">
      <div class="section-head">
        <h2>Bank alerts${alerts.pending.length ? ` <span class="count">${alerts.pending.length}</span>` : ""}</h2>
        ${connected ? `<button class="link-btn" data-action="sync-alerts" type="button" ${syncing ? "disabled" : ""}>${syncing ? "Checking…" : "Check Gmail"}</button>` : ""}
      </div>
      ${shown.length
        ? `<ul class="list card">${shown.map(alertRow).join("")}</ul>${more > 0 ? `<p class="list-summary">${more} more after these</p>` : ""}`
        : `<div class="card">${emptyState("You're up to date", `${checked}. New alerts wait here for you to confirm.`)}</div>`}
    </section>
  `;
}

function askClaudeSection() {
  return `
    <section class="section">
      ${sectionHead("Ask Claude")}
      <ul class="list card">
        <li class="row">
          <button class="row-main" data-action="ask-claude" type="button">
            <span class="ask-icon" aria-hidden="true">${icons.spark}</span>
            <span class="row-text">
              <span class="row-title">Get a second opinion on this period</span>
              <span class="row-sub">Copies a ready-made prompt with your numbers</span>
            </span>
            <span class="row-chevron" aria-hidden="true">${icons.right}</span>
          </button>
        </li>
      </ul>
    </section>
  `;
}

function categoryStatus(row) {
  const committed = roundMoney(row.spent + row.scheduled);
  if (!row.planned && !committed) return { text: "No plan", cls: "is-muted" };
  if (!row.planned) return { text: `${money(committed)} unplanned`, cls: "is-warning" };
  if (row.remaining < 0) return { text: `${money(-row.remaining)} over`, cls: "is-danger" };
  return { text: `${money(row.remaining)} left`, cls: "" };
}

// `daysLeft` (current period only) adds "J$970 a day" under what's left.
function categoryRow(row, { compact = false, daysLeft = 0 } = {}) {
  const status = categoryStatus(row);
  const idle = !row.planned && !row.spent && !row.scheduled;
  const base = Math.max(row.planned, row.spent + row.scheduled);
  const detail = idle
    ? "Tap to set a plan"
    : compact
      ? `${money(row.spent + row.scheduled)} of ${money(row.planned)}`
      : [`${money(row.spent)} spent${row.planned ? ` of ${money(row.planned)}` : ""}`, row.scheduled ? `${money(row.scheduled)} due` : ""].filter(Boolean).join(" · ");
  const over = row.planned > 0 && row.remaining < 0;
  const perDay = daysLeft > 0 && row.planned > 0 && row.remaining > 0 ? `<small>${money(Math.floor(row.remaining / daysLeft))} a day</small>` : "";
  return `
    <li class="row">
      <button class="row-main cat-row" data-action="edit-category" data-name="${esc(row.name)}" type="button">
        <span class="dot" style="--c:${safeCssColor(row.color)}" aria-hidden="true"></span>
        <span class="row-text">
          <span class="row-title">${esc(row.name)}</span>
          ${idle ? "" : pills(row.spent, row.scheduled, base, over)}
          <span class="row-sub">${detail}</span>
        </span>
        <span class="row-amount ${status.cls}">${status.text}${perDay}</span>
      </button>
    </li>
  `;
}

function emptyState(title, body, action = "") {
  return `<div class="empty"><p class="empty-title">${esc(title)}</p><p>${esc(body)}</p>${action}</div>`;
}

/* ---------- screens ---------- */

function renderOnboarding() {
  app.innerHTML = `
    <section class="onboard">
      <p class="label">Welcome</p>
      <h2>Payday to payday.<span class="tone-2">Know what's safe to spend.</span></h2>
      <p class="onboard-copy">Your bills come off the top, then you see what's left for each day until payday. Everything stays private on this device.</p>
      <form class="form card" data-form="onboard" novalidate>
        <label class="field">
          <span>Monthly take-home pay</span>
          <input class="money" name="income" inputmode="decimal" autocomplete="off" placeholder="0.00" required>
        </label>
        <label class="field">
          <span>Payday</span>
          <select name="payday">
            ${Array.from({ length: 28 }, (_, i) => i + 1).map((day) => `<option value="${day}" ${day === 25 ? "selected" : ""}>${ordinal(day)} of the month</option>`).join("")}
          </select>
        </label>
        <p class="hint">Paid at month-end? Pick the 28th. Your period runs from payday to the day before the next one.</p>
        <p class="form-error" role="alert" hidden></p>
        <button class="btn btn-primary" type="submit">Start budgeting</button>
      </form>
      <p class="onboard-help"><button class="link-btn" data-action="help" type="button">How does UpNext work?</button></p>
    </section>
  `;
}

function ordinal(n) {
  const suffix = n % 10 === 1 && n !== 11 ? "st" : n % 10 === 2 && n !== 12 ? "nd" : n % 10 === 3 && n !== 13 ? "rd" : "th";
  return `${n}${suffix}`;
}

function renderHome() {
  const period = currentPeriod();
  const s = periodSummary({ bills, expenses, income: income(), period, today });
  const upcoming = sortOpenBills(openBillsFor(bills, { startDate: "0000-01-01", nextStartDate: addDays(today, 15) }, today)).slice(0, 5);
  const { rows } = categoryBreakdown({ categories, bills, expenses, period, today });
  const watched = rows
    .filter((row) => row.planned > 0)
    .map((row) => ({ ...row, ratio: (row.spent + row.scheduled) / row.planned }))
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);
  const recent = transactionsFor({ bills, expenses, period }).slice(0, 5);
  const negative = s.safeToSpend < 0;

  app.innerHTML = `
    ${pageHead("Overview", `${periodLabel(period)} · ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} to payday`)}

    <section class="hero" aria-label="Safe to spend">
      <p class="hero-label">Safe to spend</p>
      ${counted("home-safe", s.safeToSpend, negative ? "is-danger" : "")}
      <p class="hero-sub">${!s.income
        ? `<button class="link-btn" data-action="settings" type="button">Set your income</button> to see what's safe to spend.`
        : negative
          ? `You're ${money(-s.safeToSpend)} short before payday.`
          : `About ${money(Math.floor(s.perDay))} a day until payday.`}</p>
      ${tracker(period)}
      <dl class="stats">
        <div><dt>Income</dt><dd>${money(s.income)}</dd></div>
        <div><dt>Spent</dt><dd>${money(s.spent)}</dd></div>
        <div><dt>Bills left</dt><dd>${money(s.billsLeft)}</dd></div>
      </dl>
    </section>

    ${alertsSection()}

    <section class="section">
      ${sectionHead("Upcoming bills", "All bills", "bills")}
      ${upcoming.length
        ? `<ul class="list card">${upcoming.map(billRow).join("")}</ul>`
        : `<div class="card">${emptyState("Nothing due in the next two weeks", "Add rent, utilities, and loans so they never sneak up on you.", `<button class="btn btn-secondary" data-action="add-bill" type="button">Add a bill</button>`)}</div>`}
    </section>

    <section class="section">
      ${sectionHead("Budget", watched.length ? "See all" : "", "budget")}
      ${watched.length
        ? `<ul class="list card">${watched.map((row) => categoryRow(row, { compact: true, daysLeft: s.daysLeft })).join("")}</ul>`
        : `<div class="card">${emptyState("No plan yet", "Decide how much each category gets this period.", `<button class="btn btn-secondary" data-goto="budget" type="button">Plan your budget</button>`)}</div>`}
    </section>

    <section class="section">
      ${sectionHead("Recent", recent.length ? "All activity" : "", "activity")}
      ${recent.length
        ? `<ul class="list card">${recent.map(txRow).join("")}</ul>`
        : `<div class="card">${emptyState("No spending yet this period", "Tap + to log an expense in a few seconds.")}</div>`}
    </section>

    ${askClaudeSection()}
  `;
}

function renderBudget() {
  const period = viewPeriod();
  const { rows, totalPlanned } = categoryBreakdown({ categories, bills, expenses, period, today });
  const s = periodSummary({ bills, expenses, income: income(), period, today });
  const unplanned = roundMoney(s.income - totalPlanned);
  const committed = roundMoney(s.spent + s.billsLeft);
  const headline = !s.income
    ? { label: "Income not set", value: 0, cls: "" }
    : unplanned > 0
      ? { label: "Left to plan", value: unplanned, cls: "" }
      : unplanned < 0
        ? { label: "Over-planned by", value: -unplanned, cls: "is-danger" }
        : { label: "Every dollar has a job", value: s.income, cls: "is-ok" };

  app.innerHTML = `
    ${pageHead("Budget", "Plan vs. actual")}
    ${periodSwitch(period)}

    <section class="hero hero-compact">
      <p class="hero-label">${headline.label}</p>
      ${counted("budget-headline", headline.value, headline.cls)}
      <p class="hero-sub">${money(totalPlanned)} planned of ${money(s.income)} income · ${money(committed)} spent or due</p>
      ${meter([{ value: s.spent, cls: "is-spent" }, { value: s.billsLeft, cls: "is-scheduled" }], Math.max(totalPlanned, committed), "budget")}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Categories</h2>
        <span class="legend"><i class="key is-spent"></i>Spent <i class="key is-scheduled"></i>Due</span>
      </div>
      <ul class="list card">${rows.map((row) => categoryRow(row, { daysLeft: s.daysLeft })).join("")}</ul>
      <button class="btn btn-secondary btn-block" data-action="add-category" type="button">Add category</button>
    </section>
  `;
}

function renderBills() {
  const open = sortOpenBills(activeBills().filter((bill) => !bill.paid));
  const period = currentPeriod();
  const groups = [
    ["Overdue", open.filter((bill) => bill.due < today)],
    ["Due before payday", open.filter((bill) => bill.due >= today && bill.due < period.nextStartDate)],
    ["Later", open.filter((bill) => bill.due >= period.nextStartDate)]
  ].filter(([, items]) => items.length);
  const paid = activeBills().filter((bill) => bill.paid).sort((a, b) => billSpentDate(b).localeCompare(billSpentDate(a))).slice(0, 60);
  const totalOpen = sumMoney(open.map((bill) => bill.amount));

  const upcomingHtml = groups.length
    ? groups.map(([title, items]) => `
        <section class="section">
          <div class="section-head"><h2>${title}</h2><span class="muted">${money(sumMoney(items.map((bill) => bill.amount)))}</span></div>
          <ul class="list card">${items.map(billRow).join("")}</ul>
        </section>`).join("")
    : `<div class="card section">${emptyState("No upcoming bills", "Add recurring bills once — they roll forward each time you mark them paid.", `<button class="btn btn-primary" data-action="add-bill" type="button">Add a bill</button>`)}</div>`;

  const paidHtml = paid.length
    ? `<section class="section"><ul class="list card">${paid.map(billRow).join("")}</ul></section>`
    : `<div class="card section">${emptyState("No paid bills yet", "Bills you mark paid show up here.")}</div>`;

  app.innerHTML = `
    ${pageHead("Bills", open.length ? `${open.length} unpaid · ${money(totalOpen)}` : "All caught up")}
    ${segmented("bills-view", "Bill view", [
      `<button type="button" data-action="bills-view" data-view="upcoming" aria-pressed="${ui.billsView === "upcoming"}">Upcoming</button>`,
      `<button type="button" data-action="bills-view" data-view="paid" aria-pressed="${ui.billsView === "paid"}">Paid</button>`
    ])}
    ${ui.billsView === "paid" ? paidHtml : upcomingHtml}
    ${groups.length && ui.billsView === "upcoming" ? `<button class="btn btn-secondary btn-block" data-action="add-bill" type="button">Add a bill</button>` : ""}
  `;
}

function filteredTransactions(period) {
  const query = ui.search.trim().toLowerCase();
  return transactionsFor({ bills, expenses, period }).filter((tx) =>
    (ui.category === "All" || tx.category === ui.category) &&
    (!query || `${tx.name} ${tx.category}`.toLowerCase().includes(query))
  );
}

function activityListHtml(period) {
  const items = filteredTransactions(period);
  if (!items.length) {
    const filtered = ui.search || ui.category !== "All";
    return `<div class="card">${emptyState(filtered ? "No matches" : "Nothing recorded", filtered ? "Try a different search or category." : "Expenses and paid bills for this period appear here.")}</div>`;
  }
  const groups = new Map();
  items.forEach((tx) => {
    if (!groups.has(tx.date)) groups.set(tx.date, []);
    groups.get(tx.date).push(tx);
  });
  const total = sumMoney(items.map((tx) => tx.amount));
  return `
    <p class="list-summary">${items.length} transaction${items.length === 1 ? "" : "s"} · <strong>${money(total)}</strong></p>
    ${[...groups].map(([date, txs]) => `
      <section class="day-group">
        <h2 class="day-head"><span>${date === today ? "Today" : weekdayDate.format(parseDate(date))}</span><span>${money(sumMoney(txs.map((tx) => tx.amount)))}</span></h2>
        <ul class="list card">${txs.map(txRow).join("")}</ul>
      </section>`).join("")}
  `;
}

function renderActivity() {
  const period = viewPeriod();
  if (ui.category !== "All" && !categoryByName(ui.category)) ui.category = "All";
  app.innerHTML = `
    ${pageHead("Activity", "Expenses and paid bills")}
    ${periodSwitch(period)}
    <div class="filters">
      <label class="search">
        <span class="sr-only">Search</span>
        <input type="search" id="activitySearch" placeholder="Search" value="${esc(ui.search)}" autocomplete="off">
      </label>
      <label class="select-sm">
        <span class="sr-only">Category</span>
        <select id="activityCategory">
          <option value="All">All categories</option>
          ${categories.map((category) => `<option ${ui.category === category.name ? "selected" : ""}>${esc(category.name)}</option>`).join("")}
        </select>
      </label>
    </div>
    <div id="activityList">${activityListHtml(period)}</div>
  `;
}

/* ---------- motion ---------- */

function reducedMotion() {
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

// Run `fn` once the splash has lifted, so nothing plays hidden under it.
function afterSplash(fn) {
  if (window.upnextBooting) window.addEventListener("upnext-lifted", fn, { once: true });
  else fn();
}

// Big numbers count to their value: from zero when a screen opens, from the
// last value after a save. The hero card's light sweeps across as they do.
const countedValues = new Map();
function runCounters(root, entering) {
  root.querySelectorAll("[data-count]").forEach((el) => {
    const key = el.dataset.count;
    const to = Number(el.dataset.value) || 0;
    const had = countedValues.has(key);
    const from = entering ? 0 : had ? countedValues.get(key) : to;
    countedValues.set(key, to);
    if (from === to) return;
    el.closest(".hero")?.insertAdjacentHTML("afterbegin", `<span class="sheen" aria-hidden="true"></span>`);
    if (reducedMotion()) return;
    const ms = entering ? 900 : 350;
    el.innerHTML = heroMoney(Math.round(from));
    afterSplash(() => {
      const start = performance.now();
      const tick = (now) => {
        if (!el.isConnected) return;
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        el.innerHTML = heroMoney(t < 1 ? Math.round(from + (to - from) * eased) : to);
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
}

// innerHTML replaces every bar on a save, so CSS alone can't animate the
// change. Start each segment at its last width and let it slide to the new one.
const meterWidths = new Map();
function animateMeters(root, entering) {
  root.querySelectorAll("[data-meter]").forEach((bar) => {
    const before = meterWidths.get(bar.dataset.meter) || {};
    const after = {};
    bar.querySelectorAll("i[data-part]").forEach((seg) => {
      const to = seg.style.width;
      after[seg.dataset.part] = to;
      const from = before[seg.dataset.part];
      if (entering || reducedMotion() || from === undefined || from === to) return;
      seg.style.transition = "none";
      seg.style.width = from;
      void seg.offsetWidth;
      seg.style.transition = "";
      seg.style.width = to;
    });
    meterWidths.set(bar.dataset.meter, after);
  });
}

// Segmented controls: start the pill where it last was, then let it slide.
const pillIndex = new Map();
function slidePills(root) {
  root.querySelectorAll(".segmented[data-seg]").forEach((group) => {
    const buttons = [...group.querySelectorAll("button")];
    const index = Math.max(0, buttons.findIndex((button) => button.getAttribute("aria-pressed") === "true"));
    const pill = group.querySelector(".seg-pill");
    const before = pillIndex.get(group.dataset.seg);
    pillIndex.set(group.dataset.seg, index);
    if (pill && before !== undefined && before !== index && !reducedMotion()) {
      group.style.setProperty("--i", before);
      pill.style.transition = "none";
      void pill.offsetWidth;
      pill.style.transition = "";
    }
    group.style.setProperty("--i", index);
  });
}

const TAB_COLUMNS = { home: 0, budget: 1, bills: 3, activity: 4 };
let lastScreen = null;

function render() {
  const onboarding = !hasCompletedOnboarding();
  // Entrances play when a screen opens, not on every save.
  const screen = onboarding ? "onboard" : ui.tab;
  const entering = screen !== lastScreen;
  lastScreen = screen;
  app.classList.toggle("is-entering", entering && !onboarding);
  document.body.classList.toggle("is-onboarding", onboarding);
  tabbar.hidden = onboarding;
  if (onboarding) {
    renderOnboarding();
    return;
  }
  if (ui.tab === "budget") renderBudget();
  else if (ui.tab === "bills") renderBills();
  else if (ui.tab === "activity") renderActivity();
  else renderHome();
  tabbar.querySelectorAll(".tab").forEach((tab) => {
    if (tab.dataset.tab === ui.tab) tab.setAttribute("aria-current", "page");
    else tab.removeAttribute("aria-current");
  });
  dockBar.style.setProperty("--i", TAB_COLUMNS[ui.tab] ?? 0);
  app.querySelectorAll(".list").forEach((list) => {
    [...list.children].forEach((row, index) => row.style.setProperty("--row", Math.min(index, 8)));
  });
  slidePills(app);
  animateMeters(app, entering);
  runCounters(app, entering);
  updateAppBadge();
}

/* ---------- sheets ---------- */

function categoryOptions(selected) {
  const pick = categoryByName(selected) ? selected : fallbackCategoryName();
  return categories.map((category) => `<option ${category.name === pick ? "selected" : ""}>${esc(category.name)}</option>`).join("");
}

// `draft` pre-fills a new expense from a bank alert (see draftFromAlert).
function expenseForm(expense = null, draft = null) {
  const preferred = expense?.category || draft?.category || ui.lastCategory || (ui.category !== "All" ? ui.category : "");
  const amount = expense ? formatMoneyInput(expense.amount) : draft?.amount ? formatMoneyInput(draft.amount) : "";
  const note = expense?.note || (expense && expense.merchant !== expense.category ? expense.merchant : "") || draft?.merchant || "";
  return `
    <form class="form" data-form="expense" data-id="${esc(expense?.id ?? "")}" novalidate>
      ${draft ? `<input type="hidden" name="alertId" value="${esc(draft.alertId)}">` : ""}
      ${draft?.foreign ? `<p class="notice is-warning">This alert is ${esc(draft.foreign.currency === "USD" ? "US" : "")}$${esc(draft.foreign.amount.toFixed(2))}. Enter what it cost in JMD; your statement shows the rate the bank used.</p>` : ""}
      <label class="field field-amount">
        <span>Amount</span>
        <input class="money" name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(amount)}" ${expense || (draft && amount) ? "" : "autofocus"} required>
      </label>
      <label class="field">
        <span>Category</span>
        <select name="category">${categoryOptions(preferred)}</select>
      </label>
      <label class="field">
        <span>Note <em>(optional)</em></span>
        <input name="note" autocomplete="off" placeholder="e.g. Hi-Lo, taxi, lunch" value="${esc(note)}">
      </label>
      <label class="field">
        <span>Date</span>
        <input name="date" type="date" value="${esc(expense?.date || draft?.date || today)}" required>
      </label>
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary" type="submit">${expense ? "Save changes" : "Add expense"}</button>
      ${expense ? `<button class="btn btn-danger" data-action="delete-expense" data-id="${esc(expense.id)}" type="button">Delete expense</button>` : ""}
      ${draft && alertById(draft.alertId) ? `<button class="btn btn-danger" data-action="ignore-alert" data-id="${esc(draft.alertId)}" type="button">Ignore this alert</button>` : ""}
    </form>
    ${expense || draft ? "" : `<p class="sheet-alt"><button class="link-btn" data-action="paste-alert" type="button">Paste a bank alert instead</button></p>`}
    ${draft?.snippet ? `
      <section class="history">
        <h3>${esc(draft.bank ? `${draft.bank} alert` : "Alert text")}</h3>
        <p class="alert-snippet">${esc(draft.snippet)}</p>
      </section>` : ""}
  `;
}

function pasteAlertForm() {
  return `
    <form class="form" data-form="paste-alert" novalidate>
      <label class="field">
        <span>Alert text</span>
        <textarea name="text" rows="6" autocomplete="off" spellcheck="false" placeholder="Paste the SMS or email from your bank" autofocus></textarea>
      </label>
      <p class="hint">UpNext reads the amount, the merchant and the bank, then lets you check them before anything is added.</p>
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary" type="submit">Read alert</button>
    </form>
  `;
}

function claudeBody() {
  const focus = CLAUDE_FOCUS[ui.claudeFocus] ? ui.claudeFocus : "review";
  return `
    ${segmented("claude-focus", "What should Claude focus on?", Object.entries(CLAUDE_FOCUS).map(([key, item]) =>
      `<button type="button" data-action="claude-focus" data-focus="${key}" aria-pressed="${focus === key}">${esc(item.label)}</button>`))}
    <div class="form">
      <p class="hint">Copies this period's pay, plans, bills and transactions, merchant names included, as a prompt. Nothing leaves your phone until you paste it. Edit it first if you like.</p>
      <label class="field">
        <span>Prompt</span>
        <textarea id="claudePrompt" class="prompt-text" rows="12" spellcheck="false">${esc(claudePrompt(focus))}</textarea>
      </label>
      <button class="btn btn-primary" data-action="copy-claude" type="button">Copy prompt</button>
      <a class="btn btn-secondary" href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">Open Claude</a>
    </div>
  `;
}

function billForm(bill = null) {
  const history = bill
    ? bills.filter((item) => item.seriesKey === bill.seriesKey && item.paid && item !== bill && isActiveBill(item)).sort((a, b) => b.due.localeCompare(a.due)).slice(0, 4)
    : [];
  return `
    ${bill ? "" : `
      <div class="presets" role="group" aria-label="Common bills">
        ${PRESETS.map((preset, index) => `<button class="chip" data-action="preset" data-index="${index}" type="button">${esc(preset.name)}</button>`).join("")}
      </div>`}
    <form class="form" data-form="bill" data-id="${esc(bill?.id ?? "")}" novalidate>
      <label class="field">
        <span>Name</span>
        <input name="name" autocomplete="off" placeholder="e.g. JPS electricity" value="${esc(bill?.name || "")}" required>
      </label>
      <div class="field-row">
        <label class="field">
          <span>Amount</span>
          <input class="money" name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(bill ? formatMoneyInput(bill.amount) : "")}" required>
        </label>
        <label class="field">
          <span>Due</span>
          <input name="due" type="date" value="${esc(bill?.due || today)}" required>
        </label>
      </div>
      <div class="field-row">
        <label class="field">
          <span>Category</span>
          <select name="category">${categoryOptions(bill?.category || ui.lastCategory)}</select>
        </label>
        <label class="field">
          <span>Repeats</span>
          <select name="repeat">
            ${Object.entries(REPEATS).map(([value, label]) => `<option value="${value}" ${(bill?.repeat || "monthly") === value ? "selected" : ""}>${label}</option>`).join("")}
          </select>
        </label>
      </div>
      ${bill ? `
        <label class="switch">
          <input type="checkbox" name="paid" ${bill.paid ? "checked" : ""}>
          <span class="switch-track" aria-hidden="true"></span>
          <span>Paid</span>
        </label>` : ""}
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary" type="submit">${bill ? "Save changes" : "Add bill"}</button>
      ${bill ? `<button class="btn btn-danger" data-action="delete-bill" data-id="${esc(bill.id)}" type="button">Delete bill</button>` : ""}
    </form>
    ${history.length ? `
      <section class="history">
        <h3>Previous payments</h3>
        <ul>${history.map((item) => `<li><span>${shortDate(item.due)}</span><span>${money(item.amount)}</span></li>`).join("")}</ul>
      </section>` : ""}
  `;
}

function categoryForm(category = null) {
  return `
    <form class="form" data-form="category" data-name="${esc(category?.name || "")}" novalidate>
      <label class="field">
        <span>Name</span>
        <input name="name" autocomplete="off" placeholder="e.g. Eating out" value="${esc(category?.name || "")}" required>
      </label>
      <label class="field field-amount">
        <span>Plan per period</span>
        <input class="money" name="planned" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(category ? formatMoneyInput(category.planned) : "")}" ${category ? "autofocus" : ""}>
      </label>
      <p class="hint">Bills and expenses in this category count against the plan.</p>
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary" type="submit">${category ? "Save" : "Add category"}</button>
      ${category && categories.length > 1 ? `<button class="btn btn-danger" data-action="delete-category" data-name="${esc(category.name)}" type="button">Delete category</button>` : ""}
    </form>
  `;
}

function settingsBody() {
  const theme = validTheme(settings.theme);
  const bridge = loadBridge();
  return `
    <form class="form settings-group" data-form="budget-settings" novalidate>
      <h3>Budget</h3>
      <label class="field">
        <span>Monthly take-home pay</span>
        <input class="money" name="income" inputmode="decimal" autocomplete="off" value="${esc(formatMoneyInput(settings.cashflow.monthlyStartingBalance))}" placeholder="0.00">
      </label>
      <div class="field-row">
        <label class="field">
          <span>Payday</span>
          <select name="payday">
            ${Array.from({ length: 28 }, (_, i) => i + 1).map((day) => `<option value="${day}" ${day === paydayStart() ? "selected" : ""}>${ordinal(day)}</option>`).join("")}
          </select>
        </label>
        <label class="field">
          <span>Flag bills due within</span>
          <select name="reminderDays">
            ${[...new Set([0, 1, 2, 3, 5, 7, 14, settings.reminderDays])].sort((a, b) => a - b).map((d) => `<option value="${d}" ${d === settings.reminderDays ? "selected" : ""}>${d === 0 ? "Same day" : `${d} day${d === 1 ? "" : "s"}`}</option>`).join("")}
          </select>
        </label>
      </div>
      <button class="btn btn-secondary" type="submit">Save</button>
    </form>

    <form class="form settings-group" data-form="bridge" novalidate>
      <h3>Bank alerts from Gmail</h3>
      <p class="hint">Connect your own Google Apps Script to bring in bank alert emails you label <strong>upnext-alerts</strong>. Alerts wait on Home for you to confirm. Copy the script below, then follow the steps at the top of it.</p>
      <label class="field">
        <span>Web app URL</span>
        <input name="url" type="url" inputmode="url" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="https://script.google.com/macros/s/…/exec" value="${esc(bridge?.url || "")}">
      </label>
      <label class="field">
        <span>Key</span>
        <input name="key" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="From the setup function" value="${esc(bridge?.key || "")}">
      </label>
      <p class="form-error" role="alert" hidden></p>
      <div class="stack">
        <button class="btn btn-secondary" type="submit">${bridge ? "Save and check now" : "Connect"}</button>
        <button class="btn btn-secondary" data-action="copy-bridge" type="button">Copy setup script</button>
        ${bridge ? `<button class="btn btn-danger" data-action="disconnect-bridge" type="button">Disconnect Gmail</button>` : ""}
      </div>
    </form>

    <section class="settings-group">
      <h3>Appearance</h3>
      ${segmented("theme", "Theme", ["system", "light", "dark"].map((value) => `<button type="button" data-action="theme" data-theme="${value}" aria-pressed="${theme === value}">${value[0].toUpperCase()}${value.slice(1)}</button>`))}
    </section>

    <section class="settings-group">
      <h3>Data</h3>
      <div class="stack">
        <button class="btn btn-secondary" data-action="ask-claude" type="button">Ask Claude about this period</button>
        <button class="btn btn-secondary" data-action="export-csv" type="button">Export ${periodLabel(viewPeriod())} as CSV</button>
        <button class="btn btn-secondary" data-action="export-backup" type="button">Download backup</button>
        <label class="btn btn-secondary file-btn">Restore from backup<input type="file" id="restoreFile" accept="application/json,.json"></label>
        ${hasSampleData() ? `<button class="btn btn-danger" data-action="remove-sample" type="button">Remove sample data</button>` : ""}
      </div>
    </section>
    <section class="settings-group">
      <h3>Help</h3>
      <button class="btn btn-secondary" data-action="help" type="button">About &amp; how to use UpNext</button>
    </section>
    <p class="fine">Your data is stored only on this device. ${settings.lastBackupAt ? `Last backup ${shortDate(settings.lastBackupAt)}.` : "Download a backup now and then so you can restore it on a new phone."}</p>
  `;
}

function aboutBody() {
  return `
    <div class="about-head">
      <img src="assets/icon.svg" alt="" width="56" height="56">
      <div>
        <strong>UpNext Budgeting</strong>
        <span class="label">Version ${APP_VERSION} · payday to payday</span>
      </div>
    </div>

    <section class="card about-card">
      <h3>What it does</h3>
      <div class="prose">
        <p>UpNext answers one question first: <strong>how much can I safely spend before payday?</strong> It keeps your pay, bills, category plans and spending in one budget period, from payday to the day before the next one, so every screen agrees.</p>
      </div>
    </section>

    <section class="card about-card">
      <h3>Get started in five steps</h3>
      <ol class="steps prose">
        <li><span>Set your <strong>take-home pay</strong> and <strong>payday</strong> in Settings (the gear, top right).</span></li>
        <li><span>Add your <strong>bills</strong> once with + → Bill: rent, JPS, NWC, phone, loans. Choose <strong>Monthly</strong> and each one rolls forward when you tick it paid.</span></li>
        <li><span>On <strong>Budget</strong>, tap each category and give it a plan for the period. Keep going until it says <strong>Every dollar has a job</strong>.</span></li>
        <li><span>Log spending with <strong>+</strong> as it happens: amount, category, done.</span></li>
        <li><span>Check <strong>Home</strong> before you spend. When a bill goes out, tick its box.</span></li>
      </ol>
    </section>

    <section class="card about-card">
      <h3>The screens</h3>
      <dl class="guide prose">
        <div class="guide-row"><dt>Home</dt><dd>Safe to spend, about how much a day until payday, bills due in the next two weeks, the categories closest to their limit, and recent spending.</dd></div>
        <div class="guide-row"><dt>Budget</dt><dd>Plan vs. actual for each category. Blue is spent, purple is bills still due, red is over plan. Use the arrows to look at last period or plan the next one.</dd></div>
        <div class="guide-row"><dt>+</dt><dd>Add an expense or a bill. Common Jamaican bills are one tap away.</dd></div>
        <div class="guide-row"><dt>Bills</dt><dd>Overdue, due before payday, and later. Tick to mark paid (Undo appears for a few seconds); Paid shows what's gone out.</dd></div>
        <div class="guide-row"><dt>Activity</dt><dd>Every expense and paid bill in the period. Search, filter by category, tap to edit or delete.</dd></div>
        <div class="guide-row"><dt>Bank alerts</dt><dd>Paste a bank SMS or email from + → Paste a bank alert, or connect Gmail in Settings. Alerts wait on Home: tap one to check the amount and category, or × to ignore it. Deposits are skipped.</dd></div>
        <div class="guide-row"><dt>Ask Claude</dt><dd>At the bottom of Home. Copies a prompt with this period's numbers for you to paste into Claude. Pick Review, Cut back or Next period.</dd></div>
        <div class="guide-row"><dt>Settings</dt><dd>Pay and payday, when bills turn amber, Gmail alerts, theme, CSV export, backup and restore.</dd></div>
      </dl>
    </section>

    <section class="card about-card">
      <h3>How the numbers work</h3>
      <div class="prose">
        <p class="formula mono">Safe to spend = pay − spent − unpaid bills</p>
        <p><strong>Spent</strong> is your expenses plus bills marked paid this period. <strong>Unpaid bills</strong> are the ones due before payday, plus any that are overdue, because that money is still owed.</p>
        <p>A bill paid early or on time counts on its due date. A bill paid late counts on the day you paid it, so paying an overdue bill never makes Safe to spend jump up.</p>
        <p>The daily figure is Safe to spend divided by the days left until payday, today included.</p>
      </div>
    </section>

    <section class="card about-card">
      <h3>Tips</h3>
      <div class="prose">
        <p><strong>Install it.</strong> In Safari, tap Share → Add to Home Screen. It opens like an app, works offline, and Safari is less likely to clear its data.</p>
        <p><strong>Back up monthly.</strong> Settings → Download backup saves a file you can restore on any phone.</p>
        <p><strong>Paid at month-end?</strong> Choose the 28th as payday so every month has the same period.</p>
        <p><strong>Made a mistake?</strong> Tap any row to edit or delete it.</p>
      </div>
    </section>

    <section class="card about-card">
      <h3>Your data and disclaimers</h3>
      <div class="prose">
        <p><strong>Private.</strong> Everything is stored on this device only. No account, no server, no tracking. If you connect Gmail, the app talks only to your own Apps Script, and only alerts you label are read.</p>
        <p><strong>Estimates.</strong> UpNext is a planning tool, not financial advice. Check against your bank statements.</p>
        <p><strong>AI assistance.</strong> Built with help from Claude, an AI assistant made by Anthropic. Designed and checked by R. Marshall.</p>
      </div>
    </section>
  `;
}

function renderSheet() {
  const state = ui.sheet;
  if (!state) return;
  let title = "";
  let body = "";
  if (state.kind === "add") {
    title = state.mode === "bill" ? "New bill" : "New expense";
    body = `
      ${segmented("add-mode", "What are you adding?", [
        `<button type="button" data-action="add-mode" data-mode="expense" aria-pressed="${state.mode !== "bill"}">Expense</button>`,
        `<button type="button" data-action="add-mode" data-mode="bill" aria-pressed="${state.mode === "bill"}">Bill</button>`
      ])}
      ${state.mode === "bill" ? billForm() : expenseForm()}`;
  } else if (state.kind === "bill") {
    const bill = billById(state.id);
    title = bill ? "Edit bill" : "New bill";
    body = billForm(bill);
  } else if (state.kind === "expense") {
    title = "Edit expense";
    body = expenseForm(expenseById(state.id));
  } else if (state.kind === "alert") {
    title = "Add from alert";
    body = expenseForm(null, state.draft);
  } else if (state.kind === "paste-alert") {
    title = "Paste a bank alert";
    body = pasteAlertForm();
  } else if (state.kind === "claude") {
    title = "Ask Claude";
    body = claudeBody();
  } else if (state.kind === "category") {
    const category = categoryByName(state.name);
    title = category ? category.name : "New category";
    body = categoryForm(category);
  } else if (state.kind === "settings") {
    title = "Settings";
    body = settingsBody();
    prefetchBridgeScript();
  } else if (state.kind === "about") {
    title = "About & help";
    body = aboutBody();
  }
  sheetTitle.textContent = title;
  sheetBody.innerHTML = body;
  slidePills(sheetBody);
}

// Swap what an open sheet shows (Expense ↔ Bill, Settings → About) with the
// new content stepping in from the right.
function stepSheet(state) {
  ui.sheet = state;
  renderSheet();
  sheetBody.scrollTop = 0;
  sheetBody.classList.remove("is-stepping");
  void sheetBody.offsetWidth;
  sheetBody.classList.add("is-stepping");
}

let sheetCloseTimer = null;
function openSheet(state) {
  window.clearTimeout(sheetCloseTimer);
  sheet.classList.remove("is-closing");
  sheetBody.classList.remove("is-stepping");
  ui.sheet = state;
  renderSheet();
  if (!sheet.open) sheet.showModal();
  sheetBody.scrollTop = 0;
  const auto = sheetBody.querySelector("[autofocus]");
  if (auto && window.matchMedia("(hover: hover)").matches) auto.focus();
  else if (!auto) sheet.querySelector(".sheet-head .icon-btn")?.focus();
}

function closeSheet() {
  if (!sheet.open) return;
  ui.sheet = null;
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  sheet.classList.add("is-closing");
  sheetCloseTimer = window.setTimeout(() => {
    sheet.classList.remove("is-closing");
    sheet.close();
  }, reduced ? 0 : 180);
}

// Earlier versions synced to Supabase and could subscribe to daily push.
// Drop the leftovers so a retired subscription stops receiving notifications.
async function retireCloudSync() {
  LEGACY_SYNC_KEYS.forEach((key) => localStorage.removeItem(key));
  try {
    const registration = await navigator.serviceWorker?.getRegistration?.();
    const subscription = await registration?.pushManager?.getSubscription();
    await subscription?.unsubscribe();
  } catch {
    /* best-effort cleanup */
  }
}

/* ---------- events ---------- */

function initialTab() {
  const params = new URLSearchParams(window.location.search);
  const requested = (params.get("tab") || params.get("view") || window.location.hash.replace("#", "")).toLowerCase();
  const legacy = { spending: "bills", calendar: "bills", insights: "budget", expenses: "activity" };
  const tab = legacy[requested] || requested;
  return ["home", "budget", "bills", "activity"].includes(tab) ? tab : "home";
}

function goto(tab) {
  if (ui.tab !== tab) ui.offset = 0;
  ui.tab = tab;
  render();
  window.scrollTo({ top: 0 });
}

const actions = {
  "add": () => openSheet({ kind: "add", mode: "expense" }),
  "add-mode": (el) => {
    if (ui.sheet?.mode === el.dataset.mode) return;
    stepSheet({ kind: "add", mode: el.dataset.mode });
  },
  "help": () => (sheet.open ? stepSheet({ kind: "about" }) : openSheet({ kind: "about" })),
  "add-bill": () => openSheet({ kind: "bill" }),
  "close-sheet": () => closeSheet(),
  "settings": () => openSheet({ kind: "settings" }),
  "pay": (el) => payWithFlourish(el),
  "edit-bill": (el) => openSheet({ kind: "bill", id: el.dataset.id }),
  "edit-expense": (el) => openSheet({ kind: "expense", id: el.dataset.id }),
  "edit-category": (el) => openSheet({ kind: "category", name: el.dataset.name }),
  "add-category": () => openSheet({ kind: "category" }),
  "delete-bill": (el) => deleteBill(el.dataset.id),
  "delete-expense": (el) => deleteExpense(el.dataset.id),
  "delete-category": (el) => deleteCategory(el.dataset.name),
  "period": (el) => {
    ui.offset = Math.min(MAX_PERIOD_OFFSET, ui.offset + Number(el.dataset.step));
    render();
  },
  "bills-view": (el) => {
    ui.billsView = el.dataset.view;
    render();
  },
  "preset": (el) => {
    const preset = PRESETS[Number(el.dataset.index)];
    const form = sheetBody.querySelector("[data-form=bill]");
    if (!preset || !form) return;
    form.elements.name.value = preset.name;
    form.elements.amount.value = formatMoneyInput(preset.amount);
    form.elements.category.value = categoryByName(preset.category) ? preset.category : fallbackCategoryName();
    form.elements.repeat.value = preset.repeat;
    form.elements.amount.focus();
    form.elements.amount.select();
  },
  "theme": (el) => setTheme(el.dataset.theme),
  "export-csv": () => exportCsv(),
  "export-backup": () => exportBackup(),
  "remove-sample": () => removeSampleData(),
  "review-alert": (el) => {
    const alert = alertById(el.dataset.id);
    if (alert) openSheet({ kind: "alert", draft: draftFromAlert(alert) });
  },
  "ignore-alert": (el) => ignoreAlert(el.dataset.id),
  "paste-alert": () => stepSheet({ kind: "paste-alert" }),
  "sync-alerts": () => syncAlerts(),
  "copy-bridge": () => copyBridgeScript(),
  "disconnect-bridge": () => disconnectBridge(),
  "ask-claude": () => (sheet.open ? stepSheet({ kind: "claude" }) : openSheet({ kind: "claude" })),
  "claude-focus": (el) => {
    if (ui.claudeFocus === el.dataset.focus) return;
    ui.claudeFocus = el.dataset.focus;
    renderSheet();
  },
  "copy-claude": () => copyClaudePrompt()
};

const forms = {
  "onboard": finishOnboarding,
  "bill": saveBill,
  "expense": saveExpense,
  "category": saveCategory,
  "budget-settings": saveBudgetSettings,
  "paste-alert": readPastedAlert,
  "bridge": saveBridge
};

document.addEventListener("click", (event) => {
  const tab = event.target.closest(".tab[data-tab]");
  if (tab) return goto(tab.dataset.tab);
  const link = event.target.closest("[data-goto]");
  if (link) return goto(link.dataset.goto);
  const el = event.target.closest("[data-action]");
  if (el && !el.disabled && actions[el.dataset.action]) actions[el.dataset.action](el);
});

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-form]");
  if (!form || !forms[form.dataset.form]) return;
  event.preventDefault();
  formError(form, "");
  forms[form.dataset.form](form);
});

document.addEventListener("input", (event) => {
  if (event.target.id === "activitySearch") {
    ui.search = event.target.value;
    app.classList.remove("is-entering");
    document.querySelector("#activityList").innerHTML = activityListHtml(viewPeriod());
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "activityCategory") {
    ui.category = event.target.value;
    app.classList.remove("is-entering");
    document.querySelector("#activityList").innerHTML = activityListHtml(viewPeriod());
  } else if (event.target.id === "restoreFile" && event.target.files?.[0]) {
    restoreBackup(event.target.files[0]);
    event.target.value = "";
  }
});

document.addEventListener("focusout", (event) => {
  if (event.target.matches?.("input.money")) event.target.value = formatMoneyInput(event.target.value);
});

// Clicking the dimmed area (the dialog element itself, outside the panel) closes.
sheet.addEventListener("click", (event) => {
  if (event.target === sheet) closeSheet();
});
sheet.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeSheet();
});
sheet.addEventListener("close", () => {
  ui.sheet = null;
  document.body.append(toastRegion);
});

// Keep "today" honest for an app left open overnight.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const now = toDateInputValue(new Date());
  if (now !== today) {
    today = now;
    if (!ui.sheet) render();
  }
  maybeAutoSync();
});

window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", () => {
  if (validTheme(settings.theme) === "system") applyTheme();
});

if ("serviceWorker" in navigator) {
  let updateToastShown = false;
  let reloading = false;
  const promptUpdate = (worker) => {
    if (!worker || updateToastShown) return;
    updateToastShown = true;
    showToast("A new version is ready.", { duration: 12000, undoLabel: "Reload", undo: () => worker.postMessage({ type: "SKIP_WAITING" }) });
  };
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js").then((registration) => {
      if (!registration) return;
      if (registration.waiting) promptUpdate(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const incoming = registration.installing;
        incoming?.addEventListener("statechange", () => {
          if (incoming.state === "installed" && navigator.serviceWorker.controller) promptUpdate(incoming);
        });
      });
    }).catch((error) => console.warn("Service worker registration skipped", error));
  });
}

if (!(await resetUpNextBrowserStateIfRequested())) {
  loadState();
  render();
  window.upnextSplashDone?.();
  const params = new URLSearchParams(window.location.search);
  if (hasCompletedOnboarding() && params.get("add") === "expense") openSheet({ kind: "add", mode: "expense" });
  retireCloudSync();
  maybeAutoSync();
  navigator.storage?.persist?.().catch(() => {});
}
