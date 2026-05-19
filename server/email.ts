import nodemailer from "nodemailer";
import crypto from "crypto";
import { emailTemplate, infoBlock, dateBlock, amountBlock, p, strong } from "../utils/emailTemplate";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  const host = process.env.SMTP_HOST || "mail.seamlier.fr";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || "contact@seamlier.fr";
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;
  console.log(`[EMAIL] SMTP config — host=${host} port=${port} user=${user} hasPass=${!!pass}`);
  if (!pass) {
    console.warn("[EMAIL] SMTP not configured — EMAIL_PASSWORD / SMTP_PASS manquant. Email désactivé.");
    return null;
  }
  transporter = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
  return transporter;
}

async function sendEmail(to: string, subject: string, html: string, extraHeaders?: Record<string, string>): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) { console.log(`[EMAIL DISABLED] Would send "${subject}" → ${to}`); return false; }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "contact@seamlier.fr";
  const msgId = `<${Date.now()}.${crypto.randomBytes(8).toString("hex")}@seamlier.fr>`;
  console.log(`[EMAIL] Tentative envoi "${subject}" → ${to} (from=${from})`);
  try {
    const info = await mailer.sendMail({
      from: `"SEAMLIER" <${from}>`,
      to,
      subject,
      html,
      headers: {
        "X-Mailer": "SEAMLIER Platform",
        "Message-ID": msgId,
        ...extraHeaders,
      },
    });
    console.log(`[EMAIL] ✅ Envoyé "${subject}" → ${to} messageId=${info?.messageId}`);
    return true;
  } catch (err: any) {
    console.error(`[EMAIL] ❌ Échec "${subject}" → ${to}:`, err?.message ?? err);
    return false;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getVerificationExpiry(): Date {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  return expires;
}

// ─── VÉRIFICATION EMAIL ──────────────────────────────────────────────────────
export async function sendVerificationEmail(
  email: string, token: string, firstName?: string | null
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;
  const name = firstName || "utilisateur";
  const html = emailTemplate({
    title: `Bienvenue, ${name}`,
    badge: '✓ Inscription',
    badgeColor: 'bordeaux',
    content: `
      ${p(`Merci de rejoindre ${strong('SEAMLIER')}, la plateforme qui connecte les particuliers avec les meilleurs artisans couturiers.`)}
      ${p('Pour activer votre compte et commencer votre expérience, confirmez votre adresse email :')}
      ${p(`<a href="${verifyUrl}" style="color:#6B0F1A;font-size:12px;word-break:break-all;">${verifyUrl}</a>`)}
    `,
    ctaText: 'Activer mon compte',
    ctaUrl: verifyUrl,
    ctaNote: 'Ce lien expire dans 24 heures.',
  });
  return sendEmail(email, 'Confirmez votre email - SEAMLIER', html);
}

// ─── RESET MOT DE PASSE ──────────────────────────────────────────────────────
export async function sendPasswordResetEmail(
  email: string, token: string, firstName?: string | null
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;
  const name = firstName || "utilisateur";
  const html = emailTemplate({
    title: 'Réinitialisation du mot de passe',
    badge: '🔒 Sécurité',
    badgeColor: 'gray',
    content: `
      ${p(`Bonjour ${strong(name)},`)}
      ${p('Vous avez demandé la réinitialisation de votre mot de passe. Ce lien est valable <strong>2 heures</strong>.')}
      ${p(`<a href="${resetUrl}" style="color:#6B0F1A;font-size:12px;word-break:break-all;">${resetUrl}</a>`)}
      ${p('<em style="color:#9a8a8d;font-size:12px;">Si vous n\'avez pas demandé cette réinitialisation, ignorez cet email.</em>')}
    `,
    ctaText: 'Réinitialiser mon mot de passe',
    ctaUrl: resetUrl,
  });
  return sendEmail(email, 'Réinitialisation de votre mot de passe - SEAMLIER', html);
}

// ─── NOUVEAU MESSAGE ─────────────────────────────────────────────────────────
export async function sendNewMessageEmail(
  recipientEmail: string, recipientName: string, senderName: string, preview: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailTemplate({
    title: 'Nouveau message',
    badge: '✉ Message',
    badgeColor: 'bordeaux',
    content: `
      ${p(`Bonjour ${strong(recipientName || 'vous')},`)}
      ${p(`${strong(senderName)} vous a envoyé un message sur SEAMLIER :`)}
      <div style="background:#f7f4f0;border-left:4px solid #6B0F1A;padding:16px 20px;margin:16px 0;">
        <p style="margin:0;color:#3a2a2d;font-size:14px;font-style:italic;">"${preview}"</p>
      </div>
    `,
    ctaText: 'Voir le message',
    ctaUrl: `${appUrl}/messages`,
  });
  return sendEmail(recipientEmail, `Nouveau message de ${senderName} — SEAMLIER`, html);
}

// ─── COMMANDE LIVRÉE ─────────────────────────────────────────────────────────
export async function sendDeliveryEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailTemplate({
    title: 'Votre commande est prête !',
    badge: '✓ Livraison',
    badgeColor: 'green',
    content: `
      ${p(`Bonjour ${strong(clientName || 'vous')},`)}
      ${p(`Bonne nouvelle ! ${strong(tailorName)} a terminé votre commande ${strong(projectTitle)}. Vous pouvez confirmer la réception et laisser un avis.`)}
      ${infoBlock('COMMANDE', [
        { label: 'Artisan',  value: tailorName },
        { label: 'Commande', value: projectTitle },
        { label: 'Statut',   value: 'Prête à récupérer ✓' },
      ])}
    `,
    ctaText: 'Confirmer la réception',
    ctaUrl: `${appUrl}/mes-projets`,
    ctaNote: 'Vous avez 48h pour signaler tout problème.',
  });
  return sendEmail(clientEmail, `Votre commande "${projectTitle}" est prête — SEAMLIER`, html);
}

// ─── DEMANDE D'AVIS ──────────────────────────────────────────────────────────
export async function sendReviewRequestEmail(
  clientEmail: string, clientName: string, tailorName: string, projectId: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailTemplate({
    title: 'Votre avis compte',
    badge: '✓ Livraison confirmée',
    badgeColor: 'bordeaux',
    content: `
      ${p(`Bonjour ${strong(clientName || '')},`)}
      ${p(`Votre commande avec ${strong(tailorName)} est terminée. Prenez 30 secondes pour laisser un avis — cela aide les autres clients et valorise le travail des artisans.`)}
    `,
    ctaText: 'Laisser un avis',
    ctaUrl: `${appUrl}/mes-projets`,
    ctaNote: 'Votre avis sera publié après modération par notre équipe.',
  });
  return sendEmail(clientEmail, 'Laissez votre avis sur votre commande SEAMLIER', html);
}

// ─── PAIEMENT CONFIRMÉ ───────────────────────────────────────────────────────
export async function sendPaymentConfirmationEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string, amount: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailTemplate({
    title: 'Paiement reçu',
    badge: '✓ Paiement confirmé',
    badgeColor: 'bordeaux',
    content: `
      ${p(`Bonjour ${strong(clientName || '')},`)}
      ${p('Votre paiement a bien été reçu et sécurisé. Les fonds seront libérés à l\'artisan après validation de votre commande.')}
      ${amountBlock(String(amount))}
      ${infoBlock('REÇU', [
        { label: 'Artisan',  value: tailorName },
        { label: 'Commande', value: projectTitle },
        { label: 'Montant',  value: `${amount} €` },
      ])}
    `,
    ctaText: 'Suivre ma commande',
    ctaUrl: `${appUrl}/mes-projets`,
    ctaNote: 'Les fonds sont sécurisés et ne seront libérés qu\'après votre validation.',
  });
  return sendEmail(clientEmail, `Paiement confirmé — ${projectTitle}`, html);
}

// ─── RDV CONFIRMÉ ────────────────────────────────────────────────────────────
export async function sendAppointmentConfirmationEmail(
  toEmail: string, toName: string, scheduledAt: Date | string, appointmentType: string, otherPartyName: string
): Promise<boolean> {
  const dt = new Date(scheduledAt);
  const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailTemplate({
    title: 'Rendez-vous confirmé',
    badge: '✓ Confirmé',
    badgeColor: 'bordeaux',
    content: `
      ${p(`Bonjour ${strong(toName || '')},`)}
      ${p(`Votre rendez-vous ${strong(appointmentType)} avec ${strong(otherPartyName)} est bien confirmé :`)}
      ${dateBlock('RENDEZ-VOUS', dateStr, timeStr, appointmentType)}
    `,
    ctaText: 'Voir mes rendez-vous',
    ctaUrl: `${appUrl}/mes-rendez-vous`,
    ctaNote: 'Un rappel vous sera envoyé 24h avant le rendez-vous.',
  });
  return sendEmail(toEmail, `RDV confirmé — ${dateStr} à ${timeStr}`, html);
}

// ─── RAPPEL RDV 24H ──────────────────────────────────────────────────────────
export async function sendAppointmentReminderEmail(
  toEmail: string, toName: string, scheduledAt: Date | string, appointmentType: string, otherPartyName: string
): Promise<boolean> {
  const dt = new Date(scheduledAt);
  const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailTemplate({
    title: 'Rendez-vous demain',
    badge: '⏰ Rappel',
    badgeColor: 'bordeaux',
    content: `
      ${p(`Bonjour ${strong(toName || '')},`)}
      ${p(`Rappel : vous avez un rendez-vous ${strong(appointmentType)} avec ${strong(otherPartyName)} demain.`)}
      ${dateBlock('DEMAIN', dateStr, timeStr, appointmentType)}
    `,
    ctaText: 'Voir mes rendez-vous',
    ctaUrl: `${appUrl}/mes-rendez-vous`,
    ctaNote: 'En cas d\'empêchement, contactez votre artisan dès que possible.',
  });
  return sendEmail(toEmail, `Rappel : votre RDV avec ${otherPartyName} demain à ${timeStr}`, html);
}

// ─── RAPPEL DÉPÔT TISSU ──────────────────────────────────────────────────────
export async function sendFabricDepositReminderEmail(
  clientEmail: string, clientName: string, artisanName: string, depositDate: string
): Promise<boolean> {
  const html = emailTemplate({
    title: 'Rappel — Dépôt de tissu',
    badge: '🧵 Action requise',
    badgeColor: 'orange',
    content: `
      ${p(`Bonjour ${strong(clientName || '')},`)}
      ${p(`Vous devez déposer votre tissu chez ${strong(artisanName)} avant le ${strong(depositDate)}. N'oubliez pas cette étape pour que votre confection démarre dans les meilleures conditions !`)}
      ${p('<em style="color:#9a8a8d;font-size:12px;">En cas de question, contactez votre artisan directement via la messagerie SEAMLIER.</em>')}
    `,
    ctaText: 'Contacter mon artisan',
    ctaUrl: 'https://www.seamlier.fr/messages',
  });
  return sendEmail(clientEmail, `Rappel : déposez votre tissu avant le ${depositDate} - SEAMLIER`, html);
}

// ─── PARRAINAGE ──────────────────────────────────────────────────────────────
export async function sendReferralEmail(
  toEmail: string, referrerName: string
): Promise<boolean> {
  console.log(`[sendReferralEmail] Appel → ${toEmail} de la part de "${referrerName}"`);
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailTemplate({
    title: "Invitation \u00e0 rejoindre SEAMLiER",
    badge: "Invitation",
    badgeColor: "bordeaux",
    content: `
      ${p("Bonjour,")}
      ${p(`${strong(referrerName)} vous a transmis une invitation \u00e0 rejoindre SEAMLiER, la plateforme de mise en relation entre clients et artisans couturiers.`)}
      ${p("Pour cr\u00e9er votre compte, utilisez le lien ci-dessous.")}
    `,
    ctaText: "Acc\u00e9der \u00e0 l\u2019inscription",
    ctaUrl: `${baseUrl}/inscription-professionnel`,
  });
  return sendEmail(
    toEmail,
    "Votre invitation SEAMLiER",
    html,
    { "X-Auto-Response-Suppress": "OOF, AutoReply" }
  );
}

// ─── LITIGE ──────────────────────────────────────────────────────────────────
export async function sendDisputeEmail(
  toEmail: string, toName: string, projectTitle: string, projectId: string, isClient: boolean
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const role = isClient ? "client" : "artisan";
  const html = emailTemplate({
    title: 'Un litige a été ouvert',
    badge: '⚠ Litige',
    badgeColor: 'orange',
    content: `
      ${p(`Bonjour ${strong(toName || '')},`)}
      ${p(`Un litige a été ouvert par notre équipe sur la commande ${strong(projectTitle)}. Nous examinons la situation et vous contacterons dans les plus brefs délais.`)}
      ${infoBlock('LITIGE', [
        { label: 'Commande', value: projectTitle },
        { label: 'Votre rôle', value: isClient ? 'Client' : 'Artisan' },
        { label: 'Statut', value: 'En cours d\'examen' },
      ])}
      ${p('<em style="color:#9a8a8d;font-size:12px;">Notre équipe vous contactera directement via la messagerie SEAMLIER pour plus d\'informations.</em>')}
    `,
    ctaText: 'Accéder à mes commandes',
    ctaUrl: `${baseUrl}/${role === 'client' ? 'mes-projets' : 'pro/projets'}`,
  });
  return sendEmail(toEmail, `Litige ouvert — ${projectTitle} — SEAMLIER`, html);
}

// ─── DOSSIER PRO ─────────────────────────────────────────────────────────────
export async function sendDossierStatusEmail(
  toEmail: string, toName: string, status: 'validated' | 'rejected', reason?: string
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const validated = status === 'validated';
  const html = emailTemplate({
    title: validated ? 'Dossier validé ✓' : 'Dossier non conforme',
    badge: validated ? '✓ Validé' : '✕ Non conforme',
    badgeColor: validated ? 'green' : 'orange',
    content: `
      ${p(`Bonjour ${strong(toName || '')},`)}
      ${validated
        ? p('Bonne nouvelle ! Votre dossier professionnel a été validé par notre équipe. Vous pouvez maintenant accéder à toutes les fonctionnalités de la plateforme.')
        : p(`Votre dossier professionnel n'a pas pu être validé en l'état. ${reason ? strong(reason) : 'Merci de recharger les documents manquants ou non conformes.'}`)}
    `,
    ctaText: validated ? 'Accéder à mon espace pro' : 'Mettre à jour mon dossier',
    ctaUrl: `${baseUrl}/pro-dossier`,
    ctaNote: validated ? undefined : 'Notre équipe reste disponible via la messagerie pour toute question.',
  });
  const subject = validated
    ? 'Votre dossier professionnel est validé — SEAMLIER'
    : 'Action requise : votre dossier professionnel — SEAMLIER';
  return sendEmail(toEmail, subject, html);
}

// ─── DEADLINE ────────────────────────────────────────────────────────────────
export async function sendDeadlineWarningEmail(
  recipientEmail: string, recipientName: string, projectTitle: string, deadline: string, role: "artisan" | "admin"
): Promise<boolean> {
  const subject = role === "admin"
    ? `⚠ Deadline proche : ${projectTitle} - SEAMLIER`
    : `⚠ Commande urgente à livrer : ${projectTitle} - SEAMLIER`;
  const intro = role === "admin"
    ? `Le projet ${strong(projectTitle)} a une deadline client au ${strong(deadline)} — moins de 5 jours restants.`
    : `Votre commande ${strong(projectTitle)} doit être prête pour le ${strong(deadline)}. Pensez à organiser votre planning en conséquence.`;
  const html = emailTemplate({
    title: 'Deadline qui approche',
    badge: '⚠ Urgent',
    badgeColor: 'orange',
    content: `
      ${p(`Bonjour ${strong(recipientName || '')},`)}
      ${p(intro)}
      ${dateBlock('DEADLINE', deadline, undefined, projectTitle, '#c45c00')}
    `,
    ctaText: 'Voir la commande',
    ctaUrl: 'https://www.seamlier.fr/mes-projets',
  });
  return sendEmail(recipientEmail, subject, html);
}

// ─── BIENVENUE ARTISANE (avec section documents) ─────────────────────────────
export async function sendTailorWelcomeEmail(
  email: string, token: string, firstName?: string | null
): Promise<boolean> {
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;
  const dossierUrl = `${baseUrl}/pro/dossier`;
  const name = firstName || "artisane";
  const html = emailTemplate({
    title: `Bienvenue sur SEAMLiER, ${name}`,
    badge: "✓ Compte créé",
    badgeColor: "bordeaux",
    content: `
      ${p(`Merci de rejoindre ${strong("SEAMLIER")}, la plateforme qui met en relation clients et artisans couturiers.`)}
      ${p("Commencez par confirmer votre adresse email :")}
      ${p(`<a href="${verifyUrl}" style="color:#6B0F1A;font-size:12px;word-break:break-all;">${verifyUrl}</a>`)}

      <div style="background:#f7f4f0;border:1px solid #e8ddd0;border-radius:8px;padding:20px 24px;margin:20px 0;">
        <p style="margin:0 0 12px;font-weight:700;font-size:14px;color:#3a2a2d;">
          📋 Complétez votre dossier professionnel
        </p>
        <p style="margin:0 0 12px;font-size:13px;color:#5a4448;line-height:1.5;">
          Pour que votre profil soit validé et visible des clients, déposez ces documents dans votre espace :
        </p>
        <ul style="margin:0 0 12px;padding-left:18px;font-size:13px;color:#5a4448;line-height:1.8;">
          <li>CNI (recto/verso) — pièce d'identité en cours de validité</li>
          <li>SIRET / extrait Kbis de moins de 3 mois</li>
          <li>RC Pro (si disponible)</li>
          <li>IBAN — pour recevoir vos paiements</li>
        </ul>
        <p style="margin:0;font-size:12px;color:#9a8a8d;">
          L'équipe SEAMLiER examine chaque dossier sous 48h ouvrées.
        </p>
      </div>
    `,
    ctaText: "Déposer mes documents",
    ctaUrl: dossierUrl,
    ctaNote: "Le lien de vérification email expire dans 24 heures.",
  });
  return sendEmail(email, "Bienvenue sur SEAMLiER — activez votre compte", html);
}