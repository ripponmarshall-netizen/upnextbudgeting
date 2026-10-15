// Bank alert parsing. Pure functions, no DOM: an alert email (or pasted SMS
// text) goes in, a draft expense comes out for the user to confirm. Formats
// differ by bank and change without notice, so parsing is pattern-based and
// every result is reviewed before it touches the budget.

import { parseMoneyInput, toDateInputValue } from "./core.js";

const BANKS = [
  ["NCB", /\b(?:j?ncb|national commercial bank)\b/i],
  ["Scotiabank", /scotia/i],
  ["First Global", /first\s*global|\bfgb\b/i],
  ["JN Bank", /\bjn\s*bank\b|\bjnbs\b|jamaica national/i],
  ["CIBC Caribbean", /\bcibc\b|firstcaribbean/i],
  ["JMMB", /\bjmmb\b/i],
  ["VM", /\bvm\s*(?:bs|group|building)\b|victoria mutual/i]
];

// "JMD 1,234.56", "J$1,234", "US$ 12.99", "$500.00"
const AMOUNT_BEFORE = /(JMD|JM\$|J\$|USD|US\$|\$)\s?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
// "1,234.56 JMD"
const AMOUNT_AFTER = /(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)\s?(JMD|USD)\b/gi;
// "Amount: 1,234.56" with no currency marker
const AMOUNT_LABEL = /\bamount\s*[:\-]?\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/gi;
// Figures that follow these words are balances or limits, not the charge.
const NOT_THE_CHARGE = /(balance|available|avail\.?|limit)\W{0,3}(?:\w+\W{1,3}){0,2}$/i;

const CREDIT_WORDS = /\b(credited|credit to your|deposit(?:ed)?|received|refund(?:ed)?|incoming|reversal)\b/i;
const DEBIT_WORDS = /\b(debit(?:ed)?|purchase[sd]?|spent|withdrawal|withdrawn|charged|payment|pos)\b/i;

function normalise(text) {
  return String(text ?? "").replace(/ /g, " ").replace(/[ \t]+/g, " ").replace(/\r/g, "").trim();
}

function currencyOf(marker) {
  return /^US/i.test(marker) ? "USD" : "JMD";
}

function findAmount(text) {
  const candidates = [];
  for (const m of text.matchAll(AMOUNT_BEFORE)) candidates.push({ index: m.index, currency: currencyOf(m[1]), raw: m[2] });
  for (const m of text.matchAll(AMOUNT_AFTER)) candidates.push({ index: m.index, currency: currencyOf(m[2]), raw: m[1] });
  for (const m of text.matchAll(AMOUNT_LABEL)) candidates.push({ index: m.index, currency: "JMD", raw: m[1] });
  candidates.sort((a, b) => a.index - b.index);
  const charge = candidates.find((c) => !NOT_THE_CHARGE.test(text.slice(Math.max(0, c.index - 40), c.index)));
  if (!charge) return null;
  const amount = parseMoneyInput(charge.raw);
  return amount > 0 ? { amount, currency: charge.currency } : null;
}

function cleanMerchant(value) {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[.,;:\-\s]+$/, "")
    .trim();
  if (!text || /^\d{1,2}[:.]\d{2}/.test(text) || /^\d+$/.test(text)) return "";
  // "Thank you for banking at NCB" names the bank, not the shop.
  if (BANKS.some(([, re]) => re.test(text)) && text.split(" ").length <= 2) return "";
  return text.slice(0, 40);
}

function findMerchant(text) {
  const labelled = text.match(/\b(?:merchant(?:\s*name)?|payee|location|description)\s*[:\-]\s*([^\n|]+)/i);
  if (labelled) {
    const name = cleanMerchant(labelled[1]);
    if (name) return name;
  }
  const at = /\bat\s+([A-Za-z0-9][A-Za-z0-9&'.*\/#\- ]{1,48}?)(?=\s+(?:on|using|with|for|from|in|via)\b|\.(?:\s|$)|[,;\n(]|$)/g;
  for (const m of text.matchAll(at)) {
    const name = cleanMerchant(m[1]);
    if (name) return name;
  }
  return "";
}

export function detectBank(text) {
  const hit = BANKS.find(([, re]) => re.test(text));
  return hit ? hit[0] : "";
}

// `message` is { id, date (ISO), from, subject, body }. Returns null when the
// text has no recognisable amount.
export function parseBankAlert(message) {
  const subject = normalise(message?.subject);
  const body = normalise(message?.body);
  const text = `${subject}\n${body}`;
  const found = findAmount(text);
  if (!found) return null;
  const credit = CREDIT_WORDS.test(text);
  const debit = DEBIT_WORDS.test(text);
  const when = message?.date ? new Date(message.date) : null;
  return {
    id: String(message?.id || ""),
    bank: detectBank(`${message?.from || ""}\n${text}`),
    merchant: findMerchant(body) || findMerchant(subject),
    amount: found.amount,
    currency: found.currency,
    kind: credit && !debit ? "credit" : "debit",
    date: when && !Number.isNaN(when.getTime()) ? toDateInputValue(when) : "",
    snippet: body.slice(0, 280)
  };
}

// Stable id for pasted text so pasting the same alert twice is caught.
export function textId(text) {
  let hash = 2166136261;
  for (const char of normalise(text)) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `paste:${(hash >>> 0).toString(36)}`;
}

const SEEN_LIMIT = 1500;

// Fold fetched messages into the review queue. Messages already queued or
// already handled (`seen`) are skipped; deposits and unparseable messages are
// marked seen so they don't come back on the next sync.
export function ingestAlerts(state, messages) {
  const seen = new Set(state.seen);
  const pending = [...state.pending];
  const queued = new Set(pending.map((alert) => alert.id));
  const counts = { added: 0, credits: 0, unreadable: 0 };
  for (const message of messages || []) {
    const id = String(message?.id || "");
    if (!id || seen.has(id) || queued.has(id)) continue;
    const alert = parseBankAlert(message);
    if (!alert) {
      seen.add(id);
      counts.unreadable += 1;
    } else if (alert.kind === "credit") {
      seen.add(id);
      counts.credits += 1;
    } else {
      pending.push(alert);
      queued.add(id);
      counts.added += 1;
    }
  }
  pending.sort((a, b) => b.date.localeCompare(a.date));
  return { pending, seen: [...seen].slice(-SEEN_LIMIT), counts };
}

// The category last used for this merchant, so repeat shops file themselves.
export function guessCategory(merchant, expenses) {
  const key = String(merchant || "").trim().toLowerCase();
  if (!key) return "";
  const match = [...expenses]
    .filter((expense) => !expense.deletedAt && String(expense.merchant || "").trim().toLowerCase() === key)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  return match?.category || "";
}
