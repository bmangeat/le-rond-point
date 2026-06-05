import webpush from "web-push";
import { db } from "@/lib/db";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT ?? "mailto:contact@lerondpoint.app";

let configured = false;
function ensureConfigured() {
  if (configured) return true;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

// Envoie une notification push à tous les abonnements d'un utilisateur.
// Supprime automatiquement les abonnements expirés/révoqués (statuts 404/410).
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureConfigured()) return;

  const subscriptions = await db.pushSubscription.findMany({ where: { userId } });
  if (subscriptions.length === 0) return;

  const data = JSON.stringify(payload);

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          data
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Abonnement mort → on le retire
          await db.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        } else {
          console.error("Erreur envoi push:", err);
        }
      }
    })
  );
}
