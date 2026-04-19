      <p class="settings-copy">More app settings can live here later.</p>
    </section>
  `;
  setupMonthlyHistory();
  setupReminderSettings();
  setupPushControls();
  setupBackupControls();
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
  });

  deleteBillButton.addEventListener("click", () => {
    if (!editingBillId) return;
    const bill = bills.find((item) => item.id === editingBillId);
    if (!bill || !confirm(`Delete ${bill.name}?`)) return;
    bills = bills.filter((item) => item.id !== editingBillId);
    pendingRecurringBillId = pendingRecurringBillId === editingBillId ? null : pendingRecurringBillId;
    saveState();
    closeSheet();
    render();
  });

  document.querySelector("#closeSheet").addEventListener("click", closeSheet);
  document.querySelector("#closeSettingsSheet").addEventListener("click", closeSettingsSheet);
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
  selectedBudgetCategory = categories.some((category) => category.name === state.selectedBudgetCategory) ? state.selectedBudgetCategory : categories[0]?.name;
  selectedHistoryMonth = state.selectedHistoryMonth || selectedHistoryMonth;
  visibleCalendarMonth = state.visibleCalendarMonth || visibleCalendarMonth;
  pendingRecurringBillId = null;
  syncBillCategoryOptions(selectedBudgetCategory);
  saveState();
  render();
  renderSettingsContent();
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
