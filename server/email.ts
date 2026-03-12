import nodemailer from "nodemailer";
import crypto from "crypto";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("SMTP not configured — email sending disabled. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.");
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
