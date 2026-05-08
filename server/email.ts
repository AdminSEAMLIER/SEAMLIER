import nodemailer from "nodemailer";
import crypto from "crypto";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || "mail.seamlier.fr";
  const port = parseInt(process.env.SMTP_PORT || "465");
  const user = process.env.SMTP_USER || "contact@seamlier.fr";
  const pass = process.env.EMAIL_PASSWORD || process.env.SMTP_PASS;

  if (!pass) {
    console.warn("SMTP not configured — email sending disabled. Set EMAIL_PASSWORD (or SMTP_PASS).");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  return transporter;
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function getVerificationExpiry(): Date {
  const expires = new Date();
  expires.setHours(expires.getHours() + 24);
  return expires;
}

export async function sendVerificationEmail(
  email: string,
  token: string,
  firstName?: string | null
): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[EMAIL DISABLED] Verification token for ${email}: ${token}`);
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@seamlier.fr";
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const verifyUrl = `${baseUrl}/api/verify-email?token=${token}`;
  const name = firstName || "utilisateur";

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirmez votre email - Seamlier</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f5f3f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f3f0">
    <tr>
      <td align="center" style="padding:40px 16px">
        <table role="presentation" width="580" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)">

          <!-- Header -->
          <tr>
            <td style="background-color:#722F37;padding:36px 40px;text-align:center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="width:48px;height:48px;border:2px solid rgba(255,255,255,0.3);border-radius:50%;margin:0 auto 16px;line-height:48px;text-align:center">
                      <span style="color:#ffffff;font-size:20px;font-family:Georgia,'Times New Roman',serif;font-style:italic">S</span>
                    </div>
                    <h1 style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman','Playfair Display',serif;font-size:26px;font-weight:400;letter-spacing:3px">SEAMLIER</h1>
                    <div style="width:40px;height:1px;background-color:rgba(255,255,255,0.35);margin:12px auto 0"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:44px 40px 36px">
              <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,'Times New Roman','Playfair Display',serif;font-size:22px;font-weight:400">Bienvenue, ${name}</h2>
              <div style="width:32px;height:2px;background-color:#722F37;margin:0 0 24px"></div>
              <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7">
                Merci de rejoindre <strong style="color:#1f2937">Seamlier</strong>, la plateforme qui connecte les particuliers avec les meilleurs artisans couturiers.
              </p>
              <p style="margin:0 0 32px;color:#4b5563;font-size:15px;line-height:1.7">
                Pour activer votre compte et commencer votre experience, veuillez confirmer votre adresse email :
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:8px 0 36px">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="background-color:#722F37;border-radius:8px">
                          <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:16px 48px;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px">
                            Activer mon compte
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Separator -->
              <div style="width:100%;height:1px;background-color:#e5e7eb;margin:0 0 24px"></div>

              <!-- Fallback link -->
              <p style="margin:0 0 6px;color:#9ca3af;font-size:12px;line-height:1.5">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
              </p>
              <p style="margin:0 0 20px;font-size:12px;line-height:1.5;word-break:break-all">
                <a href="${verifyUrl}" style="color:#722F37;text-decoration:underline">${verifyUrl}</a>
              </p>
              <p style="margin:0;color:#d1d5db;font-size:11px;font-style:italic">Ce lien est valable 24 heures.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#faf9f7;padding:28px 40px;border-top:1px solid #f0eeeb">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 8px;color:#722F37;font-family:Georgia,'Times New Roman','Playfair Display',serif;font-size:14px;font-weight:400;letter-spacing:2px">SEAMLIER</p>
                    <p style="margin:0 0 12px;color:#9ca3af;font-size:12px;line-height:1.5">L'art de la couture locale</p>
                    <a href="https://www.seamlier.fr" style="color:#722F37;font-size:12px;text-decoration:none">www.seamlier.fr</a>
                    <p style="margin:16px 0 0;color:#d1d5db;font-size:11px">&copy; 2026 Seamlier. Tous droits r&eacute;serv&eacute;s.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  try {
    await mailer.sendMail({
      from: `"SEAMLIER" <${from}>`,
      to: email,
      subject: "Confirmez votre email - SEAMLIER",
      html,
    });
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send verification email to ${email}:`, error);
    return false;
  }
}

// ── Shared email template wrapper ────────────────────────────────────────────
function emailWrapper(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f5f3f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f3f0">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="580" cellspacing="0" cellpadding="0" border="0"
        style="max-width:580px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)">
        <tr><td style="background-color:#722F37;padding:28px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400;letter-spacing:3px">SEAMLIER</h1>
        </td></tr>
        <tr><td style="padding:36px 40px">${bodyHtml}</td></tr>
        <tr><td style="background-color:#faf9f7;padding:20px 40px;text-align:center;border-top:1px solid #f0eeeb">
          <p style="margin:0;color:#9ca3af;font-size:11px">© 2026 SEAMLIER — <a href="https://www.seamlier.fr" style="color:#722F37;text-decoration:none">www.seamlier.fr</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) { console.log(`[EMAIL DISABLED] ${subject} → ${to}`); return false; }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@seamlier.fr";
  try {
    await mailer.sendMail({ from: `"SEAMLIER" <${from}>`, to, subject, html });
    console.log(`[EMAIL] ${subject} → ${to}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send "${subject}" to ${to}:`, err);
    return false;
  }
}

export async function sendNewMessageEmail(
  recipientEmail: string, recipientName: string, senderName: string, preview: string
): Promise<boolean> {
  const name = recipientName || "vous";
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Nouveau message — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Nouveau message</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      <strong style="color:#1f2937">${senderName}</strong> vous a envoyé un message sur SEAMLIER :
    </p>
    <div style="background:#f5f3f0;border-left:3px solid #722F37;padding:16px 20px;margin:0 0 28px;border-radius:0 8px 8px 0">
      <p style="margin:0;color:#4b5563;font-size:14px;font-style:italic">"${preview}"</p>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/messages" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Voir le message</a>
      </td></tr>
    </table>
  `);
  return sendEmail(recipientEmail, `Nouveau message de ${senderName} — SEAMLIER`, html);
}

export async function sendDeliveryEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = clientName || "vous";
  const html = emailWrapper("Votre commande est prête — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Votre commande est prête !</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Bonne nouvelle ! <strong>${tailorName}</strong> a terminé votre commande <strong>"${projectTitle}"</strong>.
      Vous pouvez maintenant confirmer la réception et laisser un avis.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:24px">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/mes-projets" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Confirmer la réception</a>
      </td></tr>
    </table>
    <p style="margin:0;color:#9ca3af;font-size:12px">Vous avez 48h pour signaler tout problème à notre support.</p>
  `);
  return sendEmail(clientEmail, `Votre commande "${projectTitle}" est prête — SEAMLIER`, html);
}

export async function sendReviewRequestEmail(
  clientEmail: string, clientName: string, tailorName: string, projectId: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Donnez votre avis — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Votre avis compte !</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${clientName || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Votre commande avec <strong>${tailorName}</strong> est terminée. Prenez 30 secondes pour laisser un avis — cela aide les autres clients et valorise le travail des artisans.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/mes-projets" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Laisser un avis</a>
      </td></tr>
    </table>
  `);
  return sendEmail(clientEmail, `Laissez votre avis sur votre commande SEAMLIER`, html);
}

export async function sendPaymentConfirmationEmail(
  clientEmail: string, clientName: string, tailorName: string, projectTitle: string, amount: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Paiement confirmé — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Paiement confirmé</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${clientName || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Votre paiement de <strong>${amount}€</strong> pour la commande <strong>"${projectTitle}"</strong>
      avec <strong>${tailorName}</strong> a été validé. La confection peut maintenant commencer !
    </p>
    <div style="background:#f5f3f0;border-radius:8px;padding:16px 20px;margin:0 0 24px">
      <table style="width:100%">
        <tr><td style="color:#6b7280;font-size:13px">Artisan</td><td style="text-align:right;font-weight:600;font-size:13px;color:#1f2937">${tailorName}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding-top:8px">Commande</td><td style="text-align:right;font-weight:600;font-size:13px;color:#1f2937;padding-top:8px">${projectTitle}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding-top:8px">Montant</td><td style="text-align:right;font-weight:700;font-size:15px;color:#722F37;padding-top:8px">${amount}€</td></tr>
      </table>
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/mes-projets" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Suivre ma commande</a>
      </td></tr>
    </table>
  `);
  return sendEmail(clientEmail, `Paiement confirmé — ${projectTitle}`, html);
}

export async function sendAppointmentConfirmationEmail(
  toEmail: string, toName: string, scheduledAt: Date | string, appointmentType: string, otherPartyName: string
): Promise<boolean> {
  const dt = new Date(scheduledAt);
  const dateStr = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Rendez-vous confirmé — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Rendez-vous confirmé</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${toName || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Votre rendez-vous <strong>${appointmentType}</strong> avec <strong>${otherPartyName}</strong> est confirmé :
    </p>
    <div style="background:#f5f3f0;border-radius:8px;padding:16px 20px;margin:0 0 24px;text-align:center">
      <p style="margin:0 0 4px;color:#722F37;font-size:18px;font-weight:700">${dateStr}</p>
      <p style="margin:0;color:#4b5563;font-size:15px">à ${timeStr}</p>
    </div>
    <p style="margin:0 0 20px;color:#9ca3af;font-size:12px">Un rappel vous sera envoyé 24h avant le rendez-vous.</p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/mes-rendez-vous" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Voir mes rendez-vous</a>
      </td></tr>
    </table>
  `);
  return sendEmail(toEmail, `RDV confirmé — ${dateStr} à ${timeStr}`, html);
}

export async function sendAppointmentReminderEmail(
  toEmail: string, toName: string, scheduledAt: Date | string, appointmentType: string, otherPartyName: string
): Promise<boolean> {
  const dt = new Date(scheduledAt);
  const timeStr = dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Rappel rendez-vous — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Rappel : rendez-vous demain</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${toName || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Rappel : vous avez un rendez-vous <strong>${appointmentType}</strong> avec <strong>${otherPartyName}</strong> demain à <strong>${timeStr}</strong>.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/mes-rendez-vous" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Voir mes rendez-vous</a>
      </td></tr>
    </table>
  `);
  return sendEmail(toEmail, `Rappel : votre RDV avec ${otherPartyName} demain à ${timeStr}`, html);
}

export async function sendPasswordResetEmail(email: string, token: string, firstName?: string | null): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[EMAIL DISABLED] Password reset token for ${email}: ${token}`);
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@seamlier.fr";
  const baseUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const resetUrl = `${baseUrl}/reinitialiser-mot-de-passe?token=${token}`;
  const name = firstName || "utilisateur";
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Réinitialisation de mot de passe - Seamlier</title></head>
<body style="margin:0;padding:0;background-color:#f5f3f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f5f3f0">
    <tr><td align="center" style="padding:40px 16px">
      <table role="presentation" width="580" cellspacing="0" cellpadding="0" border="0" style="max-width:580px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06)">
        <tr><td style="background-color:#722F37;padding:36px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:400;letter-spacing:3px">SEAMLIER</h1>
        </td></tr>
        <tr><td style="padding:44px 40px 36px">
          <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:400">Réinitialisation de votre mot de passe</h2>
          <div style="width:32px;height:2px;background-color:#722F37;margin:0 0 24px"></div>
          <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name},</p>
          <p style="margin:0 0 28px;color:#4b5563;font-size:15px;line-height:1.7">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau. Ce lien est valable <strong>2 heures</strong>.</p>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td align="center" style="padding:8px 0 36px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="background-color:#722F37;border-radius:8px">
                  <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:16px 48px;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.5px">Réinitialiser mon mot de passe</a>
                </td></tr>
              </table>
            </td></tr>
          </table>
          <p style="margin:0;color:#9ca3af;font-size:13px;line-height:1.6">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe ne sera pas modifié.</p>
          <p style="margin:16px 0 0;color:#9ca3af;font-size:12px">Ou copiez ce lien : <a href="${resetUrl}" style="color:#722F37">${resetUrl}</a></p>
        </td></tr>
        <tr><td style="background-color:#f9fafb;padding:24px 40px;text-align:center">
          <p style="margin:0;color:#9ca3af;font-size:12px">© 2026 SEAMLIER — La couture sur mesure</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  try {
    await mailer.sendMail({ from: `"SEAMLIER" <${from}>`, to: email, subject: "Réinitialisation de votre mot de passe - SEAMLIER", html });
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`Failed to send password reset email to ${email}:`, error);
    return false;
  }
}

export async function sendFabricDepositReminderEmail(
  clientEmail: string,
  clientName: string,
  artisanName: string,
  depositDate: string
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Rappel dépôt de tissu — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">🧵 Rappel — Dépôt de tissu</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${clientName || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Vous devez déposer votre tissu chez <strong style="color:#1f2937">${artisanName}</strong> avant le <strong style="color:#722F37">${depositDate}</strong>.
      N'oubliez pas cette étape pour que votre confection démarre dans les meilleures conditions !
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px">En cas de question, contactez votre artisan directement via la messagerie SEAMLIER.</p>
  `);
  return sendEmail(clientEmail, `Rappel : déposez votre tissu avant le ${depositDate} - SEAMLIER`, html);
}

export async function sendDeadlineWarningEmail(
  recipientEmail: string,
  recipientName: string,
  projectTitle: string,
  deadline: string,
  role: "artisan" | "admin"
): Promise<boolean> {
  const subject = role === "admin"
    ? `⚠️ Deadline proche : ${projectTitle} - SEAMLIER`
    : `⚠️ Commande urgente à livrer : ${projectTitle} - SEAMLIER`;
  const intro = role === "admin"
    ? `Le projet <strong style="color:#1f2937">${projectTitle}</strong> a une deadline client au <strong style="color:#dc2626">${deadline}</strong> — moins de 5 jours restants.`
    : `Votre commande <strong style="color:#1f2937">${projectTitle}</strong> doit être prête pour le <strong style="color:#dc2626">${deadline}</strong>. Pensez à organiser votre planning en conséquence.`;
  const html = emailWrapper("Deadline qui approche — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#dc2626;font-family:Georgia,serif;font-size:20px;font-weight:400">⚠️ Deadline qui approche</h2>
    <div style="width:28px;height:2px;background-color:#dc2626;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${recipientName || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">${intro}</p>
  `);
  return sendEmail(recipientEmail, subject, html);
}

export async function sendDossierValidatedEmail(email: string, name: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Dossier validé — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Votre dossier a été validé !</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Bonne nouvelle ! Votre dossier professionnel a été <strong style="color:#16a34a">validé</strong> par l'équipe SEAMLIER.
      Votre profil est désormais vérifié et visible par les clients.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/dashboard-pro" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Accéder à mon espace</a>
      </td></tr>
    </table>
  `);
  return sendEmail(email, "Votre dossier professionnel a été validé — SEAMLIER", html);
}

export async function sendDossierRejectedEmail(email: string, name: string, reason: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Dossier à compléter — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Action requise sur votre dossier</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Votre dossier professionnel n'a pas pu être validé en l'état. Voici le motif indiqué par notre équipe :
    </p>
    <div style="background:#fef2f2;border-left:3px solid #dc2626;padding:16px 20px;margin:0 0 24px;border-radius:0 8px 8px 0">
      <p style="margin:0;color:#7f1d1d;font-size:14px">${reason || "Documents manquants ou illisibles."}</p>
    </div>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Veuillez mettre à jour votre dossier avec les documents corrects.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/pro-dossier" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Mettre à jour mon dossier</a>
      </td></tr>
    </table>
  `);
  return sendEmail(email, "Action requise — Votre dossier professionnel SEAMLIER", html);
}

export async function sendKbisExpiryReminderEmail(
  email: string, name: string, expiryDate: string, daysLeft: number
): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Kbis bientôt expiré — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#d97706;font-family:Georgia,serif;font-size:20px;font-weight:400">Votre Kbis expire bientôt</h2>
    <div style="width:28px;height:2px;background-color:#d97706;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Votre extrait Kbis arrive à expiration dans <strong style="color:#d97706">${daysLeft} jour${daysLeft > 1 ? "s" : ""}</strong>
      (le <strong>${expiryDate}</strong>).
      Pensez à le renouveler et à mettre à jour votre dossier sur SEAMLIER.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/pro-dossier" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Mettre à jour mon Kbis</a>
      </td></tr>
    </table>
  `);
  return sendEmail(email, `Rappel : votre Kbis expire dans ${daysLeft} jour${daysLeft > 1 ? "s" : ""} — SEAMLIER`, html);
}

export async function sendAdminKbisAlertEmail(
  adminEmail: string, tailorName: string, expiryDate: string
): Promise<boolean> {
  const html = emailWrapper("Alerte Kbis artisan — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#d97706;font-family:Georgia,serif;font-size:20px;font-weight:400">Alerte : Kbis artisan bientôt expiré</h2>
    <div style="width:28px;height:2px;background-color:#d97706;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">
      Le Kbis de l'artisan <strong>${tailorName}</strong> expire le <strong style="color:#d97706">${expiryDate}</strong>.
    </p>
    <p style="margin:0;color:#6b7280;font-size:13px">Pensez à en informer l'artisan ou à vérifier son dossier dans la console d'administration.</p>
  `);
  return sendEmail(adminEmail, `[ADMIN] Kbis expirant — ${tailorName}`, html);
}

export async function sendAnnualFiscalRecapEmail(
  email: string,
  name: string,
  year: number,
  pdfBuffer: Buffer,
  stats: { projects: number; gross: number; commission: number; net: number }
): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[EMAIL DISABLED] Annual fiscal recap for ${email} (${year})`);
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@seamlier.fr";
  const html = emailWrapper(`Récapitulatif fiscal ${year} — SEAMLIER`, `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Votre récapitulatif fiscal ${year}</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name || ""},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Veuillez trouver ci-joint votre récapitulatif fiscal annuel pour l'année <strong>${year}</strong>.
    </p>
    <div style="background:#f5f3f0;border-radius:10px;padding:20px 24px;margin:0 0 24px">
      <table style="width:100%">
        <tr><td style="color:#6b7280;font-size:13px">Projets complétés</td><td style="text-align:right;font-weight:600;font-size:13px;color:#1f2937">${stats.projects}</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding-top:8px">Montant brut</td><td style="text-align:right;font-weight:600;font-size:13px;color:#1f2937;padding-top:8px">${(stats.gross / 100).toFixed(2)} €</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding-top:8px">Commission SEAMLIER</td><td style="text-align:right;font-weight:600;font-size:13px;color:#1f2937;padding-top:8px">${(stats.commission / 100).toFixed(2)} €</td></tr>
        <tr><td style="color:#6b7280;font-size:13px;padding-top:8px">Net perçu</td><td style="text-align:right;font-weight:700;font-size:15px;color:#722F37;padding-top:8px">${(stats.net / 100).toFixed(2)} €</td></tr>
      </table>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6">
      Le récapitulatif détaillé (PDF) est joint à cet email.<br>
      Ce document est à conserver 10 ans à des fins fiscales.
    </p>
  `);
  try {
    await mailer.sendMail({
      from: `"SEAMLIER" <${from}>`,
      to: email,
      subject: `Récapitulatif fiscal SEAMLIER — ${year}`,
      html,
      attachments: [{
        filename: `SEAMLIER_recap_fiscal_${year}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      }],
    });
    console.log(`[EMAIL] Annual fiscal recap sent to ${email} (${year})`);
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
  const html = emailWrapper(`Alerte fiscale artisan ${year} — SEAMLIER`, `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Alerte : artisan avec fort volume ${year}</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      L'artisan <strong>${tailorName}</strong> (${tailorEmail}) a dépassé le seuil de vigilance fiscale pour ${year} :
    </p>
    <div style="background:#f5f3f0;border-radius:10px;padding:16px 20px;margin:0 0 24px">
      <p style="margin:0 0 6px;color:#4b5563;font-size:14px"><strong>Projets complétés :</strong> ${projectCount}</p>
      <p style="margin:0;color:#4b5563;font-size:14px"><strong>Montant brut :</strong> <span style="color:#722F37;font-weight:700">${(gross / 100).toFixed(2)} €</span></p>
    </div>
    <p style="margin:0;color:#6b7280;font-size:13px">Vérifiez la situation dans la console d'administration SEAMLIER.</p>
  `);
  return sendEmail(adminEmail, `[ADMIN] Alerte fiscale — ${tailorName} (${year})`, html);
}

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export async function sendMonthlyInvoiceEmail(
  tailorEmail: string,
  tailorName: string,
  month: number, // 0-indexed
  year: number,
  pdfBuffer: Buffer,
  projectCount: number,
  netAmountEur: number
): Promise<boolean> {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[EMAIL DISABLED] Monthly invoice for ${tailorEmail} (${MONTH_NAMES_FR[month]} ${year})`);
    return false;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@seamlier.fr";
  const monthLabel = MONTH_NAMES_FR[month] + " " + year;
  const name = tailorName || "Artisan";

  const html = emailWrapper(`Récapitulatif ${monthLabel} — SEAMLIER`, `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Votre récapitulatif de ${monthLabel}</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 12px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name},</p>
    <p style="margin:0 0 20px;color:#4b5563;font-size:15px;line-height:1.7">
      Veuillez trouver ci-joint votre récapitulatif de facturation pour le mois de <strong style="color:#1f2937">${monthLabel}</strong>.
    </p>
    <div style="background:#f5f3f0;border-radius:10px;padding:20px 24px;margin:0 0 24px">
      <p style="margin:0 0 6px;color:#4b5563;font-size:14px">
        <strong style="color:#1f2937">Confections complétées :</strong> ${projectCount}
      </p>
      <p style="margin:0;color:#4b5563;font-size:14px">
        <strong style="color:#1f2937">Montant net transféré :</strong>
        <span style="color:#722F37;font-size:16px;font-weight:700"> ${(netAmountEur / 100).toFixed(2)} €</span>
      </p>
    </div>
    <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6">
      La facture détaillée (PDF) est jointe à cet email.<br>
      Pour toute question, contactez-nous à <a href="mailto:contact@seamlier.fr" style="color:#722F37">contact@seamlier.fr</a>.
    </p>
  `);

  const filename = `SEAMLIER_facture_${MONTH_NAMES_FR[month]}_${year}.pdf`;
  try {
    await mailer.sendMail({
      from: `"SEAMLIER" <${from}>`,
      to: tailorEmail,
      subject: `Récapitulatif SEAMLIER — ${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}`,
      html,
      attachments: [{ filename, content: pdfBuffer, contentType: "application/pdf" }],
    });
    console.log(`[EMAIL] Monthly invoice sent to ${tailorEmail} (${monthLabel})`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Failed to send monthly invoice to ${tailorEmail}:`, err);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, firstName?: string | null): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const name = firstName || "vous";
  const html = emailWrapper("Bienvenue sur SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Bienvenue, ${name} !</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.7">
      Votre adresse email est confirmée. Votre compte SEAMLIER est maintenant actif.
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7">
      Découvrez nos artisans couturiers, déposez vos mesures et lancez votre première commande.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/decouverte" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Découvrir les artisans</a>
      </td></tr>
    </table>
  `);
  return sendEmail(email, "Bienvenue sur SEAMLIER", html);
}

export async function sendDossierReceivedEmail(email: string, name: string): Promise<boolean> {
  const appUrl = process.env.APP_URL || "https://www.seamlier.fr";
  const html = emailWrapper("Dossier reçu — SEAMLIER", `
    <h2 style="margin:0 0 8px;color:#1f2937;font-family:Georgia,serif;font-size:20px;font-weight:400">Dossier bien reçu</h2>
    <div style="width:28px;height:2px;background-color:#722F37;margin:0 0 20px"></div>
    <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.7">Bonjour ${name},</p>
    <p style="margin:0 0 16px;color:#4b5563;font-size:15px;line-height:1.7">
      Nous avons bien reçu votre document. Notre équipe l'examinera sous <strong>48 à 72 heures ouvrées</strong>.
    </p>
    <p style="margin:0 0 24px;color:#4b5563;font-size:15px;line-height:1.7">
      Vous recevrez un email dès que votre dossier sera traité. En attendant, vous pouvez compléter ou remplacer vos documents depuis votre espace.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr><td style="background-color:#722F37;border-radius:8px">
        <a href="${appUrl}/pro-dossier" style="display:inline-block;padding:14px 36px;color:#fff;font-size:14px;font-weight:600;text-decoration:none">Voir mon dossier</a>
      </td></tr>
    </table>
  `);
  return sendEmail(email, "Nous avons bien reçu votre document — SEAMLIER", html);
}
