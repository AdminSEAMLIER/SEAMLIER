import { jsPDF } from "jspdf";
import { pool } from "./db";

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function fmtEur(cents: number): string {
  return (cents / 100).toFixed(2) + " €";
}

export interface FiscalStats {
  projectCount: number;
  grossTotal: number;
  commission: number;
  netTotal: number;
}

export async function generateAnnualFiscalPdf(
  tailorId: string,
  tailorName: string,
  year: number
): Promise<{ buffer: Buffer; stats: FiscalStats }> {
  const toMysqlDatetime = (d: Date): string => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const yearStart = toMysqlDatetime(new Date(year, 0, 1));
  const yearEnd = toMysqlDatetime(new Date(year + 1, 0, 1));

  const [rows] = await pool.query(
    `SELECT p.amount_total, p.amount_artisan, p.updated_at,
            MONTH(p.updated_at) as month_num
     FROM projects p
     WHERE p.tailor_id = ? AND p.status = 'completed'
       AND p.updated_at >= ? AND p.updated_at < ?
     ORDER BY p.updated_at ASC`,
    [tailorId, yearStart, yearEnd]
  ) as any[];

  const projectRows = Array.isArray(rows) ? rows : [];

  // Monthly aggregation
  type MonthStats = { count: number; gross: number; commission: number; net: number };
  const byMonth: MonthStats[] = Array.from({ length: 12 }, () => ({
    count: 0, gross: 0, commission: 0, net: 0,
  }));

  let totalGross = 0;
  let totalNet = 0;
  let totalCommission = 0;
  let totalCount = 0;

  for (const r of projectRows) {
    const m = (parseInt(r.month_num) - 1); // 0-indexed
    const gross = r.amount_total ? parseFloat(r.amount_total) : 0;
    const net = r.amount_artisan ? parseFloat(r.amount_artisan) : gross;
    const comm = gross - net;

    byMonth[m].count++;
    byMonth[m].gross += gross;
    byMonth[m].net += net;
    byMonth[m].commission += comm;

    totalCount++;
    totalGross += gross;
    totalNet += net;
    totalCommission += comm;
  }

  const stats: FiscalStats = {
    projectCount: totalCount,
    grossTotal: totalGross,
    commission: totalCommission,
    netTotal: totalNet,
  };

  // Generate PDF
  const W = 210;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Header
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SEAMLIER", W / 2, 16, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Récapitulatif fiscal annuel ${year}`, W / 2, 27, { align: "center" });

  // Meta
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Artisan :", 15, 50);
  doc.text("Année :", 15, 58);
  doc.text("Date d'émission :", 15, 66);
  doc.setFont("helvetica", "normal");
  doc.text(tailorName, 55, 50);
  doc.text(String(year), 55, 58);
  const today = new Date();
  doc.text(
    `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`,
    55,
    66
  );

  // Table header
  const colX = { month: 15, count: 65, gross: 95, comm: 135, net: 168 };
  const tableStartY = 80;

  doc.setFillColor(245, 243, 240);
  doc.rect(15, tableStartY, 180, 9, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(114, 47, 55);
  doc.text("Mois", colX.month, tableStartY + 6);
  doc.text("Nb projets", colX.count, tableStartY + 6);
  doc.text("Montant brut", colX.gross, tableStartY + 6);
  doc.text("Commission", colX.comm, tableStartY + 6);
  doc.text("Net artisan", colX.net, tableStartY + 6);

  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setTextColor(40, 40, 40);
  let rowY = tableStartY + 15;

  for (let m = 0; m < 12; m++) {
    const s = byMonth[m];
    const bg = m % 2 === 0;
    if (bg) {
      doc.setFillColor(252, 252, 252);
      doc.rect(15, rowY - 5, 180, 8, "F");
    }
    doc.setFontSize(8.5);
    doc.text(MONTH_NAMES_FR[m], colX.month, rowY);
    doc.text(String(s.count), colX.count, rowY);
    doc.text(s.count > 0 ? fmtEur(s.gross) : "—", colX.gross, rowY);
    doc.text(s.count > 0 ? fmtEur(s.commission) : "—", colX.comm, rowY);
    doc.text(s.count > 0 ? fmtEur(s.net) : "—", colX.net, rowY);
    doc.setDrawColor(230, 228, 225);
    doc.line(15, rowY + 2.5, 195, rowY + 2.5);
    rowY += 9;
  }

  // Totals
  rowY += 4;
  doc.setFillColor(245, 243, 240);
  doc.rect(15, rowY, 180, 10, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);
  doc.text(`TOTAL (${totalCount} projet${totalCount > 1 ? "s" : ""})`, colX.month, rowY + 7);
  doc.text(fmtEur(totalGross), colX.gross, rowY + 7);
  doc.text(fmtEur(totalCommission), colX.comm, rowY + 7);
  doc.text(fmtEur(totalNet), colX.net, rowY + 7);

  rowY += 18;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(114, 47, 55);
  doc.text(`Montant net total transféré : ${fmtEur(totalNet)}`, 15, rowY);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  rowY += 10;
  doc.text("Document à conserver 10 ans à des fins fiscales.", 15, rowY);
  doc.text("Ce document ne constitue pas une déclaration fiscale officielle.", 15, rowY + 6);

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(245, 243, 240);
  doc.rect(0, pageH - 18, W, 18, "F");
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("SEAMLIER — www.seamlier.fr — contact@seamlier.fr", W / 2, pageH - 8, { align: "center" });

  const buffer = Buffer.from(doc.output("arraybuffer"));
  return { buffer, stats };
}
