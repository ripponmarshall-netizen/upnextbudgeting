import webpush from "npm:web-push@3.6.7";

export type PushPayload = {
  title: string;
  body: string;
  tag?: string;
  data?: Record<string, unknown>;
};

export function configureWebPush() {
  const subject = Deno.env.get("VAPID_SUBJECT");
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const privateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  if (!subject || !publicKey || !privateKey) {
    throw new Error("Missing VAPID_SUBJECT, VAPID_PUBLIC_KEY, or VAPID_PRIVATE_KEY.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function sendWebPush(subscription: unknown, payload: PushPayload) {
  await webpush.sendNotification(
    subscription as any,
    JSON.stringify({
      icon: "/assets/icon.svg",
      badge: "/assets/icon.svg",
      tag: "upnextbudgeting-due-summary",
      data: { url: "./" },
      ...payload,
    })
  );
}
