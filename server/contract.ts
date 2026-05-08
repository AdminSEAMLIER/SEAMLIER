import { jsPDF } from "jspdf";
import path from "path";
import fs from "fs";
import { uploadsDir } from "./upload";

const contractsDir = path.join(uploadsDir, "contracts");
fs.mkdirSync(contractsDir, { recursive: true });

function formatDateFr(d: Date | string | null | undefined): string {
  if (!d) return "Non définie";
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`;
}

export async function generateProjectContract(
  project: any,
  tailorUser: any,
  clientUser: any
): Promise<string> {
  const W = 210;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const tailorName = tailorUser
    ? [tailorUser.firstName, tailorUser.lastName].filter(Boolean).join(" ") || "Artisan"
    : "Artisan";
  const tailorEmail = tailorUser?.email || "";
  const clientName = clientUser
    ? [clientUser.firstName, clientUser.lastName].filter(Boolean).join(" ") || "Client"
    : "Client";
  const clientEmail = clientUser?.email || "";

  // Header
  doc.setFillColor(114, 47, 55);
  doc.rect(0, 0, W, 38, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("SEAMLIER", W / 2, 16, { align: "center" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Contrat de prestation de service", W / 2, 27, { align: "center" });
  doc.setFontSize(9);
  doc.text(`Référence : ${project.id}`, W / 2, 34, { align: "center" });

  let y = 50;

  // Section: Entre les parties
  doc.setTextColor(114, 47, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("ENTRE LES PARTIES", 15, y);
  doc.setDrawColor(114, 47, 55);
  doc.line(15, y + 2, 195, y + 2);
  y += 10;

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("L'Artisan (Prestataire) :", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${tailorName} — ${tailorEmail}`, 65, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Le Client (Commanditaire) :", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(`${clientName} — ${clientEmail}`, 65, y);
  y += 14;

  // Section: Objet
  doc.setTextColor(114, 47, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("OBJET DU CONTRAT", 15, y);
  doc.setDrawColor(114, 47, 55);
  doc.line(15, y + 2, 195, y + 2);
  y += 10;

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Titre du projet :", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(project.title || "—", 55, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Type de vêtement :", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(project.clothingType || "—", 55, y);
  y += 8;

  if (project.description) {
    doc.setFont("helvetica", "bold");
    doc.text("Description :", 15, y);
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(project.description, 170);
    doc.text(lines, 15, y);
    y += lines.length * 5 + 4;
  }
  y += 4;

  // Section: Montant
  doc.setTextColor(114, 47, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CONDITIONS FINANCIÈRES", 15, y);
  doc.setDrawColor(114, 47, 55);
  doc.line(15, y + 2, 195, y + 2);
  y += 10;

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Montant convenu :", 15, y);
  doc.setFont("helvetica", "normal");
  const montant = project.amountTotal
    ? `${(project.amountTotal / 100).toFixed(2)} €`
    : project.amount
    ? `${project.amount} €`
    : "À définir";
  doc.text(montant, 55, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Date de début :", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateFr(new Date()), 55, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("Livraison prévue :", 15, y);
  doc.setFont("helvetica", "normal");
  doc.text(formatDateFr(project.deliveryDate || project.clientDeadline), 55, y);
  y += 14;

  // Section: Conditions générales
  doc.setTextColor(114, 47, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("CONDITIONS GÉNÉRALES", 15, y);
  doc.setDrawColor(114, 47, 55);
  doc.line(15, y + 2, 195, y + 2);
  y += 10;

  doc.setTextColor(40, 40, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const cg = [
    "1. L'artisan s'engage à réaliser la prestation décrite avec soin et selon les règles de l'art.",
    "2. Le paiement est sécurisé via la plateforme SEAMLIER et libéré à la validation de la livraison.",
    "3. Toute modification majeure de la commande doit faire l'objet d'un avenant écrit via la messagerie SEAMLIER.",
    "4. En cas de litige, les parties s'engagent à tenter une résolution amiable avant toute action judiciaire.",
    "5. La plateforme SEAMLIER agit en qualité d'intermédiaire et ne saurait être tenue responsable de l'exécution de la prestation.",
    "6. Ce contrat est régi par le droit français.",
  ];
  for (const line of cg) {
    const wrapped = doc.splitTextToSize(line, 170);
    doc.text(wrapped, 15, y);
    y += wrapped.length * 5 + 2;
  }
  y += 8;

  // Signatures
  if (y > 240) {
    doc.addPage();
    y = 20;
  }

  doc.setTextColor(114, 47, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("SIGNATURES", 15, y);
  doc.setDrawColor(114, 47, 55);
  doc.line(15, y + 2, 195, y + 2);
  y += 14;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("L'Artisan :", 15, y);
  doc.text("Le Client :", 110, y);
  y += 6;
  doc.text(tailorName, 15, y);
  doc.text(clientName, 110, y);
  y += 6;
  doc.text(`Date : ${formatDateFr(new Date())}`, 15, y);
  doc.text(`Date : ${formatDateFr(new Date())}`, 110, y);
  y += 16;

  doc.setDrawColor(180, 180, 180);
  doc.line(15, y, 90, y);
  doc.line(110, y, 185, y);
  y += 5;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text("Signature", 15, y);
  doc.text("Signature", 110, y);

  // Footer
  const pageH = doc.internal.pageSize.height;
  doc.setFillColor(245, 243, 240);
  doc.rect(0, pageH - 18, W, 18, "F");
  doc.setTextColor(140, 140, 140);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("SEAMLIER — www.seamlier.fr — contact@seamlier.fr", W / 2, pageH - 8, { align: "center" });

  const filename = `${project.id}.pdf`;
  const filePath = path.join(contractsDir, filename);
  const buffer = Buffer.from(doc.output("arraybuffer"));
  fs.writeFileSync(filePath, buffer);

  return `/uploads/contracts/${filename}`;
}
