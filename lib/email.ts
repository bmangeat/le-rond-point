import { Resend } from "resend";

// Init paresseux : Resend n'est pas branché partout (dev/QA sans clé).
// On n'instancie le client qu'à l'envoi, et on no-op si la clé manque —
// évite de faire planter le build (« Missing API key ») au chargement du module.
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.RESEND_FROM ?? "Le Rond Point <onboarding@resend.dev>";
const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

// ─── Invitation ───────────────────────────────────────────────────────────────

export async function sendInvitationEmail({
  to,
  token,
  inviterName,
}: {
  to: string;
  token: string;
  inviterName: string;
}) {
  const inviteUrl = `${BASE_URL}/invite/${token}`;

  const resend = getResend();
  if (!resend) return; // Resend non configuré → on ignore silencieusement

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${inviterName} t'invite sur Le Rond Point 🏘️`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1E293B; margin-bottom: 8px;">
          Tu es invité·e sur Le Rond Point
        </h1>
        <p style="color: #64748B; font-size: 15px; line-height: 22px; margin-bottom: 24px;">
          <strong>${inviterName}</strong> t'invite à rejoindre Le Rond Point — l'app du groupe pour
          savoir qui sera au quartier et quand.
        </p>
        <a href="${inviteUrl}"
           style="display: inline-block; background: #3B7BF8; color: white; font-weight: 600;
                  padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 15px;">
          Rejoindre le groupe →
        </a>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">
          Ce lien expire dans 7 jours. Si tu n'attendais pas cette invitation, ignore cet email.
        </p>
      </div>
    `,
  });
}

// ─── Notification de chevauchement ────────────────────────────────────────────

export async function sendOverlapNotification({
  to,
  recipientName,
  newPresencerName,
  startDate,
  endDate,
}: {
  to: string;
  recipientName: string;
  newPresencerName: string;
  startDate: Date;
  endDate: Date;
}) {
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const calendarUrl = `${BASE_URL}/`;

  const resend = getResend();
  if (!resend) return; // Resend non configuré → on ignore silencieusement

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${newPresencerName} sera au quartier en même temps que toi ! 🎉`,
    html: `
      <div style="font-family: Inter, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="font-size: 24px; font-weight: 700; color: #1E293B; margin-bottom: 8px;">
          Bonne nouvelle, ${recipientName} !
        </h1>
        <p style="color: #64748B; font-size: 15px; line-height: 22px; margin-bottom: 24px;">
          <strong>${newPresencerName}</strong> sera au quartier du <strong>${fmt(startDate)}</strong>
          au <strong>${fmt(endDate)}</strong>.
          <br><br>
          Vous serez là en même temps ! 🏘️
        </p>
        <a href="${calendarUrl}"
           style="display: inline-block; background: #3B7BF8; color: white; font-weight: 600;
                  padding: 12px 24px; border-radius: 12px; text-decoration: none; font-size: 15px;">
          Voir le calendrier →
        </a>
        <p style="color: #94A3B8; font-size: 13px; margin-top: 24px;">
          Tu reçois cet email car les notifications sont activées.
          <a href="${BASE_URL}/profile" style="color: #3B7BF8;">Gérer mes préférences</a>
        </p>
      </div>
    `,
  });
}
