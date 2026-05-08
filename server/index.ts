import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { setupAuth } from "./replit_integrations/auth";
import { ensureTables, pool } from "./db";
import path from "path";
import fs from "fs";
import { schedule } from "node-cron";
import { generateMonthlyInvoice } from "./invoice";
import { sendMonthlyInvoiceEmail } from "./email";

const app = express();
const httpServer = createServer(app);

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
          const { buffer, totals } = await generateMonthlyInvoice(tailor.tailor_id, tailorName, prevMonth, prevYear);

          if (totals.projectCount === 0) continue; // Ne pas envoyer si aucun projet

          await sendMonthlyInvoiceEmail(
            tailor.email,
            tailorName,
            prevMonth,
            prevYear,
            buffer,
            totals.projectCount,
            totals.amountArtisanEur
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
