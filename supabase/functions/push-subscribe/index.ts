import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

type SnapshotBill = {
  id: string;
  name: string;
  category: string;
  amount: number;
  due: string;
  paid: boolean;
  repeat?: string;
};

type Snapshot = {
  reminderDays?: number;
  bills?: SnapshotBill[];
};

function requireSetupToken(token: string | undefined) {
  const expected = Deno.env.get("UPNEXT_NOTIFICATION_TOKEN");
  if (!expected || token !== expected) throw new Error("Invalid notification setup code.");
}

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

async function syncSnapshot(client: ReturnType<typeof createClient>, subscriptionId: string, snapshot: Snapshot | undefined) {
  const bills = snapshot?.bills || [];
  const reminderDays = snapshot?.reminderDays || 5;
  await client
    .from("bill_notification_snapshots")
    .delete()
    .eq("subscription_id", subscriptionId);

  if (!bills.length) return;

  const rows = bills.map((bill) => ({
    subscription_id: subscriptionId,
    bill_id: String(bill.id),
    name: bill.name,
    category: bill.category,
    amount: Number(bill.amount) || 0,
    due: bill.due,
    paid: Boolean(bill.paid),
    repeat: bill.repeat || "none",
    reminder_days: reminderDays,
  }));

  const { error } = await client.from("bill_notification_snapshots").upsert(rows);
  if (error) throw error;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await request.json();
    requireSetupToken(body.token);
    const client = supabaseAdmin();

    if (body.action === "disable") {
      const { error } = await client
        .from("notification_subscriptions")
        .update({ enabled: false, last_seen_at: new Date().toISOString() })
        .eq("endpoint", body.endpoint);
      if (error) throw error;
      return jsonResponse({ ok: true });
    }

    if (body.action === "subscribe") {
      const subscription = body.subscription;
      if (!subscription?.endpoint) throw new Error("Missing push subscription endpoint.");
      const { data, error } = await client
        .from("notification_subscriptions")
        .upsert({
          endpoint: subscription.endpoint,
          subscription,
          enabled: true,
          last_seen_at: new Date().toISOString(),
        }, { onConflict: "endpoint" })
        .select("id")
        .single();
      if (error) throw error;
      await syncSnapshot(client, data.id, body.snapshot);
      return jsonResponse({ ok: true, subscriptionId: data.id });
    }

    if (body.action === "syncSnapshot") {
      const { data, error } = await client
        .from("notification_subscriptions")
        .select("id")
        .eq("endpoint", body.endpoint)
        .eq("enabled", true)
        .single();
      if (error) throw error;
      await syncSnapshot(client, data.id, body.snapshot);
      return jsonResponse({ ok: true, subscriptionId: data.id });
    }

    return jsonResponse({ error: "Unknown action" }, 400);
  } catch (error) {
    return jsonResponse({ error: error.message || "Push subscription failed" }, 400);
  }
});
