// Pure budgeting math. No DOM, no app globals — everything the UI shows is
// derived from these functions so the numbers agree on every screen.

export function roundMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}

export function sumMoney(values) {
  return roundMoney(values.reduce((sum, value) => sum + (Number(value) || 0), 0));
}

export function parseMoneyInput(value) {
  const text = String(value ?? "").trim();
  if (text.startsWith("-")) return 0;
  let normalized = "";
  let hasDecimal = false;
  for (const char of text) {
    if (char >= "0" && char <= "9") normalized += char;
    else if (char === "." && !hasDecimal) {
      normalized += char;
      hasDecimal = true;
    }
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.round(parsed * 100) / 100);
}

export function parseDate(value) {
  return new Date(`${value}T12:00:00`);
}

export function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(value, days) {
  const date = parseDate(value);
  date.setDate(date.getDate() + days);
  return toDateInputValue(date);
}

// Whole days from `from` to `to` (both YYYY-MM-DD). Noon anchoring keeps DST
// shifts from producing off-by-one results.
export function daysBetween(from, to) {
  return Math.round((parseDate(to) - parseDate(from)) / 86400000);
}

export function advanceDueDate(value, repeat) {
  const next = parseDate(value);
  const targetDay = next.getDate();
  if (repeat === "monthly") next.setMonth(next.getMonth() + 1);
  else if (repeat === "quarterly") next.setMonth(next.getMonth() + 3);
  else if (repeat === "yearly") next.setFullYear(next.getFullYear() + 1);
  else return value;
  // Jan 31 + 1 month rolls to Mar 3; clamp to the last day of the intended month.
  if (next.getDate() !== targetDay) next.setDate(0);
  return toDateInputValue(next);
}

export function clampStartDay(day, fallback = 25) {
  const n = Number(day);
  return Number.isFinite(n) && n > 0 ? Math.max(1, Math.min(28, Math.round(n))) : fallback;
}

// A budget period runs from `startDay` of one month to the day before
// `startDay` of the next — i.e. payday to payday.
export function getBudgetPeriod(startDay, reference) {
  const day = clampStartDay(startDay);
  const ref = typeof reference === "string" ? parseDate(reference) : reference;
  const month = ref.getDate() >= day ? ref.getMonth() : ref.getMonth() - 1;
  const start = new Date(ref.getFullYear(), month, day, 12);
  const next = new Date(start.getFullYear(), start.getMonth() + 1, day, 12);
  const last = new Date(next.getFullYear(), next.getMonth(), next.getDate() - 1, 12);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(last),
    nextStartDate: toDateInputValue(next)
  };
}

export function shiftPeriod(period, offset, startDay) {
  if (!offset) return period;
  const start = parseDate(period.startDate);
  start.setMonth(start.getMonth() + offset);
  return getBudgetPeriod(startDay, start);
}

export function inPeriod(value, period) {
  return Boolean(value) && value >= period.startDate && value < period.nextStartDate;
}

export function isActiveBill(bill) {
  return !bill.archived && !bill.deletedAt;
}

// Unpaid bills a period still has to cover. The period containing today also
// carries overdue bills from earlier periods, since that money is still owed.
export function openBillsFor(bills, period, today) {
  const isCurrent = inPeriod(today, period);
  return bills.filter((bill) => {
    if (bill.paid || !isActiveBill(bill)) return false;
    if (inPeriod(bill.due, period)) return true;
    return isCurrent && bill.due < period.startDate;
  });
}

export function periodSummary({ bills, expenses, income, period, today }) {
  const periodExpenses = expenses.filter((e) => !e.deletedAt && inPeriod(e.date, period));
  const paidBills = bills.filter((b) => b.paid && isActiveBill(b) && inPeriod(b.due, period));
  const open = openBillsFor(bills, period, today);
  const spentExpenses = sumMoney(periodExpenses.map((e) => e.amount));
  const spentBills = sumMoney(paidBills.map((b) => b.amount));
  const spent = roundMoney(spentExpenses + spentBills);
  const billsLeft = sumMoney(open.map((b) => b.amount));
  const safeToSpend = roundMoney(income - spent - billsLeft);
  const isCurrent = inPeriod(today, period);
  const daysLeft = isCurrent ? daysBetween(today, period.endDate) + 1 : 0;
  return {
    income: roundMoney(income),
    spentExpenses,
    spentBills,
    spent,
    billsLeft,
    openCount: open.length,
    safeToSpend,
    isCurrent,
    daysLeft,
    perDay: daysLeft > 0 ? roundMoney(Math.max(0, safeToSpend) / daysLeft) : 0
  };
}

// Planned vs actual per category. `spent` is money already gone (expenses and
// paid bills); `scheduled` is unpaid bills the category still has to cover.
export function categoryBreakdown({ categories, bills, expenses, period, today }) {
  const open = openBillsFor(bills, period, today);
  const rows = categories.map((category) => {
    const spent = sumMoney([
      ...expenses.filter((e) => !e.deletedAt && e.category === category.name && inPeriod(e.date, period)).map((e) => e.amount),
      ...bills.filter((b) => b.paid && isActiveBill(b) && b.category === category.name && inPeriod(b.due, period)).map((b) => b.amount)
    ]);
    const scheduled = sumMoney(open.filter((b) => b.category === category.name).map((b) => b.amount));
    const planned = roundMoney(category.planned);
    return {
      name: category.name,
      color: category.color,
      planned,
      spent,
      scheduled,
      remaining: roundMoney(planned - spent - scheduled)
    };
  });
  const totalPlanned = sumMoney(rows.map((r) => r.planned));
  return { rows, totalPlanned };
}

export function transactionsFor({ bills, expenses, period }) {
  const items = [
    ...expenses
      .filter((e) => !e.deletedAt && inPeriod(e.date, period))
      .map((e) => ({ kind: "expense", id: e.id, name: e.merchant, category: e.category, amount: e.amount, date: e.date, createdAt: e.createdAt || "" })),
    ...bills
      .filter((b) => b.paid && isActiveBill(b) && inPeriod(b.due, period))
      .map((b) => ({ kind: "bill", id: b.id, name: b.name, category: b.category, amount: b.amount, date: b.due, createdAt: b.completedAt || "" }))
  ];
  return items.sort((a, b) => b.date.localeCompare(a.date) || String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function sortOpenBills(items) {
  return [...items].sort((a, b) => a.due.localeCompare(b.due) || a.name.localeCompare(b.name));
}

// Ids must stay within Number.MAX_SAFE_INTEGER: they round-trip through
// data-attributes and Supabase client_id strings as numbers.
let idCounter = 0;
export function newId(now = Date.now()) {
  idCounter = (idCounter + 1) % 1000;
  return now * 1000 + idCounter;
}
