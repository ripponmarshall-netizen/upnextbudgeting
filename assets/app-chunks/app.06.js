  reminderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    settings.reminderDays = Math.max(0, Math.min(30, cleanAmount(reminderDays.value)));
    saveState();
    render();
    renderSettingsContent();
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
    } catch (error) {
      settings.pushStatus = error.message || "Notification setup failed";
      saveState(false);
    }
    renderSettingsContent();
  });

  syncPushButton.addEventListener("click", async () => {
    settings.notificationToken = tokenInput.value.trim() || settings.notificationToken;
    settings.pushStatus = "Syncing...";
    renderSettingsContent();
    try {
      await syncPushSnapshot();
    } catch (error) {
      settings.pushStatus = error.message || "Notification sync failed";
      saveState(false);
    }
    renderSettingsContent();
  });

  disablePushButton.addEventListener("click", async () => {
    await disablePushNotifications();
    renderSettingsContent();
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
        alert(error.message || "Could not restore backup.");
      } finally {
        event.target.value = "";
      }
    });
    reader.readAsText(file);
  });
}

function activeSheet() {
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
  });

  removeCategory.addEventListener("click", () => {
    if (categories.length <= 1) return;
    const index = categories.findIndex((category) => category.name === editCategory.value);
    if (index < 0) return;
    categories.splice(index, 1);
    selectedBudgetCategory = categories[Math.max(0, index - 1)].name;
    syncBillCategoryOptions(selectedBudgetCategory);
    saveState();
    render();
    renderSettingsContent();
  });

  addCategoryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = newCategoryName.value.trim();
    if (!name || categories.some((category) => category.name.toLowerCase() === name.toLowerCase())) return;
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
  });
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    activeTab = tab.dataset.tab;
    render();
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

loadState();
setupForm();
setupAccessibility();
render();
