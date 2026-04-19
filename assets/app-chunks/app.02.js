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
    selectedBudgetCategory = categories.some((category) => category.name === state.selectedBudgetCategory) ? state.selectedBudgetCategory : categories[0]?.name;
    selectedHistoryMonth = state.selectedHistoryMonth || selectedHistoryMonth;
    visibleCalendarMonth = state.visibleCalendarMonth || visibleCalendarMonth;
  } catch (error) {
    console.warn("Could not load saved UpNextBudgeting state", error);
    bills = bills.map(normalizeBill);
    saveState();
  }
}

function daysUntil(value) {
  const ms = parseDate(value) - today;
  return Math.round(ms / 86400000);
}

function getCategory(name) {
  return categories.find((category) => category.name === name) || categories[0];
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
  const moreThisMonth = unpaid.filter((bill) => {
    const due = parseDate(bill.due);
    return due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear();
  }).length - nextThree.filter((bill) => parseDate(bill.due).getMonth() === today.getMonth()).length;

  app.innerHTML = `
    <header class="topbar">
      <div class="brand-line">
        <img class="brandmark" src="assets/icon.svg" alt="">
        <div class="hero-copy">
