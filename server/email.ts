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
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:Inter,Arial,sans-serif;background:#faf9f7">
  <div style="max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
    <div style="background:#722F37;padding:32px;text-align:center">
      <h1 style="color:#fff;font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0">SEAMLIER</h1>
      <p style="color:rgba(255,255,255,0.8);font-size:14px;margin:8px 0 0">L'art de la couture locale</p>
    </div>
    <div style="padding:40px 32px">
      <h2 style="color:#722F37;font-size:22px;margin:0 0 16px">Bienvenue ${name} !</h2>
      <p style="color:#4b5563;line-height:1.6;margin:0 0 24px">
        Merci de vous être inscrit(e) sur SEAMLIER. Pour activer votre compte et commencer à utiliser la plateforme, veuillez confirmer votre adresse email en cliquant sur le bouton ci-dessous :
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:#722F37;color:#fff;text-decoration:none;padding:14px 40px;border-radius:8px;font-weight:600;font-size:16px">
          Confirmer mon email
        </a>
      </div>
      <p style="color:#9ca3af;font-size:13px;line-height:1.5;margin:24px 0 0">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        <a href="${verifyUrl}" style="color:#722F37;word-break:break-all">${verifyUrl}</a>
      </p>
      <p style="color:#9ca3af;font-size:13px;margin:16px 0 0">Ce lien expire dans 24 heures.</p>
    </div>
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #e5e7eb">
      <p style="color:#9ca3af;font-size:12px;margin:0">© SEAMLIER – L'art de la couture locale et simplifiée.</p>
    </div>
  </div>
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
