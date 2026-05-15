import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Calendar, Users, CheckCircle, Scissors, LogIn, UserPlus, Lock, CreditCard, Euro } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const _pubKey = "pk_live_51SvLQMLyrGmm31qYpXRsufTxYiPBDvV6QEqsYqoUKgpssxXZ0IpU3zi02m0O9TYJPrae4r4uMtgN4g7N4OAwoSdb00muMHphx5";
const stripePromise = _pubKey ? loadStripe(_pubKey).catch(() => null) : Promise.resolve(null);

// ── Payment form (must be inside <Elements>) ──────────────────────────────
function EventPaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
}: {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setLoading(true);
    const card = elements.getElement(CardElement);
    if (!card) { setLoading(false); return; }
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });
    setLoading(false);
    if (error) {
      onError(error.message || "Paiement échoué");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <label className="text-sm font-medium text-gray-700 mb-2 block">Carte bancaire</label>
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#1a1a1a", "::placeholder": { color: "#9ca3af" } },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </div>
      <Button
        className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white h-12 text-base font-semibold"
        onClick={handlePay}
        disabled={loading}
        data-testid="button-pay-and-join"
      >
        {loading ? (
          <><Loader2 className="h-5 w-5 animate-spin mr-2" />Paiement en cours…</>
        ) : (
          <><CreditCard className="h-5 w-5 mr-2" />Payer {amount.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} et rejoindre</>
        )}
      </Button>
    </div>
  );
}

export default function EvenementRejoindre() {
  const params = useParams<{ inviteCode: string }>();
  const inviteCode = params?.inviteCode;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [joined, setJoined] = useState(false);
  const [validationCode, setValidationCode] = useState("");
  const [codeError, setCodeError] = useState("");
  // Payment state
  const [paymentStep, setPaymentStep] = useState<{ clientSecret: string; eventId: string; amount: number } | null>(null);
  const [payError, setPayError] = useState("");

  const { data: event, isLoading, isError } = useQuery<any>({
    queryKey: ["/api/events/join", inviteCode],
    queryFn: async () => {
      const res = await fetch(`/api/events/join/${inviteCode}`, { credentials: "include" });
      if (!res.ok) throw new Error("Événement introuvable");
      return res.json();
    },
    enabled: !!inviteCode,
    retry: false,
  });

  const joinMutation = useMutation({
    mutationFn: async (code: string) => {
      const res = await apiRequest("POST", `/api/events/join/${inviteCode}`, { validationCode: code });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: (data) => {
      if (data.alreadyJoined) {
        toast({ title: "Déjà inscrit", description: "Vous avez déjà rejoint cet événement." });
        setJoined(true);
      } else if (data.needsPayment) {
        setPaymentStep({ clientSecret: data.clientSecret, eventId: data.eventId, amount: data.amount });
      } else {
        setJoined(true);
        queryClient.invalidateQueries({ queryKey: ["/api/client/events"] });
        queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      }
    },
    onError: (err: any) => {
      if (err?.invalidCode) {
        setCodeError("Code incorrect. Vérifiez le code communiqué par l'organisateur.");
      } else if (err?.error) {
        toast({ title: "Erreur", description: err.error, variant: "destructive" });
      } else {
        toast({ title: "Erreur", description: "Impossible de rejoindre l'événement.", variant: "destructive" });
      }
    },
  });

  const confirmPaymentMutation = useMutation({
    mutationFn: async (paymentIntentId: string) => {
      const res = await apiRequest("POST", `/api/events/join/${inviteCode}/confirm-payment`, { paymentIntentId });
      const data = await res.json();
      if (!res.ok) throw data;
      return data;
    },
    onSuccess: () => {
      setJoined(true);
      setPaymentStep(null);
      queryClient.invalidateQueries({ queryKey: ["/api/client/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
    },
    onError: (err: any) => {
      setPayError(err?.error || "Erreur lors de la confirmation du paiement.");
    },
  });

  const handleJoin = () => {
    setCodeError("");
    if (!validationCode.trim()) {
      setCodeError("Veuillez entrer le code de validation.");
      return;
    }
    joinMutation.mutate(validationCode.trim());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#601B28]" />
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🔍</span>
        </div>
        <h2 className="font-serif text-2xl text-gray-700 mb-2">Événement introuvable</h2>
        <p className="text-gray-400 mb-6">Ce lien d'invitation est invalide ou a expiré.</p>
        <Link href="/">
          <Button className="bg-[#601B28] text-white">Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="font-serif text-2xl text-gray-900 mb-2">Vous avez rejoint l'événement !</h2>
        <p className="text-gray-500 mb-6">
          Un projet a été créé pour vous chez {event.tailor_first_name} {event.tailor_last_name}.
          L'artisan va vous contacter pour établir votre devis personnalisé.
        </p>
        <Button
          className="bg-[#601B28] hover:bg-[#4E1522] text-white"
          onClick={() => setLocation("/mes-projets")}
        >
          Voir mes projets
        </Button>
      </div>
    );
  }

  const eventDate = new Date(event.event_date).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#601B28] to-[#9b4a53] px-4 py-12 text-center text-white">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🎉</span>
        </div>
        <h1 className="font-serif text-2xl mb-1">{event.name}</h1>
        <p className="text-white/80 text-sm capitalize">{eventDate}</p>
      </div>

      <div className="max-w-xl mx-auto px-4 py-6 space-y-4">
        {/* Event details */}
        <Card className="border border-gray-100">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#601B28]/10 flex items-center justify-center">
                <Scissors className="h-5 w-5 text-[#601B28]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Artisan</p>
                <p className="font-semibold text-gray-900">
                  {event.tailor_first_name} {event.tailor_last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#601B28]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#601B28]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Participants</p>
                <p className="font-semibold text-gray-900">
                  {event.participant_count} personne{event.participant_count > 1 ? "s" : ""} inscrite{event.participant_count > 1 ? "s" : ""}
                  {event.max_participants ? ` / ${event.max_participants} max` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#601B28]/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-[#601B28]" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Organisé par</p>
                <p className="font-semibold text-gray-900">
                  {event.organizer_first_name} {event.organizer_last_name}
                </p>
              </div>
            </div>
            {event.price_per_person && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#601B28]/10 flex items-center justify-center">
                  <Euro className="h-5 w-5 text-[#601B28]" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Participation</p>
                  <p className="font-semibold text-gray-900">
                    {Number(event.price_per_person).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} / personne
                  </p>
                </div>
              </div>
            )}
            {event.description && (
              <div className="bg-gray-50 rounded-lg p-3 mt-2">
                <p className="text-sm text-gray-600 leading-relaxed">{event.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info block */}
        <div className="bg-[#601B28]/5 border border-[#601B28]/20 rounded-xl p-4">
          <p className="text-sm text-[#601B28] font-medium mb-1">Comment ça fonctionne ?</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>En rejoignant, un projet personnalisé est créé pour vous</li>
            <li>L'artisan vous contactera pour établir votre devis individuel</li>
            <li>Vous suivez votre commande indépendamment des autres</li>
          </ul>
        </div>

        {user ? (
          paymentStep ? (
            /* Payment step */
            <div className="space-y-3">
              <div className="bg-[#601B28]/5 border border-[#601B28]/20 rounded-xl p-4 flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-[#601B28] shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-[#601B28]">Paiement requis</p>
                  <p className="text-xs text-gray-600">
                    L'inscription à cet événement nécessite un paiement de {Number(paymentStep.amount).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}.
                  </p>
                </div>
              </div>
              {payError && <p className="text-red-500 text-sm text-center">{payError}</p>}
              {stripePromise ? (
                <Elements stripe={stripePromise} options={{ clientSecret: paymentStep.clientSecret, locale: "fr" }}>
                  <EventPaymentForm
                    clientSecret={paymentStep.clientSecret}
                    amount={paymentStep.amount}
                    onSuccess={(piId) => confirmPaymentMutation.mutate(piId)}
                    onError={(msg) => setPayError(msg)}
                  />
                </Elements>
              ) : (
                <p className="text-sm text-red-500">Stripe non configuré.</p>
              )}
              <Button
                variant="ghost"
                className="w-full text-gray-500 text-sm"
                onClick={() => setPaymentStep(null)}
              >
                Annuler
              </Button>
            </div>
          ) : (
            /* Code input step */
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#601B28]" />
                  Code de validation
                </label>
                <p className="text-xs text-gray-500">
                  Demandez le code à l'organisateur de l'événement pour pouvoir rejoindre.
                </p>
                <Input
                  type="text"
                  inputMode="numeric"
                  placeholder="Entrez le code à 4 chiffres"
                  value={validationCode}
                  onChange={(e) => { setValidationCode(e.target.value); setCodeError(""); }}
                  maxLength={6}
                  className={`text-center text-xl tracking-widest font-bold h-14 ${codeError ? "border-red-400" : ""}`}
                  data-testid="input-validation-code"
                />
                {codeError && <p className="text-red-500 text-xs">{codeError}</p>}
              </div>
              <Button
                className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white h-12 text-base font-semibold"
                onClick={handleJoin}
                disabled={joinMutation.isPending}
                data-testid="button-join-event"
              >
                {joinMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                Rejoindre l'événement
              </Button>
            </div>
          )
        ) : (
          /* Not authenticated */
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-amber-800 mb-1">Compte requis pour rejoindre</p>
              <p className="text-xs text-amber-700">
                Connectez-vous ou créez un compte, puis entrez le code de validation.
              </p>
            </div>
            <Button
              className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white h-12 text-base font-semibold"
              onClick={() => setLocation(`/connexion?redirect=/evenement/rejoindre/${inviteCode}`)}
              data-testid="button-login-to-join"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Se connecter
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-base font-semibold border-[#601B28] text-[#601B28] hover:bg-[#601B28]/5"
              onClick={() => setLocation(`/inscription?redirect=/evenement/rejoindre/${inviteCode}`)}
              data-testid="button-register-to-join"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Créer un compte
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
