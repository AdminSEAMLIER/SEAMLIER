import type { Express, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";
import { pool } from "./db";
import { sendPaymentConfirmationEmail, sendAdminChargebackAlertEmail, sendSubscriptionPaymentFailedEmail, sendArtisanPaymentReceivedEmail } from "./email";
import { sendPushNotification } from "./push";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY || '';
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-04-10" as any });
const FRAIS = 0.10;
const COMM = 0.15;

const PRICES = {
  month: process.env.STRIPE_PRICE_MONTHLY || "price_1TBzcSLyrGmm31qYwOfOb6Bz",
  year:  process.env.STRIPE_PRICE_YEARLY  || "price_1TC3PaLyrGmm31qYgtlR1Lwd",
};

function calc(prix: number, plan: string) {
  const frais = Math.round(prix * FRAIS * 100) / 100;
  const total = prix + frais;
  const comm = plan === "starter" ? Math.round(prix * COMM * 100) / 100 : 0;
  return {
    euros: { prixConfection: prix, fraisClient: frais, totalClient: total, commissionArtisan: comm, montantArtisan: prix - comm },
    centimes: { totalClient: Math.round(total * 100), montantArtisan: Math.round((prix - comm) * 100) },
  };
}

export function registerStripeRoutes(app: Express) {

  // ── Webhook Stripe ────────────────────────────────────────────────────────
  app.post("/api/stripe/webhook", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const event = stripe.webhooks.constructEvent(
        req.rawBody as Buffer,
        req.headers["stripe-signature"] as string,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
      console.log("[Stripe webhook]", event.type);

      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object as Stripe.PaymentIntent;
        const projectId = pi.metadata?.projectId;
        if (projectId) {
          await storage.updateProject(projectId, { paymentStatus: "paid" } as any);
          console.log(`[Stripe] Projet ${projectId} → paymentStatus = paid`);
          try {
            const [rows] = await pool.query(`
              SELECT p.title, p.amount_total, p.amount_artisan, p.client_id, t.subscription_plan, t.user_id AS tailor_user_id,
                     uc.email AS client_email, uc.first_name AS client_first, uc.last_name AS client_last,
                     ut.email AS tailor_email, ut.first_name AS tailor_first, ut.last_name AS tailor_last
              FROM projects p
              JOIN users uc ON uc.id = p.client_id
              JOIN tailors t ON t.id = p.tailor_id
              JOIN users ut ON ut.id = t.user_id
              WHERE p.id = ?
              LIMIT 1
            `, [projectId]) as any[];
            const r = Array.isArray(rows) && rows[0] ? rows[0] : null;
            if (r) {
              const clientName = [r.client_first, r.client_last].filter(Boolean).join(" ") || r.client_email;
              const tailorName = [r.tailor_first, r.tailor_last].filter(Boolean).join(" ") || "votre artisan";
              const amount = r.amount_total ? Math.round(r.amount_total) / 100 : 0;
              // Email confirmation to client
              sendPaymentConfirmationEmail(r.client_email, clientName, tailorName, r.title || "Commande", amount)
                .catch(err => console.error("[Stripe] Payment confirmation email failed:", err));
              // Email notification to artisan
              if (r.tailor_email) {
                const isPro = (r.subscription_plan || "").toLowerCase() === "pro";
                const grossAmount = r.amount_total ? Math.round(r.amount_total) / 100 : 0;
                const artisanAmount = r.amount_artisan
                  ? Math.round(r.amount_artisan) / 100
                  : isPro
                    ? Math.round(grossAmount * (1 - FRAIS) * 100) / 100
                    : Math.round(grossAmount * (1 - FRAIS) * (1 - COMM) * 100) / 100;
                sendArtisanPaymentReceivedEmail(r.tailor_email, tailorName, clientName, r.title || "Commande", artisanAmount)
                  .catch(err => console.error("[Stripe] Artisan payment email failed:", err));
                // Push to artisan: paiement reçu
                if (r.tailor_user_id) sendPushNotification(r.tailor_user_id, "Paiement reçu !", `${clientName} a payé pour "${r.title || "Commande"}"`, "/atelier").catch(() => {});
              }
              // Push to client: paiement confirmé
              if (r.client_id) sendPushNotification(r.client_id, "Paiement confirmé", `Votre paiement pour "${r.title || "Commande"}" a bien été reçu.`, "/mes-projets").catch(() => {});
            }
          } catch (emailErr) {
            console.error("[Stripe] Failed to fetch project for payment email:", emailErr);
          }
        }
      }

      if (event.type === "payment_intent.payment_failed") {
        const pi = event.data.object as Stripe.PaymentIntent;
        const projectId = pi.metadata?.projectId;
        if (projectId) {
          await storage.updateProject(projectId, { paymentStatus: "failed" } as any);
          console.log(`[Stripe] Projet ${projectId} → paymentStatus = failed`);
        }
      }

      if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
        const sub = event.data.object as Stripe.Subscription;
        const tailorId = sub.metadata?.tailorId;
        if (tailorId && sub.status === "active") {
          await storage.updateTailor(tailorId, {
            subscriptionPlan: "Pro",
            stripeSubscriptionId: sub.id,
            stripeCustomerId: sub.customer as string,
            subscriptionCurrentPeriodEnd: (sub as any).current_period_end,
          } as any);
          console.log(`[Stripe] Artisan ${tailorId} → Plan Pro activé (sub ${sub.id})`);
        }
      }

      if (event.type === "customer.subscription.deleted") {
        const sub = event.data.object as Stripe.Subscription;
        const tailorId = sub.metadata?.tailorId;
        if (tailorId) {
          await storage.updateTailor(tailorId, {
            subscriptionPlan: "Starter",
            stripeSubscriptionId: null,
            subscriptionCurrentPeriodEnd: null,
          } as any);
          console.log(`[Stripe] Artisan ${tailorId} → Plan Starter (abonnement expiré/annulé)`);
        }
      }

      // Fix #4 — Chargeback Stripe → alerte email admin
      if (event.type === "charge.dispute.created") {
        const dispute = event.data.object as Stripe.Dispute;
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : (dispute.charge as any)?.id;
        const amount = dispute.amount / 100;
        const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || "contact@seamlier.fr";

        let projectInfo = "";
        try {
          if (chargeId) {
            const charge = await stripe.charges.retrieve(chargeId);
            const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : (charge.payment_intent as any)?.id;
            if (piId) {
              const [projRows] = await pool.query(
                "SELECT id, title FROM projects WHERE stripe_payment_intent_id = ? LIMIT 1",
                [piId]
              ) as any[];
              const proj = Array.isArray(projRows) && projRows[0] ? projRows[0] : null;
              if (proj) projectInfo = ` le projet #${proj.id} — "${proj.title}"`;
            }
          }
        } catch { /* non bloquant */ }

        sendAdminChargebackAlertEmail(
          adminEmail, chargeId || "inconnu", amount,
          (dispute as any).evidence?.customer_email_address || "inconnu",
          dispute.reason || "non précisé",
          projectInfo
        ).catch(() => {});
        console.log(`[Stripe] Chargeback reçu — charge ${chargeId} — ${amount}€ — raison: ${dispute.reason}`);
      }

      // Fix #6 — Paiement abonnement échoué → email dunning artisan
      if (event.type === "invoice.payment_failed") {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = typeof invoice.customer === "string" ? invoice.customer : (invoice.customer as any)?.id;
        if (customerId) {
          try {
            const [rows] = await pool.query(`
              SELECT t.id AS tailor_id, u.email, u.first_name, u.last_name
              FROM tailors t
              JOIN users u ON u.id = t.user_id
              WHERE t.stripe_customer_id = ?
              LIMIT 1
            `, [customerId]) as any[];
            const r = Array.isArray(rows) && rows[0] ? rows[0] : null;
            if (r?.email) {
              const name = [r.first_name, r.last_name].filter(Boolean).join(" ") || r.email;
              const amount = invoice.amount_due ? invoice.amount_due / 100 : null;
              const nextRetryTs = (invoice as any).next_payment_attempt;
              const nextRetry = nextRetryTs
                ? new Date(nextRetryTs * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                : null;
              sendSubscriptionPaymentFailedEmail(r.email, name, amount, nextRetry).catch(() => {});
              console.log(`[Stripe] Paiement abonnement échoué — artisan ${r.tailor_id} (${r.email})`);
            }
          } catch (err) {
            console.error("[Stripe] invoice.payment_failed handler error:", err);
          }
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe webhook error]", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  });

  // ── Config publique (clé publiable pour le client) ───────────────────────
  app.get("/api/stripe/config", (_req, res: Response) => {
    res.json({ publishableKey: STRIPE_PUBLISHABLE_KEY });
  });

  // ── Onboarding artisan ────────────────────────────────────────────────────
  app.post("/api/stripe/onboarding/start", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Non authentifié" });
      const account = await stripe.accounts.create({
        type: "express", country: "FR", email: user.email,
        capabilities: { transfers: { requested: true } },
      });
      const link = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.APP_URL}/artisan/onboarding/refresh`,
        return_url: `${process.env.APP_URL}/artisan/onboarding/success`,
        type: "account_onboarding",
      });
      res.json({ url: link.url, stripeAccountId: account.id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  app.get("/api/stripe/onboarding/status", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const user = req.user as any;
      if (!user?.stripeAccountId) return res.json({ onboarded: false });
      const account = await stripe.accounts.retrieve(user.stripeAccountId);
      res.json({ onboarded: account.details_submitted && account.charges_enabled });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Création du PaymentIntent (commandes projets) ─────────────────────────
  app.post("/api/stripe/payment/create", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré — STRIPE_SECRET_KEY manquante" });
    const _user = req.user as any;
    if (!_user) return res.status(401).json({ error: "Non authentifié" });
    try {
      const { projectId, prixConfection, planArtisan } = req.body ?? {};
      console.log("[Stripe] /payment/create reçu:", { projectId, prixConfection, planArtisan });
      if (!projectId) return res.status(400).json({ error: "Champ manquant : projectId" });
      if (!prixConfection) return res.status(400).json({ error: "Champ manquant : prixConfection" });
      if (!planArtisan) return res.status(400).json({ error: "Champ manquant : planArtisan" });
      const plan = planArtisan.toLowerCase();
      if (!["starter", "premium", "pro"].includes(plan)) {
        return res.status(400).json({ error: `Plan inconnu : "${planArtisan}" (attendu : starter, pro ou premium)` });
      }

      const montants = calc(prixConfection, plan);
      const pi = await stripe.paymentIntents.create({
        amount: montants.centimes.totalClient,
        currency: "eur",
        metadata: {
          projectId: String(projectId),
          planArtisan,
          montantArtisan: String(montants.centimes.montantArtisan),
        },
        description: `SEAMLiER - Commande #${projectId}`,
      });

      console.log(`[Stripe] Projet ${projectId} → PI ${pi.id} créé (${montants.centimes.totalClient / 100} €)`);

      try {
        await storage.updateProject(projectId, {
          stripePaymentIntentId: pi.id,
          paymentStatus: "awaiting_payment",
          amountTotal: montants.centimes.totalClient,
          amountArtisan: montants.centimes.montantArtisan,
        } as any);
      } catch (dbErr: any) {
        console.error(`[Stripe] updateProject DB error (non bloquant):`, dbErr?.message ?? dbErr);
      }

      res.json({ clientSecret: pi.client_secret, montants: montants.euros });
    } catch (err: any) {
      const msg = err?.message ?? String(err) ?? "Erreur interne Stripe";
      console.error("[Stripe] /payment/create error:", msg);
      res.status(500).json({ error: msg });
    }
  });

  // ── Confirmation client (travail reçu) ────────────────────────────────────
  app.post("/api/stripe/transfer/client-confirm/:projectId", async (req: any, res: Response) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: "Non authentifié" });
    try {
      const { projectId } = req.params;
      await storage.updateProject(projectId, { clientConfirmed: true } as any);
      console.log(`[Stripe] Projet ${projectId} → clientConfirmed = true (user ${user.id})`);
      res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Libération admin → virement artisan ──────────────────────────────────
  app.post("/api/stripe/transfer/admin-release/:projectId", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    const admin = req.user as any;
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Accès refusé" });
    try {
      const { projectId } = req.params;

      // Fix #1 + #2 + #3 : récupérer toutes les données depuis la BDD
      const [rows] = await pool.query(`
        SELECT p.stripe_transfer_id, p.client_confirmed, p.amount_artisan,
               u.stripe_account_id
        FROM projects p
        JOIN tailors t ON t.id = p.tailor_id
        JOIN users u ON u.id = t.user_id
        WHERE p.id = ?
        LIMIT 1
      `, [projectId]) as any[];
      const project = Array.isArray(rows) && rows[0] ? rows[0] : null;
      if (!project) return res.status(404).json({ error: "Projet introuvable" });

      // Fix #1 — guard contre le double transfert
      if (project.stripe_transfer_id) {
        return res.status(409).json({
          error: "Un virement a déjà été effectué pour ce projet",
          transferId: project.stripe_transfer_id,
        });
      }

      // Fix #2 — confirmation client obligatoire
      if (!project.client_confirmed) {
        return res.status(403).json({ error: "Le client n'a pas encore confirmé la réception de la prestation" });
      }

      // Fix #3 — stripeAccountId depuis la BDD, pas depuis req.body
      const stripeAccountIdArtisan = project.stripe_account_id;
      if (!stripeAccountIdArtisan) {
        return res.status(400).json({ error: "L'artisan n'a pas finalisé son onboarding Stripe Connect" });
      }

      const montantArtisanCentimes = req.body.montantArtisanCentimes ?? project.amount_artisan;
      if (!montantArtisanCentimes || montantArtisanCentimes <= 0) {
        return res.status(400).json({ error: "Montant artisan invalide ou manquant" });
      }

      const transfer = await stripe.transfers.create({
        amount: montantArtisanCentimes,
        currency: "eur",
        destination: stripeAccountIdArtisan,
        description: `SEAMLiER - Virement #${projectId}`,
      });

      await storage.updateProject(projectId, {
        stripeTransferId: transfer.id,
        paymentStatus: "transferred",
      } as any);
      console.log(`[Stripe] Projet ${projectId} → transfer ${transfer.id} vers ${stripeAccountIdArtisan}`);

      res.json({ success: true, transferId: transfer.id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });

  // ── Création abonnement Premium (Stripe Billing + Elements) ───────────────
  app.post("/api/stripe/subscription/create", async (req: any, res: Response) => {
    const SK_PREFIX = STRIPE_SECRET_KEY.slice(0, 14);
    console.log(`[Stripe/sub] ▶ Début — clé: ${SK_PREFIX}...`);
    console.log(`[Stripe/sub] PRICES month=${PRICES.month} year=${PRICES.year}`);

    if (!stripe) {
      console.error("[Stripe/sub] ✗ Stripe non initialisé (STRIPE_SECRET_KEY manquante)");
      return res.status(500).json({ error: "Stripe non configuré" });
    }

    try {
      const user = req.user as any;
      if (!user) {
        console.error("[Stripe/sub] ✗ Utilisateur non authentifié");
        return res.status(401).json({ error: "Non authentifié" });
      }
      console.log(`[Stripe/sub] User: ${user.id} (${user.email})`);

      const { interval } = req.body as { interval: "month" | "year" };
      if (!interval || !["month", "year"].includes(interval)) {
        return res.status(400).json({ error: "interval doit être 'month' ou 'year'" });
      }
      console.log(`[Stripe/sub] Interval: ${interval} → price: ${PRICES[interval]}`);

      // 1. Récupérer (ou créer) le profil artisan
      let tailor = await storage.getTailorByUserId(user.id) as any;
      if (!tailor) {
        console.log(`[Stripe/sub] Profil artisan absent — création auto pour userId=${user.id}`);
        tailor = await storage.createTailor({
          userId: user.id, bio: null, specialties: [], experience: 0,
          coverImageUrl: null, isVerified: false, rating: 0,
          reviewCount: 0, portfolioCount: 0, subscriptionPlan: "Starter",
        }) as any;
        console.log(`[Stripe/sub] Profil artisan créé: ${tailor.id}`);
      }
      console.log(`[Stripe/sub] Artisan: ${tailor.id}, plan: ${tailor.subscriptionPlan}, stripeCustomerId: ${tailor.stripeCustomerId || "absent"}`);

      if (tailor.subscriptionPlan === "Pro") {
        console.log(`[Stripe/sub] Déjà Pro → alreadyPro`);
        return res.json({ alreadyPro: true });
      }

      // 2. Créer ou récupérer le Customer Stripe
      let customerId: string = tailor.stripeCustomerId;
      if (!customerId) {
        console.log(`[Stripe/sub] Création Customer Stripe pour ${user.email}`);
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          metadata: { tailorId: tailor.id, userId: user.id },
        });
        customerId = customer.id;
        await storage.updateTailor(tailor.id, { stripeCustomerId: customerId } as any);
        console.log(`[Stripe/sub] Customer créé: ${customerId}`);
      } else {
        console.log(`[Stripe/sub] Customer existant: ${customerId}`);
      }

      // 3. Annuler tout abonnement "incomplete" existant pour repartir propre
      try {
        const existingSubs = await stripe.subscriptions.list({ customer: customerId, status: "incomplete", limit: 5 });
        for (const s of existingSubs.data) {
          console.log(`[Stripe/sub] Annulation abonnement incomplet existant: ${s.id}`);
          await stripe.subscriptions.cancel(s.id);
        }
      } catch (cleanErr: any) {
        console.warn(`[Stripe/sub] Nettoyage incomplets ignoré: ${cleanErr.message}`);
      }

      // 4. Créer l'abonnement SANS expand (plus fiable avec SDK v20)
      console.log(`[Stripe/sub] Création subscription price=${PRICES[interval]} customer=${customerId}`);
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: PRICES[interval] }],
        payment_behavior: "default_incomplete",
        payment_settings: {
          save_default_payment_method: "on_subscription",
          payment_method_types: ["card"],
        },
        metadata: { tailorId: tailor.id, userId: user.id },
      });

      console.log(`[Stripe/sub] Subscription: id=${subscription.id} status=${subscription.status}`);
      console.log(`[Stripe/sub] latest_invoice raw: ${JSON.stringify(subscription.latest_invoice)}`);

      if (!subscription.latest_invoice) {
        console.error(`[Stripe/sub] ✗ latest_invoice est null/undefined`);
        return res.status(500).json({ error: "Aucune facture générée par Stripe" });
      }

      // 5. Récupérer la facture séparément (pas d'expand)
      const invoiceId = typeof subscription.latest_invoice === "string"
        ? subscription.latest_invoice
        : (subscription.latest_invoice as any).id;
      console.log(`[Stripe/sub] Récupération invoice: ${invoiceId}`);
      const invoice = await stripe.invoices.retrieve(invoiceId);
      console.log(`[Stripe/sub] Invoice: id=${invoice.id} status=${invoice.status} payment_intent=${JSON.stringify(( invoice as any).payment_intent)}`);

      // 6. Récupérer le PaymentIntent séparément
      let clientSecret: string | null = null;

      if ((invoice as any).payment_intent) {
        const piId = typeof (invoice as any).payment_intent === "string"
          ? ( invoice as any).payment_intent
          : (( invoice as any).payment_intent as any).id;
        console.log(`[Stripe/sub] Récupération PaymentIntent: ${piId}`);
        const pi = await stripe.paymentIntents.retrieve(piId);
        console.log(`[Stripe/sub] PI: id=${pi.id} status=${pi.status} client_secret_present=${!!pi.client_secret}`);
        clientSecret = pi.client_secret;
      } else {
        // Fallback : pending_setup_intent (abonnement à 0€ ou période d'essai)
        const siId = typeof (subscription as any).pending_setup_intent === "string"
          ? (subscription as any).pending_setup_intent
          : (subscription as any).pending_setup_intent?.id;
        if (siId) {
          console.log(`[Stripe/sub] Fallback SetupIntent: ${siId}`);
          const si = await stripe.setupIntents.retrieve(siId);
          clientSecret = si.client_secret;
        }
        if (!clientSecret) {
          console.error(`[Stripe/sub] ✗ Ni payment_intent ni setup_intent disponibles`);
          console.error(`[Stripe/sub] Subscription JSON: ${JSON.stringify({ id: subscription.id, status: subscription.status, pending_setup_intent: (subscription as any).pending_setup_intent })}`);
          return res.status(500).json({
            error: "Impossible d'obtenir le clientSecret",
            detail: `( invoice as any).payment_intent=${( invoice as any).payment_intent}, sub.status=${subscription.status}`,
          });
        }
      }

      // 7. Sauvegarder et retourner
      await storage.updateTailor(tailor.id, { stripeSubscriptionId: subscription.id } as any);
      console.log(`[Stripe/sub] ✓ Succès — sub=${subscription.id} clientSecret présent`);

      res.json({
        clientSecret,
        subscriptionId: subscription.id,
        interval,
        amount: interval === "month" ? 29 : 290,
      });
    } catch (err: any) {
      console.error(`[Stripe/sub] ✗ Exception: ${err?.type || ""} ${err?.code || ""} — ${err.message}`);
      if (err?.raw) console.error(`[Stripe/sub] Raw Stripe error:`, JSON.stringify(err.raw));
      res.status(500).json({ error: err.message });
    }
  });

  // ── Annulation abonnement (fin de période) ────────────────────────────────
  app.post("/api/stripe/subscription/cancel", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Non authentifié" });

      const tailor = await storage.getTailorByUserId(user.id) as any;
      if (!tailor) return res.status(404).json({ error: "Profil artisan introuvable" });
      if (!tailor.stripeSubscriptionId) {
        return res.status(400).json({ error: "Aucun abonnement actif trouvé" });
      }

      const sub = await stripe.subscriptions.update(tailor.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      const periodEnd = (sub as any).current_period_end;
      const periodEndDate = new Date(periodEnd * 1000).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });

      console.log(`[Stripe] Abonnement ${tailor.stripeSubscriptionId} → annulation fin période (${periodEndDate})`);
      res.json({ success: true, periodEnd, periodEndDate });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Vérification session après retour Stripe ──────────────────────────────
  app.get("/api/stripe/subscription/verify", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const { session_id } = req.query as { session_id: string };
      if (!session_id) return res.status(400).json({ error: "session_id manquant" });

      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.status === "complete" && session.metadata?.tailorId) {
        await storage.updateTailor(session.metadata.tailorId, { subscriptionPlan: "Pro" } as any);
        console.log(`[Stripe] Artisan ${session.metadata.tailorId} → Plan Pro activé via verify`);
        res.json({ success: true, subscriptionPlan: "Pro" });
      } else {
        res.status(400).json({ error: "Session invalide ou incomplète" });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Admin: remboursement d'un projet ─────────────────────────────────────
  app.post("/api/admin/refund/:projectId", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    const user = req.user as any;
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Accès refusé" });
    try {
      const { projectId } = req.params;
      const [rows] = await pool.query(
        `SELECT stripe_payment_intent_id, amount, payment_status FROM projects WHERE id = ? LIMIT 1`,
        [projectId]
      ) as any[];
      const project = Array.isArray(rows) ? rows[0] : rows;
      if (!project) return res.status(404).json({ error: "Projet introuvable" });
      if (!project.stripe_payment_intent_id) return res.status(400).json({ error: "Aucun paiement Stripe associé" });

      const refund = await stripe.refunds.create({
        payment_intent: project.stripe_payment_intent_id,
      });

      await pool.query(
        `UPDATE projects SET payment_status = 'refunded' WHERE id = ?`,
        [projectId]
      );

      console.log(`[Admin] Remboursement ${refund.id} pour projet ${projectId}`);
      res.json({ success: true, refundId: refund.id, status: refund.status });
    } catch (err: any) {
      console.error("[Admin refund error]", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── Admin: annulation abonnement Pro d'un artisan ─────────────────────────
  app.post("/api/admin/subscription/cancel/:tailorId", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    const user = req.user as any;
    if (!user || user.role !== "admin") return res.status(403).json({ error: "Accès refusé" });
    try {
      const { tailorId } = req.params;
      const realId = tailorId.startsWith("reg-") ? tailorId.slice(4) : tailorId;
      const tailor = await storage.getTailor(realId) as any;
      if (!tailor) return res.status(404).json({ error: "Artisan introuvable" });

      if (tailor.stripeSubscriptionId) {
        await stripe.subscriptions.cancel(tailor.stripeSubscriptionId);
        console.log(`[Admin] Abonnement ${tailor.stripeSubscriptionId} annulé immédiatement (admin)`);
      }

      await pool.query(
        `UPDATE tailors SET subscription_plan = 'Starter', stripe_subscription_id = NULL, subscription_current_period_end = NULL WHERE id = ?`,
        [realId]
      );

      res.json({ success: true });
    } catch (err: any) {
      console.error("[Admin subscription cancel error]", err);
      res.status(500).json({ error: err.message });
    }
  });

  console.log("[Stripe] Routes enregistrées ✅");
}
