import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Settings, Globe, Shield, Eye, Save, Crown, CheckCircle, AlertCircle, Loader2, CreditCard, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe("pk_live_51SvLQMLyrGmm31qYHFC4uhspgIlIkEgouIhv0KH11z20sHamBHBBRmFC89AZX1bvyf93qS8MF5V2uBepZHbO7Ea800ag7PLjQY").catch(() => null);

// ── Formulaire paiement abonnement ─────────────────────────────────────────
function SubscribeForm({ interval, onSuccess }: { interval: "month" | "year"; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "paying">("idle");

  const amount = interval === "month" ? "29€/mois" : "290€/an";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/subscription/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ interval }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      if (data.alreadyPro) { onSuccess(); return; }
      if (!data.clientSecret) throw new Error("clientSecret manquant");

      const card = elements.getElement(CardElement);
      if (!card) throw new Error("Carte non chargée");

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: { card },
      });

      if (result.error) throw new Error(result.error.message);
      toast({ title: "Abonnement activé !", description: `Vous êtes maintenant sur le plan Pro (${amount}).` });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Erreur de paiement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <p className="text-sm font-semibold text-gray-700 mb-3">Informations de carte</p>
        <CardElement
          options={{
            style: {
              base: { fontSize: "15px", color: "#1a1a1a", "::placeholder": { color: "#9ca3af" } },
              invalid: { color: "#dc2626" },
            },
          }}
          className="p-2"
        />
      </div>
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white" data-testid="button-subscribe-submit">
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <CreditCard size={16} className="mr-2" />}
        {loading ? "Traitement..." : `Souscrire — ${amount}`}
      </Button>
    </form>
  );
}

// ── Page principale ────────────────────────────────────────────────────────
export default function ProParametres() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    profileVisible: true,
    acceptNewClients: true,
    showPricing: true,
    language: "fr",
  });

  const [interval, setInterval] = useState<"month" | "year">("month");
  const [showPayForm, setShowPayForm] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelInfo, setCancelInfo] = useState<{ periodEnd: number; periodEndDate: string } | null>(null);

  const { data: planData, refetch: refetchPlan } = useQuery<{
    tailorId: string;
    subscriptionPlan: string;
    subscriptionCurrentPeriodEnd?: number;
    stripeSubscriptionId?: string;
  }>({ queryKey: ["/api/professionnel/plan"] });

  const isPro = planData?.subscriptionPlan === "Pro";
  const periodEnd = planData?.subscriptionCurrentPeriodEnd;
  const periodEndDate = periodEnd
    ? new Date(periodEnd * 1000).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === "boolean") setSettings({ ...settings, [key]: !settings[key] });
  };

  const handleSave = () => {
    toast({ title: "Paramètres enregistrés", description: "Vos paramètres ont été mis à jour" });
  };

  const handleSubscribeSuccess = () => {
    setShowPayForm(false);
    refetchPlan();
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch("/api/stripe/subscription/cancel", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCancelInfo({ periodEnd: data.periodEnd, periodEndDate: data.periodEndDate });
      setShowCancelDialog(false);
      toast({
        title: "Résiliation confirmée",
        description: `Votre plan Pro reste actif jusqu'au ${data.periodEndDate}.`,
      });
      refetchPlan();
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link href="/pro-profil">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-gray-600" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />Retour au profil
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Settings className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">Paramètres</h1>
          </div>
          <p className="text-gray-600 mt-2">Gérez les paramètres de votre compte professionnel</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* ── Plan & Abonnement ── */}
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Crown className="h-5 w-5" />Plan & Abonnement
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-4">

            {/* Plan actuel */}
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="font-semibold text-gray-800">Plan actuel</p>
                {isPro && periodEndDate && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Calendar size={11} />Renouvellement le {periodEndDate}
                  </p>
                )}
                {cancelInfo && (
                  <p className="text-xs text-amber-600 mt-0.5">
                    Résiliation programmée — actif jusqu'au {cancelInfo.periodEndDate}
                  </p>
                )}
              </div>
              <Badge className={isPro ? "bg-purple-100 text-purple-700 border-none px-3 py-1 font-bold" : "bg-blue-50 text-blue-700 border-none px-3 py-1 font-bold"}>
                {isPro ? "Pro ✨" : "Starter"}
              </Badge>
            </div>

            {/* Artisan Starter → choix de plan */}
            {!isPro && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => { setInterval("month"); setShowPayForm(true); }}
                    className="p-4 rounded-xl border-2 border-[#722F37] bg-[#722F37]/5 text-left hover:bg-[#722F37]/10 transition-colors"
                    data-testid="button-plan-monthly"
                  >
                    <p className="font-bold text-[#722F37] text-lg">29€</p>
                    <p className="text-xs text-gray-500">par mois</p>
                    <p className="text-xs font-semibold text-gray-700 mt-2">0% de commission</p>
                    <p className="text-xs text-gray-500">Mesures illimitées</p>
                  </button>
                  <button
                    onClick={() => { setInterval("year"); setShowPayForm(true); }}
                    className="p-4 rounded-xl border-2 border-gray-200 text-left hover:border-[#722F37] hover:bg-[#722F37]/5 transition-colors relative"
                    data-testid="button-plan-yearly"
                  >
                    <Badge className="absolute top-2 right-2 bg-green-100 text-green-700 border-none text-[9px] px-1.5">−17%</Badge>
                    <p className="font-bold text-gray-800 text-lg">290€</p>
                    <p className="text-xs text-gray-500">par an</p>
                    <p className="text-xs font-semibold text-gray-700 mt-2">0% de commission</p>
                    <p className="text-xs text-gray-500">Mesures illimitées</p>
                  </button>
                </div>

                {showPayForm && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-sm font-semibold text-gray-700">
                        Paiement — {interval === "month" ? "29€/mois" : "290€/an"}
                      </p>
                      <button onClick={() => setShowPayForm(false)} className="text-xs text-gray-400 underline ml-auto">Annuler</button>
                    </div>
                    <Elements stripe={stripePromise}>
                      <SubscribeForm interval={interval} onSuccess={handleSubscribeSuccess} />
                    </Elements>
                  </div>
                )}

                {!showPayForm && (
                  <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 space-y-1">
                    <p className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" />0% de commission sur vos prestations</p>
                    <p className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" />Fiches mesures illimitées</p>
                    <p className="flex items-center gap-1.5"><CheckCircle size={12} className="text-green-500" />Résiliable à tout moment</p>
                  </div>
                )}
              </>
            )}

            {/* Artisan Pro → résiliation */}
            {isPro && (
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-lg p-3 text-xs text-purple-700 space-y-1">
                  <p className="flex items-center gap-1.5"><CheckCircle size={12} />0% de commission sur toutes vos prestations</p>
                  <p className="flex items-center gap-1.5"><CheckCircle size={12} />Fiches mesures illimitées</p>
                  <p className="flex items-center gap-1.5"><CheckCircle size={12} />Badge Pro visible sur votre profil</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 text-xs"
                  onClick={() => setShowCancelDialog(true)}
                  data-testid="button-cancel-subscription"
                >
                  Résilier mon abonnement Premium
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Visibilité ── */}
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Eye className="h-5 w-5" />Visibilité
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Profil visible</Label>
                <p className="text-sm text-gray-500">Votre profil apparaît dans les recherches</p>
              </div>
              <Switch checked={settings.profileVisible} onCheckedChange={() => handleToggle("profileVisible")} data-testid="switch-profile-visible" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Accepter de nouveaux clients</Label>
                <p className="text-sm text-gray-500">Les clients peuvent vous envoyer des demandes</p>
              </div>
              <Switch checked={settings.acceptNewClients} onCheckedChange={() => handleToggle("acceptNewClients")} data-testid="switch-accept-clients" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Afficher les tarifs</Label>
                <p className="text-sm text-gray-500">Afficher vos tarifs indicatifs sur votre profil</p>
              </div>
              <Switch checked={settings.showPricing} onCheckedChange={() => handleToggle("showPricing")} data-testid="switch-show-pricing" />
            </div>
          </CardContent>
        </Card>

        {/* ── Langue ── */}
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Globe className="h-5 w-5" />Langue
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Langue de l'interface</Label>
                <p className="text-sm text-gray-500">Choisissez votre langue préférée</p>
              </div>
              <Select value={settings.language} onValueChange={(v) => setSettings({ ...settings, language: v })}>
                <SelectTrigger className="w-32" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ── Sécurité ── */}
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Shield className="h-5 w-5" />Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-3">
            <Link href="/pro-profil/mot-de-passe">
              <Button variant="outline" className="w-full justify-start bg-white border border-gray-200 text-gray-600" data-testid="button-change-password">
                Modifier le mot de passe
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Button className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white" onClick={handleSave} data-testid="button-save-settings">
          <Save className="h-4 w-4 mr-2" />Enregistrer les paramètres
        </Button>
      </div>

      {/* ── Dialog confirmation résiliation ── */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="dialog-cancel-subscription">
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">Résilier l'abonnement Premium</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 space-y-2">
              <span className="block">Votre abonnement restera <strong>actif jusqu'à la fin de la période en cours</strong>, puis vous repasserez automatiquement en plan Starter.</span>
              {periodEndDate && (
                <span className="block font-semibold text-amber-700">
                  Date de fin : {periodEndDate}
                </span>
              )}
              <span className="block text-sm text-gray-500">Aucun remboursement ne sera effectué pour la période déjà payée.</span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setShowCancelDialog(false)} data-testid="button-cancel-dialog-close">
              Garder mon abonnement
            </Button>
            <Button variant="destructive" className="flex-1" onClick={handleCancel} disabled={cancelling} data-testid="button-confirm-cancel">
              {cancelling ? <Loader2 size={16} className="animate-spin mr-1" /> : null}
              Confirmer la résiliation
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
