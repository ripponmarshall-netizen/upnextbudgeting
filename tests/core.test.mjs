import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceDueDate,
  categoryBreakdown,
  getBudgetPeriod,
  newId,
  openBillsFor,
  parseMoneyInput,
  periodSummary,
  shiftPeriod,
  transactionsFor
} from "../core.js";

const bill = (over) => ({ id: 1, name: "Bill", category: "Home", amount: 0, due: "2026-10-01", paid: false, archived: false, deletedAt: null, ...over });
const expense = (over) => ({ id: 1, merchant: "Shop", category: "Groceries", amount: 0, date: "2026-10-01", deletedAt: null, ...over });

test("parseMoneyInput accepts formatted input and rejects negatives", () => {
  assert.equal(parseMoneyInput("18,500.50"), 18500.5);
  assert.equal(parseMoneyInput("$1,2.3.4"), 12.34);
  assert.equal(parseMoneyInput("-200"), 0);
  assert.equal(parseMoneyInput(""), 0);
});

test("advanceDueDate clamps to month end", () => {
  assert.equal(advanceDueDate("2026-01-31", "monthly"), "2026-02-28");
  assert.equal(advanceDueDate("2026-11-30", "quarterly"), "2027-02-28");
  assert.equal(advanceDueDate("2028-02-29", "yearly"), "2029-02-28");
  assert.equal(advanceDueDate("2026-05-10", "none"), "2026-05-10");
});

test("budget period runs payday to the day before next payday", () => {
  assert.deepEqual(getBudgetPeriod(25, "2026-10-04"), { startDate: "2026-09-25", endDate: "2026-10-24", nextStartDate: "2026-10-25" });
  assert.deepEqual(getBudgetPeriod(25, "2026-10-25"), { startDate: "2026-10-25", endDate: "2026-11-24", nextStartDate: "2026-11-25" });
  assert.deepEqual(getBudgetPeriod(1, "2026-01-15"), { startDate: "2026-01-01", endDate: "2026-01-31", nextStartDate: "2026-02-01" });
  // Year boundary
  assert.equal(getBudgetPeriod(25, "2026-01-03").startDate, "2025-12-25");
});

test("shiftPeriod moves whole periods", () => {
  const p = getBudgetPeriod(25, "2026-10-04");
  assert.equal(shiftPeriod(p, -1, 25).startDate, "2026-08-25");
  assert.equal(shiftPeriod(p, 2, 25).startDate, "2026-11-25");
});

test("current period carries overdue bills; past periods do not", () => {
  const today = "2026-10-04";
  const current = getBudgetPeriod(25, today);
  const previous = shiftPeriod(current, -1, 25);
  const bills = [
    bill({ id: 1, due: "2026-08-01", amount: 100 }), // overdue from an older period
    bill({ id: 2, due: "2026-10-10", amount: 200 }),
    bill({ id: 3, due: "2026-10-30", amount: 400 }), // next period
    bill({ id: 4, due: "2026-10-11", amount: 800, archived: true })
  ];
  assert.deepEqual(openBillsFor(bills, current, today).map((b) => b.id), [1, 2]);
  assert.deepEqual(openBillsFor(bills, previous, today).map((b) => b.id), []);
});

test("periodSummary: safe to spend = income − spent − bills left", () => {
  const today = "2026-10-04";
  const period = getBudgetPeriod(25, today);
  const s = periodSummary({
    income: 100000,
    period,
    today,
    bills: [
      bill({ id: 1, due: "2026-09-26", amount: 30000, paid: true }),
      bill({ id: 2, due: "2026-10-20", amount: 10000 }),
      bill({ id: 3, due: "2026-11-01", amount: 99999 })
    ],
    expenses: [
      expense({ id: 1, date: "2026-10-01", amount: 5000 }),
      expense({ id: 2, date: "2026-09-24", amount: 7000 }), // previous period
      expense({ id: 3, date: "2026-10-02", amount: 1000, deletedAt: "2026-10-03T00:00:00Z" })
    ]
  });
  assert.equal(s.spent, 35000);
  assert.equal(s.billsLeft, 10000);
  assert.equal(s.safeToSpend, 55000);
  assert.equal(s.daysLeft, 21); // Oct 4 → Oct 24 inclusive
  assert.equal(s.perDay, Math.round((55000 / 21) * 100) / 100);
});

test("categoryBreakdown splits spent and scheduled per category", () => {
  const today = "2026-10-04";
  const period = getBudgetPeriod(25, today);
  const { rows, totalPlanned } = categoryBreakdown({
    today,
    period,
    categories: [{ name: "Home", color: "#000", planned: 100000 }, { name: "Groceries", color: "#000", planned: 40000 }],
    bills: [bill({ due: "2026-09-30", amount: 95000, paid: true }), bill({ id: 2, due: "2026-10-22", amount: 6000 })],
    expenses: [expense({ amount: 45000 })]
  });
  assert.equal(totalPlanned, 140000);
  assert.deepEqual(rows[0], { name: "Home", color: "#000", planned: 100000, spent: 95000, scheduled: 6000, remaining: -1000 });
  assert.equal(rows[1].remaining, -5000);
});

test("transactionsFor merges expenses and paid bills newest first", () => {
  const period = getBudgetPeriod(25, "2026-10-04");
  const items = transactionsFor({
    period,
    bills: [bill({ due: "2026-10-02", paid: true, amount: 10 }), bill({ id: 2, due: "2026-10-03", amount: 20 })],
    expenses: [expense({ date: "2026-10-03", amount: 5 })]
  });
  assert.deepEqual(items.map((i) => `${i.kind}:${i.date}`), ["expense:2026-10-03", "bill:2026-10-02"]);
});

test("newId stays a safe, unique integer", () => {
  const now = Date.UTC(2030, 0, 1);
  const ids = Array.from({ length: 500 }, () => newId(now));
  assert.ok(ids.every(Number.isSafeInteger));
  assert.equal(new Set(ids).size, ids.length);
});
