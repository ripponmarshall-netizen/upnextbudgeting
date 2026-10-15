import test from "node:test";
import assert from "node:assert/strict";
import { guessCategory, ingestAlerts, parseBankAlert, textId } from "../alerts.js";

// Synthetic alerts written for these tests, shaped like common card alerts.
// They are not copies of any bank's real template; add redacted real ones
// here as they turn up so the parser is checked against what banks send.
const msg = (over) => ({ id: "m1", date: "2026-10-10T15:30:00Z", from: "alerts@bank.example", subject: "Transaction alert", body: "", ...over });

test("reads amount, merchant and date from a card purchase", () => {
  const alert = parseBankAlert(msg({
    from: "NCB Alerts <alerts@jncb.example>",
    body: "Your NCB card ending 1234 was used for a purchase of JMD 2,450.00 at HI-LO HALF WAY TREE on 10-Oct-2026 at 10:32. Available balance JMD 41,200.00"
  }));
  assert.equal(alert.amount, 2450);
  assert.equal(alert.currency, "JMD");
  assert.equal(alert.merchant, "HI-LO HALF WAY TREE");
  assert.equal(alert.bank, "NCB");
  assert.equal(alert.kind, "debit");
  assert.equal(alert.date, "2026-10-10");
});

test("prefers a labelled merchant and skips balance figures", () => {
  const alert = parseBankAlert(msg({
    body: "Available Balance: $90,000.00\nAmount: 1,800.00 JMD\nMerchant Name: TOTAL GAS LIGUANEA\nCard: ****5678"
  }));
  assert.equal(alert.amount, 1800);
  assert.equal(alert.merchant, "TOTAL GAS LIGUANEA");
});

test("flags USD charges", () => {
  const alert = parseBankAlert(msg({ body: "A charge of US$12.99 was made at NETFLIX.COM using your card." }));
  assert.equal(alert.currency, "USD");
  assert.equal(alert.amount, 12.99);
  assert.equal(alert.merchant, "NETFLIX.COM");
});

test("treats deposits as credits and ignores the bank's own name", () => {
  const alert = parseBankAlert(msg({ body: "JMD 150,000.00 was credited to your account. Thank you for banking at Scotiabank." }));
  assert.equal(alert.kind, "credit");
  assert.equal(alert.merchant, "");
});

test("returns null when there is no amount", () => {
  assert.equal(parseBankAlert(msg({ body: "Your statement is ready." })), null);
});

test("ingest queues purchases once and remembers skipped messages", () => {
  const messages = [
    msg({ id: "a", body: "Purchase of JMD 500.00 at KFC" }),
    msg({ id: "b", body: "JMD 9,000.00 deposited to your account" }),
    msg({ id: "c", body: "Your statement is ready." })
  ];
  const first = ingestAlerts({ pending: [], seen: [] }, messages);
  assert.deepEqual(first.counts, { added: 1, credits: 1, unreadable: 1 });
  assert.deepEqual(first.pending.map((a) => a.id), ["a"]);
  assert.deepEqual(first.seen.sort(), ["b", "c"]);
  const again = ingestAlerts(first, messages);
  assert.deepEqual(again.counts, { added: 0, credits: 0, unreadable: 0 });
  assert.equal(again.pending.length, 1);
  const handled = ingestAlerts({ pending: [], seen: [...first.seen, "a"] }, messages);
  assert.equal(handled.pending.length, 0);
});

test("textId is stable across whitespace", () => {
  assert.equal(textId("JMD 500 at  KFC"), textId(" JMD 500 at KFC "));
  assert.notEqual(textId("JMD 500 at KFC"), textId("JMD 501 at KFC"));
});

test("guessCategory uses the latest expense at the same merchant", () => {
  const expenses = [
    { merchant: "KFC", category: "Other", date: "2026-09-01" },
    { merchant: "kfc", category: "Eating out", date: "2026-10-01" },
    { merchant: "KFC", category: "Groceries", date: "2026-10-05", deletedAt: "x" }
  ];
  assert.equal(guessCategory("KFC", expenses), "Eating out");
  assert.equal(guessCategory("Unknown", expenses), "");
});
