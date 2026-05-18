// utils/emailTemplate.ts
// Template de base SEAMLiER — DA centralisée
// Usage : emailTemplate({ title, badge, badgeColor, content, ctaText, ctaUrl })

export type BadgeColor = 'bordeaux' | 'orange' | 'green' | 'gray';

export interface EmailTemplateOptions {
  /** Titre principal affiché sous le badge (ex: "Rendez-vous confirmé") */
  title: string;
  /** Texte du badge (ex: "✓ Confirmé") */
  badge?: string;
  /** Couleur du badge et de la bordure hero */
  badgeColor?: BadgeColor;
  /** Contenu HTML central (paragraphes, blocs info, etc.) */
  content: string;
  /** Texte du bouton CTA */
  ctaText?: string;
  /** URL du bouton CTA */
  ctaUrl?: string;
  /** Texte discret sous le CTA */
  ctaNote?: string;
}

const COLORS: Record<BadgeColor, string> = {
  bordeaux: '#6B0F1A',
  orange:   '#c45c00',
  green:    '#2d7a3a',
  gray:     '#9a8a8d',
};

const HERO_BG: Record<BadgeColor, string> = {
  bordeaux: '#f7f4f0',
  orange:   '#fff8f0',
  green:    '#f0f7f0',
  gray:     '#f7f4f0',
};

// ─── Blocs réutilisables ────────────────────────────────────────────────────

/**
 * Génère un bloc "cadre bordeaux avec label flottant"
 * Parfait pour : date RDV, montant, deadline, récap commande
 */
export function infoBlock(label: string, rows: { label: string; value: string }[]): string {
  const rowsHtml = rows.map(r => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede8;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#9a8a8d;font-weight:600;">${r.label}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0ede8;font-size:14px;font-weight:600;color:#1a0508;text-align:right;">${r.value}</td>
    </tr>
  `).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border:2px solid #6B0F1A;border-collapse:collapse;">
      <tr>
        <td colspan="2" style="padding:0 0 6px;text-align:center;">
          <span style="display:inline-block;background:#ffffff;padding:0 12px;margin-top:-9px;font-size:10px;font-weight:700;letter-spacing:0.2em;color:#6B0F1A;font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;">${label}</span>
        </td>
      </tr>
      <tr><td colspan="2" style="padding:0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rowsHtml}</table>
      </td></tr>
    </table>
  `;
}

/**
 * Bloc montant mis en valeur (paiement, devis)
 */
export function amountBlock(amount: string, sublabel = 'Montant sécurisé via Stripe'): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border:2px solid #6B0F1A;text-align:center;">
      <tr><td style="padding:28px 32px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:42px;font-weight:700;color:#6B0F1A;letter-spacing:0.04em;">${amount} €</div>
        <div style="font-size:12px;color:#9a8a8d;margin-top:4px;letter-spacing:0.08em;text-transform:uppercase;">${sublabel}</div>
      </td></tr>
    </table>
  `;
}

/**
 * Bloc date (RDV, deadline)
 */
export function dateBlock(label: string, date: string, time?: string, sublabel?: string, color = '#6B0F1A'): string {
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;border:2px solid ${color};text-align:center;">
      <tr><td style="padding:0 0 6px;text-align:center;">
        <span style="display:inline-block;background:#ffffff;padding:0 12px;margin-top:-9px;font-size:10px;font-weight:700;letter-spacing:0.2em;color:${color};font-family:'Barlow Condensed',sans-serif;text-transform:uppercase;">${label}</span>
      </td></tr>
      <tr><td style="padding:16px 32px 24px;">
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:26px;font-weight:700;letter-spacing:0.06em;color:#1a0508;text-transform:uppercase;">${date}</div>
        ${time ? `<div style="font-size:16px;font-weight:500;color:${color};margin-top:6px;letter-spacing:0.08em;">à ${time}</div>` : ''}
        ${sublabel ? `<div style="font-size:12px;color:#9a8a8d;margin-top:4px;text-transform:uppercase;letter-spacing:0.1em;">${sublabel}</div>` : ''}
      </td></tr>
    </table>
  `;
}

/**
 * Paragraphe standard
 */
export function p(text: string): string {
  return `<p style="font-size:15px;line-height:1.75;color:#3a2a2d;margin:0 0 12px;">${text}</p>`;
}

/**
 * Texte en gras bordeaux (pour noms, titres de commandes)
 */
export function strong(text: string): string {
  return `<strong style="color:#6B0F1A;font-weight:600;">${text}</strong>`;
}

// ─── Template principal ─────────────────────────────────────────────────────

export function emailTemplate({
  title,
  badge,
  badgeColor = 'bordeaux',
  content,
  ctaText,
  ctaUrl = 'https://seamlier.fr',
  ctaNote,
}: EmailTemplateOptions): string {

  const accentColor = COLORS[badgeColor];
  const heroBg = HERO_BG[badgeColor];

  const badgeHtml = badge ? `
    <div style="display:inline-block;background-color:${accentColor};color:#fff;font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;padding:4px 10px;margin-bottom:10px;font-family:'Barlow Condensed',sans-serif;">
      ${badge}
    </div><br>
  ` : '';

  const ctaHtml = ctaText ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
      <tr><td style="text-align:center;padding:0 48px 36px;">
        ${ctaNote ? `<p style="font-size:12px;color:#9a8a8d;margin:0 0 20px;letter-spacing:0.02em;">${ctaNote}</p>` : ''}
        <a href="${ctaUrl}" style="display:inline-block;background-color:#6B0F1A;color:#ffffff;text-decoration:none;font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;letter-spacing:0.2em;text-transform:uppercase;padding:16px 48px;">
          ${ctaText}
        </a>
      </td></tr>
    </table>
  ` : '';

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — SEAMLIER</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700&family=Barlow:wght@400;500;600&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background-color:#f0ede8; font-family:'Barlow',sans-serif; -webkit-font-smoothing:antialiased; }
    @media (max-width:480px) {
      .mobile-pad { padding-left:24px !important; padding-right:24px !important; }
      .cta-btn { width:100% !important; display:block !important; padding:16px 24px !important; }
    }
  </style>
</head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ede8;padding:24px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;">

  <!-- HEADER -->
  <tr>
    <td style="background-color:#6B0F1A;border-bottom:4px solid #4a0910;padding:40px 48px 36px;text-align:center;" class="mobile-pad">
      <span style="font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:36px;letter-spacing:0.18em;color:#ffffff;text-transform:uppercase;display:block;">SEAMLIER</span>
      <span style="font-size:11px;font-weight:500;letter-spacing:0.2em;color:rgba(255,255,255,0.55);text-transform:uppercase;margin-top:8px;display:block;">La couture digitalisée</span>
    </td>
  </tr>

  <!-- HERO BAND -->
  <tr>
    <td style="background-color:${heroBg};border-left:4px solid ${accentColor};padding:28px 48px;" class="mobile-pad">
      ${badgeHtml}
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:28px;font-weight:700;letter-spacing:0.04em;color:#1a0508;text-transform:uppercase;">${title}</span>
    </td>
  </tr>

  <!-- CONTENT -->
  <tr>
    <td style="padding:32px 48px 0;" class="mobile-pad">
      ${content}
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr>
    <td style="padding:0 48px;" class="mobile-pad">
      <div style="height:1px;background:linear-gradient(to right,#6B0F1A 40px,#e8e2dc 40px);margin:28px 0;"></div>
    </td>
  </tr>

  <!-- CTA -->
  ${ctaHtml}

  <!-- FOOTER -->
  <tr>
    <td style="background-color:#1a0508;padding:28px 48px;text-align:center;" class="mobile-pad">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:700;letter-spacing:0.22em;color:rgba(255,255,255,0.3);text-transform:uppercase;margin-bottom:12px;">SEAMLIER</div>
      <p style="font-size:11px;color:rgba(255,255,255,0.25);line-height:1.6;letter-spacing:0.04em;">
        © 2026 SEAMLIER — <a href="https://seamlier.fr" style="color:rgba(255,255,255,0.4);text-decoration:underline;">www.seamlier.fr</a><br>
        <a href="#" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Se désabonner</a> · 
        <a href="#" style="color:rgba(255,255,255,0.4);text-decoration:underline;">Politique de confidentialité</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}