import { useEffect, useRef } from "react";

async function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from(Array.from(rawData).map((char) => char.charCodeAt(0)));
}

export function usePushNotifications(enabled: boolean) {
  const subscribed = useRef(false);

  useEffect(() => {
    if (!enabled || subscribed.current) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/push/vapid-public-key", { credentials: "include" });
        if (!res.ok) return;
        const { publicKey } = await res.json();
        if (!publicKey || cancelled) return;

        const permission = await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;

        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: await urlBase64ToUint8Array(publicKey),
          });
        }

        if (!subscription || cancelled) return;

        const sub = subscription.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keys?.p256dh, auth: sub.keys?.auth },
          }),
        });

        subscribed.current = true;
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [enabled]);
}
