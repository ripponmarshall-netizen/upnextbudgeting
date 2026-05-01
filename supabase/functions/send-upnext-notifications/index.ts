import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.48.1";
import webpush from "npm:web-push@3.6.7";

type PushSubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  subscription: any;
};

type SettingsRow = {
  user_id: string;
  reminder_days: number | null;
};

type BillRow = {
  user_id: string;
  name: string;
  amount: number;
  due: string;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const vapidSubject = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hello@upnextbudgeting.app";
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function money(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

Deno.serve(async () => {
  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey) {
    return Response.json({ ok: false, error: "Missing Supabase or VAPID secrets" }, { status: 500 });
  }

  const today = new Date();
  const todayDate = dateOnly(today);
  const maxDate = dateOnly(addDays(today, 30));

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("upnext_web_push_subscriptions")
    .select("id,user_id,endpoint,subscription")
    .eq("enabled", true)
    .is("deleted_at", null);
  if (subscriptionError) throw subscriptionError;

  const rows = (subscriptions ?? []) as PushSubscriptionRow[];
  const userIds = [...new Set(rows.map((row) => row.user_id))];
  if (!userIds.length) return Response.json({ ok: true, sent: 0, skipped: "no_subscriptions" });

  const [{ data: settingsRows, error: settingsError }, { data: billRows, error: billError }] = await Promise.all([
    supabase.from("upnext_settings").select("user_id,reminder_days").in("user_id", userIds),
    supabase
      .from("upnext_bills")
      .select("user_id,name,amount,due")
      .in("user_id", userIds)
      .eq("paid", false)
      .eq("archived", false)
      .is("deleted_at", null)
      .lte("due", maxDate)
  ]);
  if (settingsError) throw settingsError;
  if (billError) throw billError;

  const settingsByUser = new Map((settingsRows as SettingsRow[] | null ?? []).map((row) => [row.user_id, row]));
  const billsByUser = new Map<string, BillRow[]>();
  for (const bill of (billRows as BillRow[] | null ?? [])) {
    if (!billsByUser.has(bill.user_id)) billsByUser.set(bill.user_id, []);
    billsByUser.get(bill.user_id)?.push(bill);
  }

  let sent = 0;
  let skipped = 0;
  const failures: Array<{ endpoint: string; reason: string }> = [];

  for (const subscription of rows) {
    const reminderDays = Math.max(0, Math.min(30, settingsByUser.get(subscription.user_id)?.reminder_days ?? 3));
    const windowEnd = dateOnly(addDays(today, reminderDays));
    const dueBills = (billsByUser.get(subscription.user_id) ?? []).filter((bill) => bill.due <= windowEnd);
    if (!dueBills.length) {
      skipped += 1;
      continue;
    }

    const total = dueBills.reduce((sum, bill) => sum + Number(bill.amount || 0), 0);
    const firstBill = dueBills.sort((a, b) => a.due.localeCompare(b.due))[0];
    const body = dueBills.length === 1
      ? `${firstBill.name} is due ${firstBill.due}.`
      : `${dueBills.length} bills are due soon, totaling ${money(total)}.`;

    const payload = JSON.stringify({
      title: "UpNextBudgeting",
      body,
      tag: `upnextbudgeting-${subscription.user_id}-${todayDate}`,
      data: { url: "./?tab=home" }
    });

    try {
      await webpush.sendNotification(subscription.subscription, payload, { TTL: 60 * 60 * 12 });
      await supabase.from("upnext_notification_log").upsert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        notification_date: todayDate,
        summary: body,
        bill_count: dueBills.length,
        amount: total
      }, { onConflict: "user_id,subscription_id,notification_date" });
      sent += 1;
    } catch (error) {
      const statusCode = Number((error as { statusCode?: number }).statusCode || 0);
      const reason = error instanceof Error ? error.message : "Unknown push error";
      failures.push({ endpoint: subscription.endpoint, reason });
      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from("upnext_web_push_subscriptions")
          .update({ enabled: false, deleted_at: new Date().toISOString() })
          .eq("id", subscription.id);
      }
    }
  }

  return Response.json({ ok: true, sent, skipped, failures: failures.slice(0, 10) });
});
