import { jsPDF } from "jspdf";
import { pool } from "./db";

export interface InvoiceProject {
  title: string;
  clientName: string;
  completedAt: Date;
  amountTotalEur: number;
  amountArtisanEur: number;
  commissionEur: number;
}

export interface InvoiceTotals {
  amountTotalEur: number;
  amountArtisanEur: number;
  commissionEur: number;
  projectCount: number;
}

function formatDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function fmtEur(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}

const MONTH_NAMES_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];

export async function generateMonthlyInvoice(
  tailorId: string,
  tailorName: string,
  month: number, // 0-indexed (0 = january)
  year: number
): Promise<{ buffer: Buffer; projects: InvoiceProject[]; totals: InvoiceTotals }> {
  const firstOfMonth = new Date(year, month, 1);
  const firstOfNextMonth = new Date(year, month + 1, 1);

  const [rows] = await pool.query(
    `SELECT p.id, p.title, p.amount, p.amount_total, p.amount_artisan, p.updated_at,
            u.first_name, u.last_name
     FROM projects p
     LEFT JOIN users u ON p.client_id = u.id
     WHERE p.tailor_id = ? AND p.status = 'completed'
       AND p.updated_at >= ? AND p.updated_at < ?
     ORDER BY p.updated_at ASC`,
    [tailorId, firstOfMonth, firstOfNextMonth]
  ) as any[];

  const projects: InvoiceProject[] = (Array.isArray(rows) ? rows : []).map((r: any) => {
    const total = r.amount_total ? parseFloat(r.amount_total) : (parseFloat(r.amount) || 0) * 100;
    const artisan = r.amount_artisan ? parseFloat(r.amount_artisan) : total;
    return {
      title: r.title || "Confection",
      clientName: [r.first_name, r.last_name].filter(Boolean).join(" ") || "Client",
      completedAt: new Date(r.updated_at),
      amountTotalEur: total,
      amountArtisanEur: artisan,
      commissionEur: total - artisan,
    };
  });

  const totals: InvoiceTotals = projects.reduce(
    (acc, p) => ({
      amountTotalEur: acc.amountTotalEur + p.amountTotalEur,
      amountArtisanEur: acc.amountArtisanEur + p.amountArtisanEur,
      commissionEur: acc.commissionEur + p.commissionEur,
      projectCount: acc.projectCount + 1,
    }),
    { amountTotalEur: 0, amountArtisanEur: 0, commissionEur: 0, projectCount: 0 }
  );

  const monthLabel = `${MONTH_NAMES_FR[month]} ${year}`;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;

  // ── Header ──────────────────────────────────────────────────────────────────
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SEAMLIER", W / 2, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Récapitulatif mensuel de facturation", W / 2, 28, { align: "center" });

  // ── Invoice meta ─────────────────────────────────────────────────────────────
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Artisan :", 15, 52);
  doc.text("Période :", 15, 60);
  doc.text("Date d'émission :", 15, 68);
  doc.setFont("helvetica", "normal");
  doc.text(tailorName, 55, 52);
  doc.text(monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1), 55, 60);
  doc.text(formatDate(new Date()), 55, 68);

  // ── Table header ─────────────────────────────────────────────────────────────
  const colX = { title: 15, client: 75, date: 120, total: 148, artisan: 178 };
  const tableStartY = 82;

  doc.setFillColor(245, 243, 240);
  doc.rect(15, tableStartY, 180, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(114, 47, 55);
  doc.text("Confection", colX.title, tableStartY + 6);
  doc.text("Client", colX.client, tableStartY + 6);
  doc.text("Date", colX.date, tableStartY + 6);
  doc.text("Montant client", colX.total, tableStartY + 6);
  doc.text("Votre part", colX.artisan, tableStartY + 6);

  // ── Table rows ────────────────────────────────────────────────────────────────
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  let rowY = tableStartY + 15;

  if (projects.length === 0) {
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.text("Aucune confection complétée ce mois.", W / 2, rowY, { align: "center" });
    rowY += 10;
  }

  for (const p of projects) {
    if (rowY > 265) {
      doc.addPage();
      rowY = 20;
    }
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(p.title.length > 28 ? p.title.substring(0, 27) + "…" : p.title, colX.title, rowY);
    doc.text(p.clientName.length > 18 ? p.clientName.substring(0, 17) + "…" : p.clientName, colX.client, rowY);
    doc.text(formatDate(p.completedAt), colX.date, rowY);
    doc.text(fmtEur(p.amountTotalEur), colX.total, rowY);
    doc.text(fmtEur(p.amountArtisanEur), colX.artisan, rowY);
    doc.setDrawColor(230, 228, 225);
    doc.line(15, rowY + 2.5, 195, rowY + 2.5);
    rowY += 9;
  }

  // ── Totals ────────────────────────────────────────────────────────────────────
  rowY += 4;
  doc.setFillColor(245, 243, 240);
  doc.rect(15, rowY, 180, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`TOTAL (${totals.projectCount} confection${totals.projectCount > 1 ? "s" : ""})`, colX.title, rowY + 7);
  doc.text(fmtEur(totals.amountTotalEur), colX.total, rowY + 7);
  doc.text(fmtEur(totals.amountArtisanEur), colX.artisan, rowY + 7);

  rowY += 18;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(114, 47, 55);
  doc.text(`Commission SEAMLIER retenue : ${fmtEur(totals.commissionEur)}`, colX.title, rowY);
  doc.setFont("helvetica", "bold");
  doc.text(`Montant net transféré sur votre compte : ${fmtEur(totals.amountArtisanEur)}`, colX.title, rowY + 8);

  // ── Footer ───────────────────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(245, 243, 240);
  doc.rect(0, pageH - 18, W, 18, "F");
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("SEAMLIER — www.seamlier.fr — contact@seamlier.fr", W / 2, pageH - 8, { align: "center" });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return { buffer, projects, totals };
}
