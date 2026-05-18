// @ts-ignore
import webpush from "web-push";
import { db } from "./db";
import { pushSubscriptions } from "../shared/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || "mailto:contact@seamlier.fr",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function saveSubscription(userId: string, subscription: any) {
  const existing = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId)).limit(1);
  if (existing.length > 0) {
    await db.update(pushSubscriptions)
      .set({ endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth })
      .where(eq(pushSubscriptions.userId, userId));
  } else {
    await db.insert(pushSubscriptions).values({
      id: uuidv4(),
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
  }
}

export async function sendPushToUser(userId: string, payload: { title: string; body: string; url?: string }) {
  try {
    const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
    for (const sub of subs) {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      ).catch(async (err: any) => {
        if (err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        }
      });
    }
  } catch (err) {
    console.error("Push error:", err);
  }
}
