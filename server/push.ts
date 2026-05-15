import webpush from "web-push";
import { pool } from "./db";

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY  || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT     || "mailto:contact@seamlier.fr";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

export async function ensurePushTable() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL,
      endpoint TEXT NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_push_user (user_id)
    )
  `);
}

export async function saveSubscription(userId: string, sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const id = crypto.randomUUID();
  await pool.execute(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE p256dh = VALUES(p256dh), auth = VALUES(auth)`,
    [id, userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
  );
}

export async function deleteSubscription(userId: string, endpoint: string) {
  await pool.execute(
    `DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?`,
    [userId, endpoint]
  );
}

export async function sendPushNotification(userId: string, title: string, body: string, url = "/") {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return;
  try {
    const [rows] = await pool.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ? LIMIT 5`,
      [userId]
    ) as any[];
    const subs = Array.isArray(rows) ? rows : [];
    for (const row of subs) {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      };
      await webpush.sendNotification(subscription, JSON.stringify({ title, body, url })).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await pool.execute(`DELETE FROM push_subscriptions WHERE endpoint = ?`, [row.endpoint]);
        }
      });
    }
  } catch {}
}
