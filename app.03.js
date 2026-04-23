          <p class="kicker">UpNextBudgeting</p>
          <p class="welcome-line">Welcome back, Marshall.</p>
          <h1>Due next</h1>
          <p class="hero-subtitle">Here's what you have up next.</p>
        </div>
      </div>
      <button class="icon-button" id="openSheet" type="button" aria-label="Add a bill">${icon("plus")}</button>
    </header>

    <section class="due-stack" aria-label="Next unpaid bills">
      ${nextThree.map(renderBillCard).join("")}
    </section>

    ${renderRecurringPrompt()}

    ${renderReminderStrip()}

    <div class="summary-strip">
      <div>
        <strong>${Math.max(moreThisMonth, 0)} more due this month</strong>
        <p class="small-note">Next check: ${longDateFormat.format(parseDate(nextThree[0]?.due || today.toISOString().slice(0, 10)))}</p>
      </div>
      <span class="status">This month</span>
    </div>

    <aside class="notice-panel">
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
      <div class="preset-panel ${presetsOpen ? "is-open" : ""}" ${presetsOpen ? "" : "hidden"}>
        <section class="preset-grid" aria-label="Suggested Jamaica-first bill types">
          ${presets.slice(0, 6).map(renderPresetCard).join("")}
        </section>
      </div>
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
  });
  document.querySelector("#dismissRecurring")?.addEventListener("click", () => {
    pendingRecurringBillId = null;
    saveState();
    render();
  });
  document.querySelectorAll("[data-paid]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const bill = bills.find((item) => item.id === Number(button.dataset.paid));
      if (bill) {
        bill.paid = true;
        pendingRecurringBillId = bill.repeat && bill.repeat !== "none" ? bill.id : null;
        saveState();
      }
      render();
    });
  });
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

function renderReminderStrip() {
  const reminders = getReminderItems();
  if (!reminders.length) return "";
  const overdue = reminders.filter((bill) => daysUntil(bill.due) < 0).length;
  const dueSoon = reminders.length - overdue;
  return `
    <section class="reminder-strip" aria-label="Due reminders">
      <span class="notice-mark">${icon("alert")}</span>
      <div>
        <strong>${overdue ? `${overdue} overdue` : `${dueSoon} due soon`}</strong>
        <p class="small-note">${reminders.slice(0, 2).map((bill) => bill.name).join(" and ")} need attention within ${settings.reminderDays} days.</p>
      </div>
    </section>
  `;
}

function renderBillCard(bill) {
  const category = getCategory(bill.category);
  const overdue = !bill.paid && daysUntil(bill.due) < 0;
  const glyph = categoryIconName(bill.category);
  return `
    <article class="bill-card ${overdue ? "is-overdue" : ""}" style="--accent:${category.color}" data-edit-bill="${bill.id}" tabindex="0" role="button" aria-label="Edit ${bill.name}">
      <div class="bill-row">
        <div class="bill-heading">
          <span class="category-glyph" aria-hidden="true">${icon(glyph)}</span>
          <div class="bill-title">
            <p class="eyebrow">${bill.category}</p>
            <h3>${bill.name}</h3>
          </div>
        </div>
        <p class="amount">${money.format(bill.amount)}</p>
      </div>
      <div class="card-meta">
        <span class="status ${overdue ? "overdue" : ""}">${statusText(bill)}</span>
        <span class="status">${dateFormat.format(parseDate(bill.due))}</span>
        <button class="mark-button" data-paid="${bill.id}" type="button">Mark paid</button>
      </div>
    </article>
  `;
}

function renderRecurringPrompt() {
  const bill = bills.find((item) => item.id === pendingRecurringBillId);
  if (!bill) return "";
  return `
    <section class="recurring-prompt" aria-label="Recurring bill follow-up">
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
    <header class="topbar">
      <div class="brand-line">
        <img class="brandmark" src="assets/icon.svg" alt="">
        <div>
          <p class="kicker">Due-date view</p>
          <h1>Calendar</h1>
        </div>
      </div>
      <button class="icon-button light" id="openSheet" type="button" aria-label="Add a bill">${icon("plus")}</button>
    </header>

    <div class="month-line calendar-controls">
      <button class="secondary-action month-nav" id="prevMonth" type="button" aria-label="Previous month">${icon("chevron")}</button>
      <h2>${monthName(visibleMonth)}</h2>
      <button class="secondary-action month-nav next" id="nextMonth" type="button" aria-label="Next month">${icon("chevron")}</button>
      <span class="status">${monthBills.filter((bill) => !bill.paid).length} unpaid</span>
    </div>

    <section class="calendar-grid" aria-label="${monthName(visibleMonth)} calendar">
      ${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => `<div class="weekday">${day}</div>`).join("")}
      ${days.map((day) => renderCalendarDay(day, monthBills)).join("")}
    </section>

    <div class="section-heading">
      <h2>Agenda</h2>
      <span class="mini-label">${monthLabel(visibleCalendarMonth)}</span>
    </div>
    <section class="agenda-list">
      ${monthBills.map(renderAgendaCard).join("")}
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
}

function renderCalendarDay(day, monthBills) {
  if (!day) return `<div class="calendar-day is-muted" aria-hidden="true"></div>`;
  const matches = monthBills.filter((bill) => parseDate(bill.due).getDate() === day);
  const hasOverdue = matches.some((bill) => !bill.paid && daysUntil(bill.due) < 0);
  const category = matches[0] ? getCategory(matches[0].category) : null;
  return `
    <div class="calendar-day ${matches.length ? "has-bill" : ""} ${hasOverdue ? "has-overdue" : ""}">
      ${day}
      ${matches.length ? `<span class="dot" style="--accent:${category.color}"></span>` : ""}
    </div>
  `;
}

function renderAgendaCard(bill) {
  const category = getCategory(bill.category);
  return `
    <article class="agenda-card" style="border-left: 5px solid ${category.color}">
      <div class="budget-line">
        <div>
          <p class="eyebrow">${longDateFormat.format(parseDate(bill.due))}</p>
          <h3 class="agenda-title">${bill.name}</h3>
        </div>
        <p class="amount">${money.format(bill.amount)}</p>
      </div>
      <p class="small-note">${bill.paid ? "Already paid" : statusText(bill)} · ${bill.category}</p>
    </article>
  `;
