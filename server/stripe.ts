import type { Express, Response } from "express";
import Stripe from "stripe";
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const FRAIS = 0.10;
const COMM = 0.15;
function calc(prix: number, plan: string) {
  const frais = Math.round(prix * FRAIS * 100) / 100;
  const total = prix + frais;
  const comm = plan === "starter" ? Math.round(prix * COMM * 100) / 100 : 0;
  return { euros: { prixConfection: prix, fraisClient: frais, totalClient: total, commissionArtisan: comm, montantArtisan: prix - comm }, centimes: { totalClient: Math.round(total * 100), montantArtisan: Math.round((prix - comm) * 100) } };
}
export function registerStripeRoutes(app: Express) {
  app.post("/api/stripe/webhook", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const event = stripe.webhooks.constructEvent(req.rawBody as Buffer, req.headers["stripe-signature"] as string, process.env.STRIPE_WEBHOOK_SECRET!);
      console.log("[Stripe webhook]", event.type);
      res.json({ received: true });
    } catch (err: any) { res.status(400).send(`Webhook Error: ${err.message}`); }
  });
  app.post("/api/stripe/onboarding/start", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const user = req.user as any;
      if (!user) return res.status(401).json({ error: "Non authentifié" });
      const account = await stripe.accounts.create({ type: "express", country: "FR", email: user.email, capabilities: { transfers: { requested: true } } });
      const link = await stripe.accountLinks.create({ account: account.id, refresh_url: `${process.env.APP_URL}/artisan/onboarding/refresh`, return_url: `${process.env.APP_URL}/artisan/onboarding/success`, type: "account_onboarding" });
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
  app.post("/api/stripe/payment/create", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    try {
      const { projectId, prixConfection, planArtisan } = req.body;
      if (!projectId || !prixConfection || !planArtisan) return res.status(400).json({ error: "Données manquantes" });
      const montants = calc(prixConfection, planArtisan);
      const pi = await stripe.paymentIntents.create({ amount: montants.centimes.totalClient, currency: "eur", metadata: { projectId: String(projectId), planArtisan, montantArtisan: String(montants.centimes.montantArtisan) }, description: `SEAMLiER - Commande #${projectId}` });
      res.json({ clientSecret: pi.client_secret, montants: montants.euros });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  app.post("/api/stripe/transfer/client-confirm/:projectId", async (req: any, res: Response) => {
    const user = req.user as any;
    if (!user) return res.status(401).json({ error: "Non authentifié" });
    console.log(`[Stripe] Client ${user.id} confirme projet #${req.params.projectId}`);
    res.json({ success: true });
  });
  app.post("/api/stripe/transfer/admin-release/:projectId", async (req: any, res: Response) => {
    if (!stripe) return res.status(500).json({ error: "Stripe non configuré" });
    const admin = req.user as any;
    if (!admin || admin.role !== "admin") return res.status(403).json({ error: "Accès refusé" });
    try {
      const { montantArtisanCentimes, stripeAccountIdArtisan } = req.body;
      const transfer = await stripe.transfers.create({ amount: montantArtisanCentimes, currency: "eur", destination: stripeAccountIdArtisan, description: `SEAMLiER - Virement #${req.params.projectId}` });
      res.json({ success: true, transferId: transfer.id });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
  });
  console.log("[Stripe] Routes enregistrées ✅");
}
