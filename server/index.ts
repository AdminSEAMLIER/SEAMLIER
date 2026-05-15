import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { ensureTables, pool } from "./db";
import path from "path";
import fs from "fs";
import { schedule } from "node-cron";
import { initSocketIO } from "./socketio";
import { generateMonthlyInvoice } from "./invoice";
import { generateAnnualFiscalPdf } from "./fiscal";
import { sendMonthlyInvoiceEmail, sendKbisExpiryReminderEmail, sendAdminKbisAlertEmail, sendAnnualFiscalRecapEmail, sendAdminFiscalAlertEmail, verifySmtpConnection } from "./email";
import { uploadsDir } from "./upload";

const app = express();
const httpServer = createServer(app);
initSocketIO(httpServer);

const projectRoot = process.cwd();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Serve uploaded files before session/auth middleware — static files need no auth
// and must not be blocked by a session-store query failure.
console.log(`[uploads] Serving static files from: ${uploadsDir}`);
app.use("/uploads", express.static(uploadsDir, { fallthrough: true }));
// Explicit fallback using sendFile so path resolution is logged and verifiable.
app.get("/uploads/*", (req, res) => {
  const relativePath = req.path.replace(/^\/uploads\//, "");
  const safePath = path.resolve(uploadsDir, relativePath);
  const rel = path.relative(uploadsDir, safePath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    return res.status(403).send("Forbidden");
  }
  console.log(`[uploads] sendFile fallback: ${safePath}`);
  res.sendFile(safePath, (err) => {
    if (err) res.status(404).send("Not found");
  });
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await ensureTables();
  verifySmtpConnection(); // non-blocking SMTP diagnostic at startup
  await setupAuth(app);

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Serve the deployment ZIP before Vite/static catch-all
  app.get("/seamlier-deploy.zip", (_req, res) => {
    const fp = path.resolve("seamlier-deploy.zip");
    fs.existsSync(fp) ? res.download(fp) : res.status(404).send("not found");
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ── Cron : factures mensuelles le 1er de chaque mois à 8h ─────────────────
  schedule("0 8 1 * *", async () => {
    const now = new Date();
    const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    log(`[CRON] Génération des factures mensuelles (${prevMonth + 1}/${prevYear})…`, "invoice-cron");

    try {
      const [tailorRows] = await pool.query(
        `SELECT t.id as tailor_id, u.email, u.first_name, u.last_name
         FROM tailors t
         INNER JOIN users u ON t.user_id = u.id
         WHERE t.is_verified = 1`
      ) as any[];

      const tailors = Array.isArray(tailorRows) ? tailorRows : [];
      let sent = 0;

      for (const tailor of tailors) {
        try {
          const tailorName = [tailor.first_name, tailor.last_name].filter(Boolean).join(" ") || tailor.email;
          const { buffer, projects, totals } = await generateMonthlyInvoice(tailor.tailor_id, tailorName, prevMonth, prevYear);

          if (totals.projectCount === 0) continue; // Ne pas envoyer si aucun projet

          await sendMonthlyInvoiceEmail(
            tailor.email,
            tailorName,
            prevMonth,
            prevYear,
            buffer,
            totals.projectCount,
            totals.amountArtisanEur,
            projects,
            totals.amountTotalEur,
            totals.commissionEur
          );
          sent++;
        } catch (err) {
          log(`[CRON] Erreur facture tailor ${tailor.tailor_id}: ${err}`, "invoice-cron");
        }
      }

      log(`[CRON] ${sent} facture(s) envoyée(s) sur ${tailors.length} artisan(s).`, "invoice-cron");
    } catch (err) {
      log(`[CRON] Erreur générale génération factures: ${err}`, "invoice-cron");
    }
  });

  // ── Cron : vérification Kbis expirants — chaque lundi à 8h ───────────────
  schedule("0 8 * * 1", async () => {
    log("[CRON] Vérification des Kbis expirants...", "kbis-cron");
    try {
      const today = new Date();
      const in30Days = new Date(today);
      in30Days.setDate(in30Days.getDate() + 30);
      const toMysqlDate = (d: Date): string => {
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      };

      const [kbisRows] = await pool.query(
        `SELECT t.id, t.kbis_expiry_date, u.email, u.first_name, u.last_name
         FROM tailors t
         INNER JOIN users u ON t.user_id = u.id
         WHERE t.kbis_expiry_date IS NOT NULL
           AND t.kbis_expiry_date >= ? AND t.kbis_expiry_date <= ?`,
        [toMysqlDate(today), toMysqlDate(in30Days)]
      ) as any[];

      const tailorRows = Array.isArray(kbisRows) ? kbisRows : [];
      const adminEmail = process.env.ADMIN_EMAIL || "contact@seamlier.fr";

      for (const t of tailorRows) {
        const tailorName = [t.first_name, t.last_name].filter(Boolean).join(" ") || t.email;
        const expiry = new Date(t.kbis_expiry_date);
        const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const expiryStr = `${String(expiry.getDate()).padStart(2, "0")}/${String(expiry.getMonth() + 1).padStart(2, "0")}/${expiry.getFullYear()}`;

        await sendKbisExpiryReminderEmail(t.email, tailorName, expiryStr, daysLeft);
        await sendAdminKbisAlertEmail(adminEmail, tailorName, expiryStr);
      }

      log(`[CRON] ${tailorRows.length} Kbis expirant(s) traité(s).`, "kbis-cron");
    } catch (err) {
      log(`[CRON] Erreur vérification Kbis: ${err}`, "kbis-cron");
    }
  });

  // ── Cron : récapitulatif fiscal annuel — 1er janvier à 8h ─────────────────
  schedule("0 8 1 1 *", async () => {
    const prevYear = new Date().getFullYear() - 1;
    log(`[CRON] Génération récapitulatifs fiscaux ${prevYear}…`, "fiscal-cron");
    try {
      const adminEmail = process.env.ADMIN_EMAIL || "contact@seamlier.fr";
      const [tailorRows] = await pool.query(
        `SELECT t.id as tailor_id, u.email, u.first_name, u.last_name
         FROM tailors t
         INNER JOIN users u ON t.user_id = u.id
         WHERE t.is_verified = 1`
      ) as any[];

      const tailors = Array.isArray(tailorRows) ? tailorRows : [];

      for (const tailor of tailors) {
        try {
          const tailorName = [tailor.first_name, tailor.last_name].filter(Boolean).join(" ") || tailor.email;
          const { buffer, stats } = await generateAnnualFiscalPdf(tailor.tailor_id, tailorName, prevYear);

          if (stats.projectCount === 0) continue;

          await sendAnnualFiscalRecapEmail(tailor.email, tailorName, prevYear, buffer, {
            projects: stats.projectCount,
            gross: stats.grossTotal,
            commission: stats.commission,
            net: stats.netTotal,
          });

          const grossEur = stats.grossTotal / 100;
          if (grossEur > 3000 || stats.projectCount > 20) {
            await sendAdminFiscalAlertEmail(adminEmail, tailorName, tailor.email, prevYear, stats.grossTotal, stats.projectCount);
          }
        } catch (err) {
          log(`[CRON] Erreur fiscal tailor ${tailor.tailor_id}: ${err}`, "fiscal-cron");
        }
      }

      log(`[CRON] Récapitulatifs fiscaux ${prevYear} terminés.`, "fiscal-cron");
    } catch (err) {
      log(`[CRON] Erreur générale fiscal: ${err}`, "fiscal-cron");
    }
  });

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
