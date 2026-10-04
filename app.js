import {
  addDays,
  advanceDueDate,
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

const STORAGE_KEY = "upnextbudgeting:v1";
// Keys left behind by the retired Supabase sync; cleared once on load.
const LEGACY_SYNC_KEYS = ["upnextbudgeting:sync", "upnextbudgeting:supabase-auth"];
const BADGE_REMINDER_DAYS = 5;
const DEFAULT_SOURCES = ["Cash", "Debit card", "Credit card", "Bank transfer"];
const REPEATS = { none: "One-time", monthly: "Monthly", quarterly: "Quarterly", yearly: "Yearly" };
const MAX_PERIOD_OFFSET = 1;

async function resetUpNextBrowserStateIfRequested() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("reset") !== "1") return false;
  try {
    localStorage.removeItem(STORAGE_KEY);
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
  repeat: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/></svg>`
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

const ui = {
  tab: initialTab(),
  offset: 0,
  billsView: "upcoming",
  search: "",
  category: "All",
  lastCategory: "",
  sheet: null
};

/* ---------- formatting ---------- */

const money0 = new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
const money2 = new Intl.NumberFormat("en-JM", { style: "currency", currency: "JMD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const inputMoney = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const dayMonth = new Intl.DateTimeFormat("en-JM", { day: "numeric", month: "short" });
const weekdayDate = new Intl.DateTimeFormat("en-JM", { weekday: "long", day: "numeric", month: "short" });

function money(value) {
  const n = roundMoney(value);
  return (Number.isInteger(n) ? money0 : money2).format(n);
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
    createdAt,
    updatedAt: expense.updatedAt || createdAt,
    deletedAt: expense.deletedAt || null
  };
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
// silently drops a monthly bill.
function markPaid(id) {
  const bill = billById(id);
  if (!bill || bill.paid) return;
  const before = cloneBill(bill);
  bill.paid = true;
  bill.completedAt = nowIso();
  appendActivity(bill, "paid");
  let next = null;
  if (bill.repeat !== "none") {
    const due = advanceDueDate(bill.due, bill.repeat);
    const exists = activeBills().some((item) => item !== bill && item.seriesKey === bill.seriesKey && item.due === due);
    if (!exists) {
      next = normalizeBill({
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
    }
  }
  commit();
  showToast(next ? `${bill.name} paid · next due ${shortDate(next.due)}` : `${bill.name} paid`, {
    undo: () => {
      restoreBill(before);
      if (next) removeBill(next.id);
      commit();
    }
  });
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
  if (existing) {
    const changed = ["name", "amount", "due", "category", "repeat"].some((key) => existing[key] !== payload[key]);
    Object.assign(existing, payload);
    const paid = data.paid === "on";
    if (paid !== existing.paid) {
      existing.paid = paid;
      existing.completedAt = paid ? nowIso() : null;
      appendActivity(existing, paid ? "paid" : "unpaid");
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
  showToast(existing ? `${name} updated` : `${name} added`);
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
  let created = null;
  if (existing) {
    Object.assign(existing, payload, { updatedAt: nowIso() });
  } else {
    created = normalizeExpense({ id: newId(), ...payload, createdAt: nowIso() });
    expenses.push(created);
  }
  closeSheet();
  commit();
  showToast(existing ? "Expense updated" : `${money(amount)} · ${payload.merchant}`, created ? {
    undo: () => { removeExpense(created.id); commit(); }
  } : {});
  return true;
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
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return /[",\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
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
  themeColorMeta?.setAttribute("content", resolved === "light" ? "#f5f5f2" : "#0b0c0e");
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
  const count = activeBills().filter((bill) => !bill.paid && daysBetween(today, bill.due) <= BADGE_REMINDER_DAYS).length;
  try {
    if (count && "setAppBadge" in navigator) await navigator.setAppBadge(count);
    if (!count && "clearAppBadge" in navigator) await navigator.clearAppBadge();
  } catch {
    /* badge API is best-effort */
  }
}

/* ---------- view pieces ---------- */

function topbar(title, eyebrow = "") {
  return `
    <header class="topbar">
      <div>
        ${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ""}
        <h1>${esc(title)}</h1>
      </div>
      <button class="icon-btn" data-action="settings" type="button" aria-label="Settings">${icons.gear}</button>
    </header>
  `;
}

function periodSwitch(period) {
  const offsetCopy = ui.offset === 0 ? "This period" : ui.offset === -1 ? "Last period" : ui.offset === 1 ? "Next period" : `${Math.abs(ui.offset)} periods ago`;
  return `
    <div class="period-switch">
      <button class="icon-btn" data-action="period" data-step="-1" type="button" aria-label="Previous period">${icons.left}</button>
      <div class="period-label" aria-live="polite">
        <strong>${periodLabel(period)}</strong>
        <span>${offsetCopy}</span>
      </div>
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

function meter(parts, total) {
  const segs = parts
    .filter((part) => part.value > 0)
    .map((part) => `<i class="${part.cls}" style="width:${Math.min(100, (part.value / Math.max(total, 1)) * 100).toFixed(2)}%"></i>`)
    .join("");
  return `<div class="meter" aria-hidden="true">${segs}</div>`;
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

function categoryStatus(row) {
  const committed = roundMoney(row.spent + row.scheduled);
  if (!row.planned && !committed) return { text: "No plan", cls: "is-muted" };
  if (!row.planned) return { text: `${money(committed)} unplanned`, cls: "is-warning" };
  if (row.remaining < 0) return { text: `${money(-row.remaining)} over`, cls: "is-danger" };
  return { text: `${money(row.remaining)} left`, cls: "" };
}

function categoryRow(row, { compact = false } = {}) {
  const status = categoryStatus(row);
  const idle = !row.planned && !row.spent && !row.scheduled;
  const base = Math.max(row.planned, row.spent + row.scheduled);
  const detail = idle
    ? "Tap to set a plan"
    : [`${money(row.spent)} spent`, row.scheduled ? `${money(row.scheduled)} due` : "", row.planned ? `of ${money(row.planned)}` : ""].filter(Boolean).join(" · ");
  const over = row.planned > 0 && row.remaining < 0;
  return `
    <li class="row">
      <button class="row-main cat-row" data-action="edit-category" data-name="${esc(row.name)}" type="button">
        <span class="dot" style="--c:${safeCssColor(row.color)}" aria-hidden="true"></span>
        <span class="row-text">
          <span class="row-title">${esc(row.name)}</span>
          ${compact ? "" : `<span class="row-sub">${detail}</span>`}
          ${idle ? "" : meter([
            { value: row.spent, cls: over ? "is-over" : "is-spent" },
            { value: row.scheduled, cls: "is-scheduled" }
          ], base)}
        </span>
        <span class="row-amount ${status.cls}">${status.text}</span>
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
      <img class="onboard-logo" src="assets/icon.svg" alt="" width="56" height="56">
      <h1>Budget from payday to payday.</h1>
      <p class="onboard-copy">Know what's safe to spend after your bills. Everything stays private on this device.</p>
      <form class="form" data-form="onboard" novalidate>
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
    ${topbar("Overview", `${periodLabel(period)} · ${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} to payday`)}

    <section class="card hero" aria-label="Safe to spend">
      <p class="hero-label">Safe to spend</p>
      <p class="hero-amount ${negative ? "is-danger" : ""}">${money(s.safeToSpend)}</p>
      <p class="hero-sub">${!s.income
        ? `<button class="link-btn" data-action="settings" type="button">Set your income</button> to see what's safe to spend.`
        : negative
          ? `You're ${money(-s.safeToSpend)} short before payday.`
          : `About ${money(s.perDay)} a day until payday.`}</p>
      ${meter([{ value: s.spent, cls: "is-spent" }, { value: s.billsLeft, cls: "is-scheduled" }], Math.max(s.income, s.spent + s.billsLeft))}
      <dl class="stats">
        <div><dt>Income</dt><dd>${money(s.income)}</dd></div>
        <div><dt><i class="key is-spent"></i>Spent</dt><dd>${money(s.spent)}</dd></div>
        <div><dt><i class="key is-scheduled"></i>Bills left</dt><dd>${money(s.billsLeft)}</dd></div>
      </dl>
    </section>

    <section class="section">
      ${sectionHead("Upcoming bills", "All bills", "bills")}
      ${upcoming.length
        ? `<ul class="list card">${upcoming.map(billRow).join("")}</ul>`
        : `<div class="card">${emptyState("Nothing due in the next two weeks", "Add rent, utilities, and loans so they never sneak up on you.", `<button class="btn btn-secondary" data-action="add-bill" type="button">Add a bill</button>`)}</div>`}
    </section>

    <section class="section">
      ${sectionHead("Budget", watched.length ? "See all" : "", "budget")}
      ${watched.length
        ? `<ul class="list card">${watched.map((row) => categoryRow(row, { compact: true })).join("")}</ul>`
        : `<div class="card">${emptyState("No plan yet", "Decide how much each category gets this period.", `<button class="btn btn-secondary" data-goto="budget" type="button">Plan your budget</button>`)}</div>`}
    </section>

    <section class="section">
      ${sectionHead("Recent", recent.length ? "All activity" : "", "activity")}
      ${recent.length
        ? `<ul class="list card">${recent.map(txRow).join("")}</ul>`
        : `<div class="card">${emptyState("No spending yet this period", "Tap + to log an expense in a few seconds.")}</div>`}
    </section>
  `;
}

function renderBudget() {
  const period = viewPeriod();
  const { rows, totalPlanned } = categoryBreakdown({ categories, bills, expenses, period, today });
  const s = periodSummary({ bills, expenses, income: income(), period, today });
  const unplanned = roundMoney(s.income - totalPlanned);
  const committed = roundMoney(s.spent + s.billsLeft);
  const headline = !s.income
    ? { label: "Income not set", value: money(0), cls: "" }
    : unplanned > 0
      ? { label: "Left to plan", value: money(unplanned), cls: "is-accent" }
      : unplanned < 0
        ? { label: "Over-planned by", value: money(-unplanned), cls: "is-danger" }
        : { label: "Every dollar has a job", value: money(s.income), cls: "is-accent" };

  app.innerHTML = `
    ${topbar("Budget", "Plan vs. actual")}
    ${periodSwitch(period)}

    <section class="card hero hero-compact">
      <p class="hero-label">${headline.label}</p>
      <p class="hero-amount ${headline.cls}">${headline.value}</p>
      <p class="hero-sub">${money(totalPlanned)} planned of ${money(s.income)} income · ${money(committed)} spent or due</p>
      ${meter([{ value: s.spent, cls: "is-spent" }, { value: s.billsLeft, cls: "is-scheduled" }], Math.max(totalPlanned, committed))}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>Categories</h2>
        <span class="legend"><i class="key is-spent"></i>Spent <i class="key is-scheduled"></i>Due</span>
      </div>
      <ul class="list card">${rows.map((row) => categoryRow(row)).join("")}</ul>
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
  const paid = activeBills().filter((bill) => bill.paid).sort((a, b) => b.due.localeCompare(a.due)).slice(0, 60);
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
    ${topbar("Bills", open.length ? `${open.length} unpaid · ${money(totalOpen)}` : "All caught up")}
    <div class="segmented" role="group" aria-label="Bill view">
      <button type="button" data-action="bills-view" data-view="upcoming" aria-pressed="${ui.billsView === "upcoming"}">Upcoming</button>
      <button type="button" data-action="bills-view" data-view="paid" aria-pressed="${ui.billsView === "paid"}">Paid</button>
    </div>
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
    ${topbar("Activity", "Expenses and paid bills")}
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

function render() {
  const onboarding = !hasCompletedOnboarding();
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
  updateAppBadge();
}

/* ---------- sheets ---------- */

function categoryOptions(selected) {
  const pick = categoryByName(selected) ? selected : fallbackCategoryName();
  return categories.map((category) => `<option ${category.name === pick ? "selected" : ""}>${esc(category.name)}</option>`).join("");
}

function expenseForm(expense = null) {
  const preferred = expense?.category || ui.lastCategory || (ui.category !== "All" ? ui.category : "");
  return `
    <form class="form" data-form="expense" data-id="${esc(expense?.id ?? "")}" novalidate>
      <label class="field field-amount">
        <span>Amount</span>
        <input class="money" name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(expense ? formatMoneyInput(expense.amount) : "")}" ${expense ? "" : "autofocus"} required>
      </label>
      <label class="field">
        <span>Category</span>
        <select name="category">${categoryOptions(preferred)}</select>
      </label>
      <label class="field">
        <span>Note <em>(optional)</em></span>
        <input name="note" autocomplete="off" placeholder="e.g. Hi-Lo, taxi, lunch" value="${esc(expense?.note || (expense && expense.merchant !== expense.category ? expense.merchant : ""))}">
      </label>
      <label class="field">
        <span>Date</span>
        <input name="date" type="date" value="${esc(expense?.date || today)}" required>
      </label>
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary" type="submit">${expense ? "Save changes" : "Add expense"}</button>
      ${expense ? `<button class="btn btn-danger" data-action="delete-expense" data-id="${esc(expense.id)}" type="button">Delete expense</button>` : ""}
    </form>
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
            ${[0, 1, 2, 3, 5, 7, 14].map((d) => `<option value="${d}" ${d === settings.reminderDays ? "selected" : ""}>${d === 0 ? "Same day" : `${d} day${d === 1 ? "" : "s"}`}</option>`).join("")}
          </select>
        </label>
      </div>
      <button class="btn btn-secondary" type="submit">Save</button>
    </form>

    <section class="settings-group">
      <h3>Appearance</h3>
      <div class="segmented" role="group" aria-label="Theme">
        ${["system", "light", "dark"].map((value) => `<button type="button" data-action="theme" data-theme="${value}" aria-pressed="${theme === value}">${value[0].toUpperCase()}${value.slice(1)}</button>`).join("")}
      </div>
    </section>

    <section class="settings-group">
      <h3>Data</h3>
      <div class="stack">
        <button class="btn btn-secondary" data-action="export-csv" type="button">Export ${periodLabel(viewPeriod())} as CSV</button>
        <button class="btn btn-secondary" data-action="export-backup" type="button">Download backup</button>
        <label class="btn btn-secondary file-btn">Restore from backup<input type="file" id="restoreFile" accept="application/json,.json"></label>
        ${hasSampleData() ? `<button class="btn btn-danger" data-action="remove-sample" type="button">Remove sample data</button>` : ""}
      </div>
    </section>
    <p class="fine">Your data is stored only on this device. ${settings.lastBackupAt ? `Last backup ${shortDate(settings.lastBackupAt)}.` : "Download a backup now and then so you can restore it on a new phone."}</p>
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
      <div class="segmented" role="group" aria-label="What are you adding?">
        <button type="button" data-action="add-mode" data-mode="expense" aria-pressed="${state.mode !== "bill"}">Expense</button>
        <button type="button" data-action="add-mode" data-mode="bill" aria-pressed="${state.mode === "bill"}">Bill</button>
      </div>
      ${state.mode === "bill" ? billForm() : expenseForm()}`;
  } else if (state.kind === "bill") {
    const bill = billById(state.id);
    title = bill ? "Edit bill" : "New bill";
    body = billForm(bill);
  } else if (state.kind === "expense") {
    title = "Edit expense";
    body = expenseForm(expenseById(state.id));
  } else if (state.kind === "category") {
    const category = categoryByName(state.name);
    title = category ? category.name : "New category";
    body = categoryForm(category);
  } else if (state.kind === "settings") {
    title = "Settings";
    body = settingsBody();
  }
  sheetTitle.textContent = title;
  sheetBody.innerHTML = body;
}

let sheetCloseTimer = null;
function openSheet(state) {
  window.clearTimeout(sheetCloseTimer);
  sheet.classList.remove("is-closing");
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
    ui.sheet = { kind: "add", mode: el.dataset.mode };
    renderSheet();
  },
  "add-bill": () => openSheet({ kind: "bill" }),
  "close-sheet": () => closeSheet(),
  "settings": () => openSheet({ kind: "settings" }),
  "pay": (el) => markPaid(el.dataset.id),
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
  "remove-sample": () => removeSampleData()
};

const forms = {
  "onboard": finishOnboarding,
  "bill": saveBill,
  "expense": saveExpense,
  "category": saveCategory,
  "budget-settings": saveBudgetSettings
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
    document.querySelector("#activityList").innerHTML = activityListHtml(viewPeriod());
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "activityCategory") {
    ui.category = event.target.value;
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
  const params = new URLSearchParams(window.location.search);
  if (hasCompletedOnboarding() && params.get("add") === "expense") openSheet({ kind: "add", mode: "expense" });
  retireCloudSync();
  navigator.storage?.persist?.().catch(() => {});
}
