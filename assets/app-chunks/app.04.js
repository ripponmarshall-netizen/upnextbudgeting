}

function renderBudget() {
  const totalAssigned = categories.reduce((sum, category) => sum + category.assigned, 0);
  const totalPlanned = categories.reduce((sum, category) => sum + category.planned, 0);

  app.innerHTML = `
    <header class="topbar">
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

    <section class="budget-total">
      <div>
        <p>Assigned this cycle</p>
        <strong>${money.format(totalAssigned)}</strong>
      </div>
      <span class="status">${totalPlanned ? Math.round((totalAssigned / totalPlanned) * 100) : 0}%</span>
    </section>

    <div class="section-heading">
      <h2>Categories</h2>
      <span class="mini-label">simple plan</span>
    </div>

    <section class="budget-list">
      ${categories.map(renderBudgetCard).join("")}
    </section>
  `;

  document.querySelector("#openSheet").addEventListener("click", () => openSheet());
  document.querySelector("#openSettings").addEventListener("click", openSettingsSheet);
}

function renderBudgetCard(category) {
  const percent = category.planned ? Math.min(100, Math.round((category.assigned / category.planned) * 100)) : 0;
  const glyph = categoryIconName(category.name);
  return `
    <article class="budget-card" style="--accent:${category.color}; --value:${percent}%">
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
  if (settingsSheet.hidden) backdrop.hidden = true;
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
  if (sheet.hidden) backdrop.hidden = true;
  lastTrigger?.focus?.();
}

function closeAllSheets() {
  closeSheet();
  closeSettingsSheet();
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
