import { Resend } from "resend";
import crypto from "crypto";

// ── Resend client ─────────────────────────────────────────────────────────────

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn("[EMAIL] RESEND_API_KEY not set — email sending disabled.");
    return null;
  }
  return new Resend(key);
}

const FROM = process.env.EMAIL_FROM || "SEAMLIER <onboarding@resend.dev>";

// ── Helpers ───────────────────────────────────────────────────────────────────

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getVerificationExpiry(): Date {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  return expires;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.log(`[EMAIL DISABLED] "${subject}" → ${to}`);
    return false;
  }
  console.log(`[EMAIL] Attempting: "${subject}" → ${to}`);
  try {
    const { error } = await client.emails.send({ from: FROM, to, subject, html });
    if (error) {
      console.error(`[EMAIL] Resend error for "${subject}" → ${to}:`, error);
      return false;
    }
    console.log(`[EMAIL] Sent OK: "${subject}" → ${to}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send "${subject}" → ${to}:`, err);
    return false;
  }
}

// ── Shared template ───────────────────────────────────────────────────────────

function emailWrapper(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f9f6f1;font-family:Georgia,'Times New Roman',serif;-webkit-font-smoothing:antialiased;color-scheme:light only">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f9f6f1">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="580" cellspacing="0" cellpadding="0" border="0"
          style="max-width:580px;width:100%;border-radius:4px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

          <!-- Header -->
          <tr>
            <td style="background-color:#722F37;padding:36px 48px 32px;text-align:center">
              <p style="margin:0 0 6px;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:22px;font-weight:700;letter-spacing:6px;text-transform:uppercase">SEAMLIER</p>
              <p style="margin:0;color:rgba(255,255,255,0.65);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:10px;font-weight:400;letter-spacing:3px;text-transform:uppercase">LA COUTURE DIGITALISÉE</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color:#f9f6f1;padding:44px 48px 40px">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#722F37;padding:24px 48px;text-align:center">
              <p style="margin:0 0 4px;color:rgba(255,255,255,0.55);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1px">© 2026 SEAMLIER — <a href="https://www.seamlier.fr" style="color:rgba(255,255,255,0.7);text-decoration:none">www.seamlier.fr</a></p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function divider(): string {
  return `<div style="width:100%;height:1px;background-color:#e0d6cc;margin:28px 0"></div>`;
}

function ctaButton(href: string, label: string): string {
  return `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0 0">
    <tr>
      <td>
        <a href="${href}" target="_blank"
          style="display:block;width:100%;padding:16px 0;background-color:#722F37;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;text-transform:uppercase;text-align:center;text-decoration:none;border-radius:3px;box-sizing:border-box">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

function expiryNote(text: string): string {
  return `<p style="margin:12px 0 0;color:#b0a89a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;text-align:center">${text}</p>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">Bonjour ${name},</p>`;
}

function highlight(text: string): string {
  return `<strong style="color:#722F37">${text}</strong>`;
}

function infoBox(rows: { label: string; value: string; accent?: boolean }[]): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:6px 0;color:#6b7280;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px">${r.label}</td>
      <td style="padding:6px 0;text-align:right;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:${r.accent ? "15px" : "13px"};font-weight:${r.accent ? "700" : "600"};color:${r.accent ? "#722F37" : "#1f2937"}">${r.value}</td>
    </tr>`).join("");
  return `
  <div style="background:#f0ebe4;border-radius:3px;padding:20px 24px;margin:20px 0">
    <table style="width:100%">${rowsHtml}</table>
  </div>`;
}

// ── Email functions ───────────────────────────────────────────────────────────

export async function sendVerificationEmail(
  email: string, token: string, firstName?: string | null
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;
  const name = (firstName || "").toUpperCase() || "UTILISATEUR";

  const html = emailWrapper("Confirmez votre email — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      BIENVENUE, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(firstName || "vous")}
    <p style="margin:0 0 24px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Merci de rejoindre ${highlight("SEAMLIER")}, la plateforme qui connecte les particuliers avec les meilleurs artisans couturiers.<br><br>
      Pour activer votre compte, confirmez votre adresse email :
    </p>
    ${ctaButton(verifyUrl, "ACTIVER MON COMPTE")}
    ${expiryNote("Ce lien expire dans 24 heures.")}
    ${divider()}
    <p style="margin:0;color:#b0a89a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6">
      Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
      <a href="${verifyUrl}" style="color:#722F37;word-break:break-all">${verifyUrl}</a>
    </p>
  `);

  return sendEmail(email, "Confirmez votre email — SEAMLIER", html);
}

export async function sendWelcomeEmail(email: string, firstName?: string | null): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (firstName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Bienvenue sur SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      BIENVENUE, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(firstName || "vous")}
    <p style="margin:0 0 24px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre adresse email est confirmée. Votre compte SEAMLIER est maintenant actif.<br><br>
      Découvrez nos artisans couturiers, déposez vos mesures et lancez votre première commande.
    </p>
    ${ctaButton(`${appUrl}/decouverte`, "DÉCOUVRIR LES ARTISANS")}
  `);

  return sendEmail(email, "Bienvenue sur SEAMLIER", html);
}

export async function sendPasswordResetEmail(
  email: string, token: string, firstName?: string | null
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;
  const name = (firstName || "").toUpperCase() || "UTILISATEUR";

  const html = emailWrapper("Réinitialisation de mot de passe — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      RÉINITIALISATION, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(firstName || "vous")}
    <p style="margin:0 0 24px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Vous avez demandé la réinitialisation de votre mot de passe. Cliquez ci-dessous pour en choisir un nouveau.
    </p>
    ${ctaButton(resetUrl, "RÉINITIALISER MON MOT DE PASSE")}
    ${expiryNote("Ce lien expire dans 2 heures.")}
    ${divider()}
    <p style="margin:0;color:#b0a89a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6">
      Si vous n'avez pas fait cette demande, ignorez cet email — votre mot de passe reste inchangé.
    </p>
  `);

  return sendEmail(email, "Réinitialisation de votre mot de passe — SEAMLIER", html);
}

export async function sendNewMessageEmail(
  recipientEmail: string, recipientName: string, senderName: string, preview: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (recipientName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Nouveau message — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      NOUVEAU MESSAGE, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(recipientName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(senderName)} vous a envoyé un message sur SEAMLIER :
    </p>
    <div style="background:#f0ebe4;border-left:3px solid #722F37;padding:16px 20px;margin:0 0 24px;border-radius:0 3px 3px 0">
      <p style="margin:0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-style:italic;line-height:1.6">"${preview}"</p>
    </div>
    ${ctaButton(`${appUrl}/messages`, "VOIR LE MESSAGE")}
  `);

  return sendEmail(recipientEmail, `Nouveau message de ${senderName} — SEAMLIER`, html);
}

export async function sendNewProjectRequestEmail(
  tailorEmail: string, tailorName: string, clientName: string, projectTitle: string,
  description?: string | null, budget?: number | null
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (tailorName || "").toUpperCase() || "ARTISAN";

  const descBlock = description ? `
    <div style="background:#f0ebe4;border-left:3px solid #722F37;padding:14px 18px;margin:0 0 16px;border-radius:0 3px 3px 0">
      <p style="margin:0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.6;font-style:italic">${description}</p>
    </div>` : "";

  const budgetBlock = budget ? `
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px">
      Budget indicatif : ${highlight(`${budget} €`)}
    </p>` : "";

  const html = emailWrapper("Nouvelle demande — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      NOUVELLE DEMANDE, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(tailorName || "vous")}
    <p style="margin:0 0 16px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(clientName)} vous a adressé une nouvelle demande de confection :
    </p>
    <div style="background:#f0ebe4;border-left:3px solid #722F37;padding:16px 20px;margin:0 0 16px;border-radius:0 3px 3px 0">
      <p style="margin:0;color:#1f2937;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600">${projectTitle}</p>
    </div>
    ${descBlock}
    ${budgetBlock}
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Connectez-vous pour consulter les détails et établir un devis.
    </p>
    ${ctaButton(`${appUrl}/dashboard-pro`, "VOIR LA DEMANDE")}
  `);

  return sendEmail(tailorEmail, `Nouvelle demande de ${clientName} — SEAMLIER`, html);
}

export async function sendQuoteReadyEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string, amount: number | null
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (clientName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Votre devis est prêt — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      VOTRE DEVIS, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(clientName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(tailorName)} a établi un devis pour votre projet ${highlight(`"${projectTitle}"`)}.
    </p>
    ${amount ? infoBox([{ label: "Montant proposé", value: `${amount} €`, accent: true }]) : ""}
    <p style="margin:16px 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Vous pouvez accepter ou refuser ce devis depuis votre espace projet.
    </p>
    ${ctaButton(`${appUrl}/mes-projets`, "VOIR LE DEVIS")}
  `);

  return sendEmail(clientEmail, `Votre devis "${projectTitle}" est prêt — SEAMLIER`, html);
}

export async function sendQuoteAcceptedByClientEmail(
  tailorEmail: string, tailorName: string, clientName: string, projectTitle: string, amount: number | null
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (tailorName || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Devis accepté — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      DEVIS ACCEPTÉ, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(tailorName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(clientName)} a accepté votre devis pour le projet ${highlight(`"${projectTitle}"`)}.
    </p>
    ${amount ? infoBox([{ label: "Montant accepté", value: `${amount} €`, accent: true }]) : ""}
    <p style="margin:16px 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Le client va procéder au paiement. La confection peut démarrer dès réception.
    </p>
    ${ctaButton(`${appUrl}/dashboard-pro`, "VOIR MON ESPACE")}
  `);

  return sendEmail(tailorEmail, `Devis accepté par ${clientName} — SEAMLIER`, html);
}

export async function sendQuoteAcceptedClientConfirmationEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string, amount: number | null
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (clientName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Devis accepté — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      DEVIS ACCEPTÉ, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(clientName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Vous avez accepté le devis de ${highlight(tailorName)} pour le projet ${highlight(`"${projectTitle}"`)}.
    </p>
    ${amount ? infoBox([{ label: "Montant accepté", value: `${amount} €`, accent: true }]) : ""}
    <p style="margin:16px 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Vous pouvez maintenant procéder au paiement sécurisé pour lancer la confection.
    </p>
    ${ctaButton(`${appUrl}/mes-projets`, "PROCÉDER AU PAIEMENT")}
  `);

  return sendEmail(clientEmail, `Devis accepté — "${projectTitle}" — SEAMLIER`, html);
}

export async function sendPaymentConfirmationEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string, amount: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (clientName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Paiement confirmé — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      PAIEMENT CONFIRMÉ, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(clientName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre paiement pour la commande ${highlight(`"${projectTitle}"`)}<br>
      avec ${highlight(tailorName)} a été validé. La confection peut maintenant commencer.
    </p>
    ${infoBox([
      { label: "Artisan", value: tailorName },
      { label: "Commande", value: projectTitle },
      { label: "Montant", value: `${amount} €`, accent: true },
    ])}
    ${ctaButton(`${appUrl}/mes-projets`, "SUIVRE MA COMMANDE")}
  `);

  return sendEmail(clientEmail, `Paiement confirmé — ${projectTitle}`, html);
}

export async function sendArtisanPaymentReceivedEmail(
  tailorEmail: string, tailorName: string, clientName: string, projectTitle: string, artisanAmount: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (tailorName || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Paiement reçu — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      PAIEMENT REÇU, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(tailorName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(clientName)} a réglé la commande ${highlight(`"${projectTitle}"`)}.
      Le virement vous sera transféré à la livraison confirmée.
    </p>
    ${infoBox([{ label: "Vous allez recevoir", value: `${artisanAmount.toFixed(2)} €`, accent: true }])}
    <p style="margin:8px 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Vous pouvez maintenant démarrer la confection.
    </p>
    ${ctaButton(`${appUrl}/dashboard-pro`, "VOIR LA COMMANDE")}
  `);

  return sendEmail(tailorEmail, `Paiement reçu — "${projectTitle}" — SEAMLIER`, html);
}

export async function sendDeliveryEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (clientName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Votre commande est prête — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      COMMANDE PRÊTE, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(clientName || "vous")}
    <p style="margin:0 0 24px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(tailorName)} a terminé votre commande ${highlight(`"${projectTitle}"`)}.
      Vous pouvez maintenant confirmer la réception et laisser un avis.
    </p>
    ${ctaButton(`${appUrl}/mes-projets`, "CONFIRMER LA RÉCEPTION")}
    ${expiryNote("Vous avez 48h pour signaler tout problème à notre support.")}
  `);

  return sendEmail(clientEmail, `Votre commande "${projectTitle}" est prête — SEAMLIER`, html);
}

export async function sendReviewRequestEmail(
  clientEmail: string, clientName: string, tailorName: string, _projectId: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = (clientName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Votre avis compte — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      VOTRE AVIS, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(clientName || "vous")}
    <p style="margin:0 0 24px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre commande avec ${highlight(tailorName)} est terminée. Prenez 30 secondes pour laisser un avis —
      cela aide les autres clients et valorise le travail des artisans.
    </p>
    ${ctaButton(`${appUrl}/mes-projets`, "LAISSER UN AVIS")}
  `);

  return sendEmail(clientEmail, `Laissez votre avis sur votre commande SEAMLIER`, html);
}

export async function sendNewAppointmentRequestEmail(
  tailorEmail: string, tailorName: string, clientName: string,
  appointmentType: string, scheduledAt: Date | string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const dt = new Date(scheduledAt);
  const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const name = (tailorName || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Nouveau rendez-vous — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      NOUVEAU RDV, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(tailorName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(clientName)} vient de réserver un rendez-vous avec vous.
    </p>
    ${infoBox([
      { label: "Type", value: appointmentType },
      { label: "Client", value: clientName },
      { label: "Date", value: dateStr, accent: true },
      { label: "Heure", value: timeStr, accent: true },
    ])}
    ${ctaButton(`${appUrl}/mes-rendez-vous`, "VOIR LE RENDEZ-VOUS")}
  `);

  return sendEmail(tailorEmail, `Nouveau RDV — ${clientName} le ${dateStr} à ${timeStr}`, html);
}

export async function sendAppointmentConfirmationEmail(
  toEmail: string, toName: string, scheduledAt: Date | string, appointmentType: string, otherPartyName: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const dt = new Date(scheduledAt);
  const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const name = (toName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Rendez-vous confirmé — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      RDV CONFIRMÉ, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(toName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre rendez-vous ${highlight(appointmentType)} avec ${highlight(otherPartyName)} est confirmé.
    </p>
    ${infoBox([
      { label: "Date", value: dateStr, accent: true },
      { label: "Heure", value: timeStr, accent: true },
    ])}
    ${expiryNote("Un rappel vous sera envoyé 24h avant le rendez-vous.")}
    ${ctaButton(`${appUrl}/mes-rendez-vous`, "VOIR MES RENDEZ-VOUS")}
  `);

  return sendEmail(toEmail, `RDV confirmé — ${dateStr} à ${timeStr}`, html);
}

export async function sendAppointmentReminderEmail(
  toEmail: string, toName: string, scheduledAt: Date | string, appointmentType: string, otherPartyName: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const dt = new Date(scheduledAt);
  const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const name = (toName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Rappel rendez-vous — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      RAPPEL RDV, <span style="color:#722F37">${name}</span>
    </h2>
    ${divider()}
    ${greeting(toName || "vous")}
    <p style="margin:0 0 24px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Rappel : vous avez un rendez-vous ${highlight(appointmentType)} avec ${highlight(otherPartyName)} demain à ${highlight(timeStr)}.
    </p>
    ${ctaButton(`${appUrl}/mes-rendez-vous`, "VOIR MES RENDEZ-VOUS")}
  `);

  return sendEmail(toEmail, `Rappel : votre RDV avec ${otherPartyName} demain à ${timeStr}`, html);
}

export async function sendDossierReceivedEmail(email: string, name: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const nameUpper = (name || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Dossier reçu — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      DOSSIER REÇU, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(name || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Nous avons bien reçu votre document. Notre équipe l'examinera sous ${highlight("48 à 72 heures ouvrées")}.
    </p>
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Vous recevrez un email dès que votre dossier sera traité.
    </p>
    ${ctaButton(`${appUrl}/pro-dossier`, "VOIR MON DOSSIER")}
  `);

  return sendEmail(email, "Nous avons bien reçu votre document — SEAMLIER", html);
}

export async function sendDossierValidatedEmail(email: string, name: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const nameUpper = (name || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Dossier validé — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      DOSSIER VALIDÉ, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(name || "vous")}
    <p style="margin:0 0 24px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre dossier professionnel a été ${highlight("validé")} par l'équipe SEAMLIER.
      Votre profil est désormais vérifié et visible par les clients.
    </p>
    ${ctaButton(`${appUrl}/dashboard-pro`, "ACCÉDER À MON ESPACE")}
  `);

  return sendEmail(email, "Votre dossier professionnel a été validé — SEAMLIER", html);
}

export async function sendDossierRejectedEmail(email: string, name: string, reason: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const nameUpper = (name || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Action requise — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      ACTION REQUISE, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(name || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre dossier professionnel n'a pas pu être validé en l'état. Motif indiqué :
    </p>
    <div style="background:#fef2f2;border-left:3px solid #dc2626;padding:16px 20px;margin:0 0 24px;border-radius:0 3px 3px 0">
      <p style="margin:0;color:#7f1d1d;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px">${reason || "Documents manquants ou illisibles."}</p>
    </div>
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Veuillez mettre à jour votre dossier avec les documents corrects.
    </p>
    ${ctaButton(`${appUrl}/pro-dossier`, "METTRE À JOUR MON DOSSIER")}
  `);

  return sendEmail(email, "Action requise — Votre dossier professionnel SEAMLIER", html);
}

export async function sendFabricDepositReminderEmail(
  clientEmail: string, clientName: string, artisanName: string, depositDate: string
): Promise<boolean> {
  const nameUpper = (clientName || "").toUpperCase() || "VOUS";

  const html = emailWrapper("Rappel dépôt de tissu — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      RAPPEL DÉPÔT, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(clientName || "vous")}
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Vous devez déposer votre tissu chez ${highlight(artisanName)} avant le ${highlight(depositDate)}.
      N'oubliez pas cette étape pour que votre confection démarre dans les meilleures conditions.
    </p>
  `);

  return sendEmail(clientEmail, `Rappel : déposez votre tissu avant le ${depositDate} — SEAMLIER`, html);
}

export async function sendDeadlineWarningEmail(
  recipientEmail: string, recipientName: string, projectTitle: string,
  deadline: string, role: "artisan" | "admin"
): Promise<boolean> {
  const intro = role === "admin"
    ? `Le projet ${highlight(projectTitle)} a une deadline client au ${highlight(deadline)} — moins de 5 jours restants.`
    : `Votre commande ${highlight(projectTitle)} doit être prête pour le ${highlight(deadline)}.`;
  const subject = role === "admin"
    ? `[ADMIN] Deadline proche : ${projectTitle}`
    : `Deadline proche : ${projectTitle} — SEAMLIER`;
  const nameUpper = (recipientName || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Deadline proche — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#dc2626;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      DEADLINE, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(recipientName || "vous")}
    <p style="margin:0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">${intro}</p>
  `);

  return sendEmail(recipientEmail, subject, html);
}

export async function sendKbisExpiryReminderEmail(
  email: string, name: string, expiryDate: string, daysLeft: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const nameUpper = (name || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Kbis bientôt expiré — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      KBIS EXPIRANT, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(name || "vous")}
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre extrait Kbis arrive à expiration dans ${highlight(`${daysLeft} jour${daysLeft > 1 ? "s" : ""}`)}
      (le ${highlight(expiryDate)}). Pensez à le renouveler et à mettre à jour votre dossier.
    </p>
    ${ctaButton(`${appUrl}/pro-dossier`, "METTRE À JOUR MON KBIS")}
  `);

  return sendEmail(email, `Rappel : votre Kbis expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — SEAMLIER`, html);
}

export async function sendAdminKbisAlertEmail(
  adminEmail: string, tailorName: string, expiryDate: string
): Promise<boolean> {
  const html = emailWrapper("Alerte Kbis artisan — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#d97706;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      ALERTE KBIS, <span style="color:#722F37">ADMIN</span>
    </h2>
    ${divider()}
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Le Kbis de l'artisan ${highlight(tailorName)} expire le ${highlight(expiryDate)}.
      Vérifiez son dossier dans la console d'administration.
    </p>
  `);

  return sendEmail(adminEmail, `[ADMIN] Kbis expirant — ${tailorName}`, html);
}

export async function sendSubscriptionPaymentFailedEmail(
  tailorEmail: string, tailorName: string, amount: number | null, nextRetry: string | null
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const amountStr = amount ? `${amount.toFixed(2)} €` : "votre abonnement";
  const nameUpper = (tailorName || "").toUpperCase() || "ARTISAN";

  const html = emailWrapper("Paiement abonnement échoué — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      PAIEMENT ÉCHOUÉ, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(tailorName || "vous")}
    <p style="margin:0 0 16px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Le prélèvement de ${highlight(amountStr)} pour votre abonnement SEAMLIER Pro n'a pas pu être effectué.
    </p>
    ${nextRetry ? `<p style="margin:0 0 16px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px">Prochaine tentative : ${highlight(nextRetry)}</p>` : ""}
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7">
      Pour éviter la suspension de votre plan Pro, mettez à jour votre moyen de paiement.
    </p>
    ${ctaButton(`${appUrl}/pro-parametres`, "METTRE À JOUR MON PAIEMENT")}
  `);

  return sendEmail(tailorEmail, "Action requise — Paiement abonnement Pro SEAMLIER échoué", html);
}

export async function sendAdminChargebackAlertEmail(
  adminEmail: string, chargeId: string, amount: number, customerEmail: string,
  reason: string, projectInfo: string = ""
): Promise<boolean> {
  const html = emailWrapper("Chargeback Stripe — SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#dc2626;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      CHARGEBACK REÇU, <span style="color:#722F37">ADMIN</span>
    </h2>
    ${divider()}
    <p style="margin:0 0 16px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Un chargeback a été ouvert sur votre compte Stripe${projectInfo ? ` pour${projectInfo}` : ""}.
    </p>
    ${infoBox([
      { label: "Charge ID", value: chargeId },
      { label: "Montant contesté", value: `${amount.toFixed(2)} €`, accent: true },
      { label: "Email client", value: customerEmail },
      { label: "Raison", value: reason },
    ])}
    <p style="margin:0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7">
      Vous avez généralement ${highlight("7 à 21 jours")} pour répondre via le Dashboard Stripe avec les preuves de livraison.
    </p>
  `);

  return sendEmail(adminEmail, `[URGENT] Chargeback Stripe — ${amount.toFixed(2)} € — charge ${chargeId}`, html);
}

export async function sendReferralInviteEmail(
  referredEmail: string, referrerName: string, referralToken: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const inviteUrl = `${appUrl}/inscription/professionnel?ref=${referralToken}`;

  const html = emailWrapper("Invitation SEAMLIER", `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      VOUS ÊTES INVITÉ, <span style="color:#722F37">ARTISAN</span>
    </h2>
    ${divider()}
    <p style="margin:0 0 16px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      ${highlight(referrerName)} vous invite à rejoindre ${highlight("SEAMLIER")}, la plateforme qui connecte les couturiers professionnels avec leurs clients.
    </p>
    <p style="margin:0 0 0;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Créez votre profil artisan gratuitement et développez votre activité en ligne.
    </p>
    ${ctaButton(inviteUrl, "REJOINDRE SEAMLIER")}
  `);

  return sendEmail(referredEmail, `${referrerName} vous invite sur SEAMLIER`, html);
}

// ── Emails with PDF attachments (use Resend attachments) ──────────────────────

export async function sendMonthlyInvoiceEmail(
  tailorEmail: string, tailorName: string,
  month: number, year: number, pdfBuffer: Buffer,
  projectCount: number, netAmountEur: number,
  projects?: { title: string; clientName: string; amountTotalEur: number; commissionEur: number; amountArtisanEur: number }[],
  grossAmountEur?: number, commissionAmountEur?: number
): Promise<boolean> {
  const client = getResend();
  const MONTH_NAMES_FR = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
  const monthLabel = MONTH_NAMES_FR[month] + " " + year;
  const fmt = (cents: number) => (cents / 100).toFixed(2) + " €";
  const nameUpper = (tailorName || "").toUpperCase() || "ARTISAN";

  const projectRows = projects && projects.length > 0 ? `
    <table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
      <thead>
        <tr style="background:#f0ebe4">
          <th style="padding:8px 10px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e0d6cc">Confection</th>
          <th style="padding:8px 10px;text-align:left;color:#6b7280;font-weight:600;border-bottom:1px solid #e0d6cc">Client</th>
          <th style="padding:8px 6px;text-align:right;color:#6b7280;font-weight:600;border-bottom:1px solid #e0d6cc">Montant</th>
          <th style="padding:8px 6px;text-align:right;color:#6b7280;font-weight:600;border-bottom:1px solid #e0d6cc">Commission</th>
          <th style="padding:8px 10px;text-align:right;color:#722F37;font-weight:600;border-bottom:1px solid #e0d6cc">Net</th>
        </tr>
      </thead>
      <tbody>
        ${projects.map(p => `
        <tr style="border-bottom:1px solid #f0ebe4">
          <td style="padding:8px 10px;color:#1f2937;font-weight:500">${p.title}</td>
          <td style="padding:8px 10px;color:#4b5563">${p.clientName}</td>
          <td style="padding:8px 6px;text-align:right;color:#4b5563">${fmt(p.amountTotalEur)}</td>
          <td style="padding:8px 6px;text-align:right;color:#6b7280">${fmt(p.commissionEur)}</td>
          <td style="padding:8px 10px;text-align:right;color:#16a34a;font-weight:600">${fmt(p.amountArtisanEur)}</td>
        </tr>`).join("")}
      </tbody>
    </table>` : "";

  const infoRows = [
    { label: "Confections complétées", value: String(projectCount) },
    ...(grossAmountEur !== undefined ? [{ label: "Montant brut", value: fmt(grossAmountEur) }] : []),
    ...(commissionAmountEur !== undefined ? [{ label: "Commission SEAMLIER", value: `− ${fmt(commissionAmountEur)}` }] : []),
    { label: "Montant net", value: fmt(netAmountEur), accent: true as const },
  ];

  const html = emailWrapper(`Récapitulatif ${monthLabel} — SEAMLIER`, `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      RÉCAPITULATIF, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(tailorName || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre récapitulatif de facturation pour le mois de ${highlight(monthLabel)} est ci-joint.
    </p>
    ${projectRows}
    ${infoBox(infoRows)}
    <p style="margin:8px 0 0;color:#b0a89a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6">
      La facture détaillée (PDF) est jointe à cet email. Ce document peut servir de justificatif comptable.
    </p>
  `);

  const filename = `SEAMLIER_facture_${MONTH_NAMES_FR[month]}_${year}.pdf`;
  console.log(`[EMAIL] Attempting: "Monthly invoice ${monthLabel}" → ${tailorEmail}`);

  if (!client) {
    console.log(`[EMAIL DISABLED] Monthly invoice ${monthLabel} → ${tailorEmail}`);
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: tailorEmail,
      subject: `Récapitulatif SEAMLIER — ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`,
      html,
      attachments: [{ filename, content: pdfBuffer.toString("base64") }],
    });
    if (error) { console.error(`[EMAIL] Resend error (monthly invoice):`, error); return false; }
    console.log(`[EMAIL] Sent OK: "Monthly invoice ${monthLabel}" → ${tailorEmail}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send monthly invoice to ${tailorEmail}:`, err);
    return false;
  }
}

export async function sendAnnualFiscalRecapEmail(
  email: string, name: string, year: number, pdfBuffer: Buffer,
  stats: { projects: number; gross: number; commission: number; net: number }
): Promise<boolean> {
  const client = getResend();
  const nameUpper = (name || "").toUpperCase() || "ARTISAN";
  const fmt = (cents: number) => (cents / 100).toFixed(2) + " €";

  const html = emailWrapper(`Récapitulatif fiscal ${year} — SEAMLIER`, `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      FISCAL ${year}, <span style="color:#722F37">${nameUpper}</span>
    </h2>
    ${divider()}
    ${greeting(name || "vous")}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      Votre récapitulatif fiscal annuel pour ${highlight(String(year))} est ci-joint.
    </p>
    ${infoBox([
      { label: "Projets complétés", value: String(stats.projects) },
      { label: "Montant brut", value: fmt(stats.gross) },
      { label: "Commission SEAMLIER", value: `− ${fmt(stats.commission)}` },
      { label: "Net perçu", value: fmt(stats.net), accent: true },
    ])}
    <p style="margin:8px 0 0;color:#b0a89a;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:11px;line-height:1.6">
      Le récapitulatif détaillé (PDF) est joint à cet email. Ce document est à conserver 10 ans à des fins fiscales.
    </p>
  `);

  console.log(`[EMAIL] Attempting: "Annual fiscal recap ${year}" → ${email}`);

  if (!client) {
    console.log(`[EMAIL DISABLED] Annual fiscal recap ${year} → ${email}`);
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: FROM,
      to: email,
      subject: `Récapitulatif fiscal SEAMLIER — ${year}`,
      html,
      attachments: [{ filename: `SEAMLIER_recap_fiscal_${year}.pdf`, content: pdfBuffer.toString("base64") }],
    });
    if (error) { console.error(`[EMAIL] Resend error (annual fiscal):`, error); return false; }
    console.log(`[EMAIL] Sent OK: "Annual fiscal recap ${year}" → ${email}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send annual fiscal recap to ${email}:`, err);
    return false;
  }
}

export async function sendAdminFiscalAlertEmail(
  adminEmail: string, tailorName: string, tailorEmail: string,
  year: number, gross: number, projectCount: number
): Promise<boolean> {
  const fmt = (cents: number) => (cents / 100).toFixed(2) + " €";

  const html = emailWrapper(`Alerte fiscale ${year} — SEAMLIER`, `
    <h2 style="margin:0 0 6px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:1px">
      ALERTE FISCALE, <span style="color:#722F37">ADMIN</span>
    </h2>
    ${divider()}
    <p style="margin:0 0 20px;color:#4b5563;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7">
      L'artisan ${highlight(tailorName)} (${tailorEmail}) a dépassé le seuil de vigilance fiscale pour ${highlight(String(year))} :
    </p>
    ${infoBox([
      { label: "Projets complétés", value: String(projectCount) },
      { label: "Montant brut", value: fmt(gross), accent: true },
    ])}
  `);

  return sendEmail(adminEmail, `[ADMIN] Alerte fiscale — ${tailorName} (${year})`, html);
}
