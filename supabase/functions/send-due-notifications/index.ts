import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { configureWebPush, sendWebPush } from "../_shared/push.ts";

const MS_PER_DAY = 86_400_000;

function jamaicaToday() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date());
}

function daysBetween(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T12:00:00Z`);
  const end = new Date(`${endDate}T12:00:00Z`);
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

function notificationCopy(bills: Array<{ name: string; due: string; amount: number }>, today: string) {
  const dueTomorrow = bills.filter((bill) => daysBetween(today, bill.due) === 1);
  if (dueTomorrow.length === 1) {
    return {
      title: `Due tomorrow: ${dueTomorrow[0].name}`,
      body: `${bills.length} bill${bills.length === 1 ? "" : "s"} due within 5 days. Open UpNextBudgeting to review.`,
    };
  }
  if (dueTomorrow.length > 1) {
    return {
      title: `${dueTomorrow.length} bills due tomorrow`,
      body: `${dueTomorrow.map((bill) => bill.name).slice(0, 3).join(", ")}${dueTomorrow.length > 3 ? ", and more" : ""}.`,
    };
  }
  return {
    title: "Bills coming up soon",
    body: `${bills.length} bill${bills.length === 1 ? "" : "s"} due in the next 5 days.`,
  };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    configureWebPush();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const today = jamaicaToday();
    const windowEnd = new Date(`${today}T12:00:00Z`);
    windowEnd.setUTCDate(windowEnd.getUTCDate() + 5);
    const windowEndDate = windowEnd.toISOString().slice(0, 10);

    const { data: subscriptions, error: subscriptionError } = await supabase
      .from("notification_subscriptions")
      .select("id, subscription")
      .eq("enabled", true);
    if (subscriptionError) throw subscriptionError;

    const results = [];
    for (const subscription of subscriptions || []) {
      const { data: existingLog } = await supabase
        .from("notification_send_log")
        .select("id")
        .eq("subscription_id", subscription.id)
        .eq("send_date", today)
        .maybeSingle();
      if (existingLog) {
        results.push({ subscriptionId: subscription.id, skipped: "already-sent" });
        continue;
      }

      const { data: bills, error: billError } = await supabase
        .from("bill_notification_snapshots")
        .select("name, due, amount")
        .eq("subscription_id", subscription.id)
        .eq("paid", false)
        .gte("due", today)
        .lte("due", windowEndDate)
        .order("due", { ascending: true });
      if (billError) throw billError;
      if (!bills?.length) {
        results.push({ subscriptionId: subscription.id, skipped: "no-due-bills" });
        continue;
      }

      const copy = notificationCopy(bills, today);
      await sendWebPush(subscription.subscription, {
        ...copy,
        data: { url: "/" },
      });

      const { error: logError } = await supabase.from("notification_send_log").insert({
        subscription_id: subscription.id,
        send_date: today,
        title: copy.title,
        body: copy.body,
        bill_count: bills.length,
      });
      if (logError) throw logError;
      results.push({ subscriptionId: subscription.id, sent: true, billCount: bills.length });
    }

    return jsonResponse({ ok: true, today, results });
  } catch (error) {
    return jsonResponse({ error: error.message || "Could not send notifications" }, 500);
  }
});
