import type { Express, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const FRAIS = 0.10;
const COMM = 0.15;

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

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const tailorId = session.metadata?.tailorId;
        if (tailorId) {
          await storage.updateTailor(tailorId, { subscriptionPlan: "Pro" } as any);
          console.log(`[Stripe] Artisan ${tailorId} → Plan Pro activé via webhook`);
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error("[Stripe webhook error]", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
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

  // ── Création du PaymentIntent ─────────────────────────────────────────────
  app.post("/api/stripe/payment/create", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré — STRIPE_SECRET_KEY manquante" });
    try {
      const { projectId, prixConfection, planArtisan } = req.body ?? {};
      console.log("[Stripe] /payment/create reçu:", { projectId, prixConfection, planArtisan, body: req.body });
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

      // Persiste le PI et les montants (non bloquant : si la DB échoue on continue)
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
      const { montantArtisanCentimes, stripeAccountIdArtisan } = req.body;

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

  // ── Création session Checkout abonnement Pro ──────────────────────────────
  const PRO_PRICE_ID = "price_1TBzcSLyrGmm31qYwOfOb6Bz";

  app.post("/api/stripe/subscription/create", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Non authentifié" });
      const tailor = await storage.getTailorByUserId(user.id);
      if (!tailor) return res.status(404).json({ error: "Profil artisan introuvable" });
      if (tailor.subscriptionPlan === "Pro") return res.json({ alreadyPro: true });

      const appUrl = process.env.APP_URL || "https://seamlier.fr";
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: PRO_PRICE_ID, quantity: 1 }],
        success_url: `${appUrl}/dashboard-pro?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/dashboard-pro`,
        customer_email: user.email,
        metadata: { tailorId: tailor.id, userId: user.id },
      });

      console.log(`[Stripe] Checkout session créée : ${session.id} pour artisan ${tailor.id}`);
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("[Stripe] Erreur création session:", err.message);
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

  console.log("[Stripe] Routes enregistrées ✅");
}
