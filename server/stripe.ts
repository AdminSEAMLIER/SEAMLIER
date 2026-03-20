import type { Express, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const FRAIS = 0.10;
const COMM = 0.15;

const PRICES = {
  month: "price_1TBzcSLyrGmm31qYwOfOb6Bz",
  year:  "price_1TC3PaLyrGmm31qYgtlR1Lwd",
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

  // ── Création du PaymentIntent (commandes projets) ─────────────────────────
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

  // ── Création abonnement Premium (Stripe Billing + Elements) ───────────────
  app.post("/api/stripe/subscription/create", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Non authentifié" });

      const { interval } = req.body as { interval: "month" | "year" };
      if (!interval || !["month", "year"].includes(interval)) {
        return res.status(400).json({ error: "interval doit être 'month' ou 'year'" });
      }

      let tailor = await storage.getTailorByUserId(user.id) as any;
      if (!tailor) {
        // Création automatique du profil artisan si manquant (ex: inscriptions anciennes)
        tailor = await storage.createTailor({
          userId: user.id,
          bio: null,
          specialties: [],
          experience: 0,
          coverImageUrl: null,
          isVerified: false,
          rating: 0,
          reviewCount: 0,
          portfolioCount: 0,
          subscriptionPlan: "Starter",
        }) as any;
        console.log(`[Stripe] Profil artisan auto-créé pour userId=${user.id}`);
      }
      if (tailor.subscriptionPlan === "Pro") return res.json({ alreadyPro: true });

      // Créer ou récupérer le Customer Stripe
      let customerId: string = tailor.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          metadata: { tailorId: tailor.id, userId: user.id },
        });
        customerId = customer.id;
        await storage.updateTailor(tailor.id, { stripeCustomerId: customerId } as any);
      }

      // Créer l'abonnement avec paiement incomplet → clientSecret
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: PRICES[interval] }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: { tailorId: tailor.id, userId: user.id },
      });

      console.log(`[Stripe] Subscription created: ${subscription.id}, status: ${subscription.status}`);
      console.log(`[Stripe] latest_invoice type: ${typeof subscription.latest_invoice}`);

      // Récupérer l'invoice (expansée ou non)
      let invoice: Stripe.Invoice;
      if (typeof subscription.latest_invoice === "string") {
        invoice = await stripe.invoices.retrieve(subscription.latest_invoice, {
          expand: ["payment_intent"],
        });
      } else {
        invoice = subscription.latest_invoice as Stripe.Invoice;
      }

      console.log(`[Stripe] Invoice: ${invoice.id}, payment_intent type: ${typeof invoice.payment_intent}`);

      // Récupérer le payment_intent (expansé ou non)
      let clientSecret: string | null = null;
      if (invoice.payment_intent) {
        if (typeof invoice.payment_intent === "string") {
          const pi = await stripe.paymentIntents.retrieve(invoice.payment_intent);
          clientSecret = pi.client_secret;
        } else {
          clientSecret = (invoice.payment_intent as Stripe.PaymentIntent).client_secret;
        }
      }

      console.log(`[Stripe] clientSecret présent: ${!!clientSecret}`);

      if (!clientSecret) {
        return res.status(500).json({ error: "Impossible d'obtenir le clientSecret — vérifiez la configuration Stripe" });
      }

      await storage.updateTailor(tailor.id, { stripeSubscriptionId: subscription.id } as any);

      console.log(`[Stripe] Abonnement ${interval} créé : ${subscription.id} pour artisan ${tailor.id}`);
      res.json({
        clientSecret,
        subscriptionId: subscription.id,
        interval,
        amount: interval === "month" ? 29 : 290,
      });
    } catch (err: any) {
      console.error("[Stripe] Erreur création abonnement:", err.message);
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

  console.log("[Stripe] Routes enregistrées ✅");
}
