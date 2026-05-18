import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Settings, Globe, Shield, Eye, Save, Crown, CheckCircle, AlertCircle, Loader2, CreditCard, Calendar, Clock, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
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

const stripePromise: Promise<import("@stripe/stripe-js").Stripe | null> = fetch("/api/stripe/config", { credentials: "include" })
  .then(r => r.json())
  .then(d => d.publishableKey ? loadStripe(d.publishableKey) : Promise.resolve(null))
  .catch(() => Promise.resolve(null));

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
      <Button type="submit" disabled={!stripe || loading} className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white" data-testid="button-subscribe-submit">
        {loading ? <Loader2 size={16} className="animate-spin mr-2" /> : <CreditCard size={16} className="mr-2" />}
        {loading ? "Traitement..." : `Souscrire — ${amount}`}
      </Button>
    </form>
  );
}

// ── Availability Section ────────────────────────────────────────────────────

const DAYS_ORDERED = [
  { label: "Lundi",    dow: 1 },
  { label: "Mardi",   dow: 2 },
  { label: "Mercredi", dow: 3 },
  { label: "Jeudi",   dow: 4 },
  { label: "Vendredi", dow: 5 },
  { label: "Samedi",  dow: 6 },
  { label: "Dimanche", dow: 0 },
];

function buildTimeSlots() {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++)
    for (const m of [0, 30])
      slots.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
  return slots;
}
const TIME_SLOTS = buildTimeSlots();

function AvailabilitySection({ tailorId }: { tailorId: string }) {
  const { toast } = useToast();

  // ── Regular schedule ──
  const [schedule, setSchedule] = useState(
    DAYS_ORDERED.map(d => ({ dayOfWeek: d.dow, startTime: "09:00", endTime: "18:00", isClosed: d.dow === 0 }))
  );

  const { data: existingSchedule } = useQuery({
    queryKey: ["/api/tailor", tailorId, "schedule"],
    queryFn: async () => { const r = await fetch(`/api/schedule?tailorId=${tailorId}`); return r.json(); },
    enabled: !!tailorId,
  });

  useEffect(() => {
    if (existingSchedule && existingSchedule.length > 0) {
      setSchedule(prev => prev.map(d => {
        const found = existingSchedule.find((e: any) => e.day_of_week === d.dayOfWeek);
        return found ? { dayOfWeek: d.dayOfWeek, startTime: found.start_time, endTime: found.end_time, isClosed: !!found.is_closed } : d;
      }));
    }
  }, [existingSchedule]);

  const saveSched = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ schedule }) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => toast({ title: "Horaires enregistrés" }),
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const updateDay = (dow: number, field: string, value: any) =>
    setSchedule(prev => prev.map(d => d.dayOfWeek === dow ? { ...d, [field]: value } : d));

  // ── Exceptions ──
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");

  const { data: exceptions = [] } = useQuery<any[]>({
    queryKey: ["/api/tailor", tailorId, "exceptions"],
    queryFn: async () => { const r = await fetch(`/api/tailors/exceptions?tailorId=${tailorId}`); return r.json(); },
    enabled: !!tailorId,
  });

  const addException = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/tailors/exceptions", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ date: newDate, reason: newReason }) });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { setNewDate(""); setNewReason(""); queryClient.invalidateQueries({ queryKey: ["/api/tailor", tailorId, "exceptions"] }); toast({ title: "Fermeture ajoutée" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const delException = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/tailors/exceptions?id=${id}`, { method: "DELETE", credentials: "include" });
      if (!r.ok) throw new Error();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/tailor", tailorId, "exceptions"] }); toast({ title: "Fermeture supprimée" }); },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  return (
    <Card className="border border-gray-100 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
          <Clock className="h-5 w-5" />Mes disponibilités
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 bg-white">

        {/* Horaires habituels */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Horaires habituels</p>
          <div className="space-y-1">
            {DAYS_ORDERED.map(({ label, dow }) => {
              const day = schedule.find(d => d.dayOfWeek === dow)!;
              return (
                <div key={dow} className="flex flex-wrap items-center gap-2 py-2 border-b border-gray-50 last:border-0" data-testid={`row-schedule-${dow}`}>
                  <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{label}</span>
                  <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                    <input type="checkbox" checked={day.isClosed}
                      onChange={e => updateDay(dow, "isClosed", e.target.checked)}
                      className="accent-[#601B28] w-4 h-4"
                      data-testid={`checkbox-closed-${dow}`} />
                    <span className="text-xs text-gray-500">Fermé</span>
                  </label>
                  {!day.isClosed && (
                    <div className="flex items-center gap-2">
                      <select value={day.startTime} onChange={e => updateDay(dow, "startTime", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-sm bg-white" data-testid={`select-start-${dow}`}>
                        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <span className="text-gray-400 text-sm">—</span>
                      <select value={day.endTime} onChange={e => updateDay(dow, "endTime", e.target.value)}
                        className="border border-gray-200 rounded px-2 py-1 text-sm bg-white" data-testid={`select-end-${dow}`}>
                        {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  {day.isClosed && <span className="text-xs text-gray-400 italic">Indisponible ce jour</span>}
                </div>
              );
            })}
          </div>
          <Button onClick={() => saveSched.mutate()} disabled={saveSched.isPending}
            className="mt-3 bg-[#601B28] hover:bg-[#4E1522] text-white text-sm"
            data-testid="button-save-schedule">
            {saveSched.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</> : <><Save className="h-4 w-4 mr-2" />Sauvegarder les horaires</>}
          </Button>
        </div>

        {/* Fermetures exceptionnelles */}
        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Fermetures exceptionnelles</p>
          <p className="text-xs text-gray-400 mb-3">Vacances, jours fériés... Ces dates seront grisées dans le calendrier de réservation.</p>

          {/* Liste des exceptions */}
          {(exceptions as any[]).length > 0 ? (
            <div className="space-y-2 mb-4">
              {(exceptions as any[]).map((ex: any) => (
                <div key={ex.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg" data-testid={`row-exception-${ex.id}`}>
                  <div>
                    <span className="text-sm font-medium text-gray-800">
                      {new Date(ex.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </span>
                    {ex.reason && <span className="text-xs text-gray-500 ml-2">— {ex.reason}</span>}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50"
                    onClick={() => delException.mutate(ex.id)} data-testid={`button-delete-exception-${ex.id}`}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic mb-4">Aucune fermeture exceptionnelle enregistrée.</p>
          )}

          {/* Ajouter une exception */}
          <div className="flex flex-wrap items-end gap-2 bg-gray-50 rounded-xl p-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Date fermée</label>
              <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="h-9 text-sm w-40" data-testid="input-exception-date"
                min={new Date().toISOString().split("T")[0]} />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500">Raison (optionnel)</label>
              <Input value={newReason} onChange={e => setNewReason(e.target.value)}
                placeholder="Congés, férié..." className="h-9 text-sm" data-testid="input-exception-reason" />
            </div>
            <Button onClick={() => newDate && addException.mutate()} disabled={!newDate || addException.isPending}
              className="bg-[#601B28] hover:bg-[#4E1522] text-white h-9"
              data-testid="button-add-exception">
              {addException.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Ajouter</>}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
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
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <Settings className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">Paramètres</h1>
          </div>
          <p className="text-gray-600 mt-2">Gérez les paramètres de votre compte professionnel</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* ── Plan & Abonnement ── */}
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
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
                    className={`p-4 rounded-xl border-2 text-left transition-colors ${interval === "month" ? "border-[#601B28] bg-[#601B28] text-white" : "border-gray-200 hover:border-[#601B28] hover:bg-[#601B28]/5"}`}
                    data-testid="button-plan-monthly"
                  >
                    <p className={`font-bold text-lg ${interval === "month" ? "text-white" : "text-[#601B28]"}`}>29€</p>
                    <p className={`text-xs mt-0.5 ${interval === "month" ? "text-white/80" : "text-gray-500"}`}>par mois</p>
                    <p className={`text-xs font-semibold mt-2 ${interval === "month" ? "text-white" : "text-gray-700"}`}>0% de commission</p>
                    <p className={`text-xs ${interval === "month" ? "text-white/80" : "text-gray-500"}`}>Mesures illimitées</p>
                  </button>
                  <button
                    onClick={() => { setInterval("year"); setShowPayForm(true); }}
                    className={`p-4 rounded-xl border-2 text-left transition-colors relative ${interval === "year" ? "border-[#601B28] bg-[#601B28] text-white" : "border-gray-200 hover:border-[#601B28] hover:bg-[#601B28]/5"}`}
                    data-testid="button-plan-yearly"
                  >
                    <Badge className={`absolute top-2 right-2 border-none text-[9px] px-1.5 ${interval === "year" ? "bg-white/20 text-white" : "bg-green-100 text-green-700"}`}>−17%</Badge>
                    <p className={`font-bold text-lg ${interval === "year" ? "text-white" : "text-gray-800"}`}>290€</p>
                    <p className={`text-xs mt-0.5 ${interval === "year" ? "text-white/80" : "text-gray-500"}`}>par an</p>
                    <p className={`text-xs font-semibold mt-2 ${interval === "year" ? "text-white" : "text-gray-700"}`}>0% de commission</p>
                    <p className={`text-xs ${interval === "year" ? "text-white/80" : "text-gray-500"}`}>Mesures illimitées</p>
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
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
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
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
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
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
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


        {/* ── Mes disponibilités ── */}
        {planData?.tailorId && <AvailabilitySection tailorId={planData!.tailorId} />}
        <Button className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white" onClick={handleSave} data-testid="button-save-settings">
          <Save className="h-4 w-4 mr-2" />Enregistrer les paramètres
        </Button>
      </div>

      {/* ── Dialog confirmation résiliation ── */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="dialog-cancel-subscription">
          <DialogHeader>
            <DialogTitle className="text-[#601B28]">Résilier l'abonnement Premium</DialogTitle>
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
