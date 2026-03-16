import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreditCard, CheckCircle, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-config";
import { useTranslation } from "react-i18next";

const _pubKey = "pk_test_51SvLQMLyrGmm31qYQ5lETIK5onU6ZL6Y3NqqmOKcHejTSKZYBuuCjMmnJIrQPCqAKRQC7dmzU0VtZOQUNtJcJHEg00PQl0I0U7";
const stripePromise = loadStripe(_pubKey).catch(() => null);

// ── Formulaire interne (doit être dans <Elements>) ─────────────────────────
interface FormProps {
  clientSecret: string;
  montants: { prixConfection: number; fraisClient: number; totalClient: number; commissionArtisan: number; montantArtisan: number };
  onSuccess: () => void;
  onClose: () => void;
}

function CheckoutForm({ clientSecret, montants, onSuccess, onClose }: FormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setPaying(true);
    setError(null);

    const card = elements.getElement(CardElement);
    if (!card) { setPaying(false); return; }

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card },
    });

    if (stripeError) {
      setError(stripeError.message ?? isFr ? "Erreur de paiement" : "Payment error");
      setPaying(false);
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Récapitulatif des montants */}
      <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 text-sm space-y-1">
        <div className="flex justify-between text-gray-600">
          <span>{isFr ? "Prix de confection" : "Tailoring price"}</span>
          <span>{montants.prixConfection.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>{isFr ? "Frais de service (10%)" : "Service fee (10%)"}</span>
          <span>{montants.fraisClient.toFixed(2)} €</span>
        </div>
        <div className="flex justify-between font-bold text-gray-900 border-t border-orange-200 pt-2 mt-2">
          <span>{isFr ? "Total à payer" : "Total due"}</span>
          <span>{montants.totalClient.toFixed(2)} €</span>
        </div>
      </div>

      {/* Champ carte Stripe */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isFr ? "Informations de carte" : "Card details"}
        </label>
        <div className="border border-gray-200 rounded-md p-3 bg-white focus-within:ring-2 focus-within:ring-[#722F37] focus-within:border-transparent transition-all">
          <CardElement
            options={{
              style: {
                base: { fontSize: "15px", color: "#1a1a1a", "::placeholder": { color: "#9ca3af" } },
                invalid: { color: "#dc2626" },
              },
              hidePostalCode: true,
            }}
          />
        </div>
      </div>

      {error && (
        <p className="text-red-600 text-sm" data-testid="text-payment-error">{error}</p>
      )}

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onClose}
          disabled={paying}
          data-testid="button-cancel-payment"
        >
          {isFr ? "Annuler" : "Cancel"}
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
          disabled={paying || !stripe}
          data-testid="button-confirm-payment"
        >
          {paying ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isFr ? "Paiement en cours…" : "Processing…"}</>
          ) : (
            <><CreditCard className="h-4 w-4 mr-2" />{isFr ? `Payer ${montants.totalClient.toFixed(2)} €` : `Pay ${montants.totalClient.toFixed(2)} €`}</>
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Composant exporté ─────────────────────────────────────────────────────
interface PaymentButtonProps {
  projectId: string;
  prixConfection: number;
  planArtisan: string;
  label?: string;
}

export default function PaymentButton({ projectId, prixConfection, planArtisan, label }: PaymentButtonProps) {
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [montants, setMontants] = useState<FormProps["montants"] | null>(null);
  const [paid, setPaid] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  if (!stripePromise) return null;

  const openDialog = async () => {
    // Ouvre la dialog immédiatement avec le spinner
    setOpen(true);
    setLoading(true);
    setFetchError(null);
    setClientSecret(null);
    setMontants(null);
    try {
      const res = await fetch("/api/stripe/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, prixConfection, planArtisan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      console.log("[PaymentButton] Réponse API:", data);
      if (!data?.clientSecret) {
        throw new Error(
          `Réponse inattendue du serveur : ${JSON.stringify(data)}\n` +
          `[Envoyé] projectId="${projectId}" | prixConfection=${prixConfection} | planArtisan="${planArtisan}"`
        );
      }
      setClientSecret(data.clientSecret);
      setMontants(data.montants);
    } catch (err: any) {
      const msg = err?.message ?? String(err) ?? "Erreur inconnue";
      const detail = `[Envoyé] projectId="${projectId}" | prixConfection=${prixConfection} | planArtisan="${planArtisan}"`;
      console.error("[PaymentButton] Erreur /api/stripe/payment/create", {
        projectId, prixConfection, planArtisan,
        erreurMessage: msg,
        erreurObjet: err,
      });
      setFetchError(`${msg}\n${detail}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setPaid(true);
  };

  const handleClose = () => {
    setOpen(false);
    setClientSecret(null);
    setMontants(null);
    setFetchError(null);
  };

  return (
    <>
      <Button
        size="sm"
        className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
        onClick={openDialog}
        disabled={loading || paid}
        data-testid={`button-pay-${projectId}`}
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-1 animate-spin" />{isFr ? "Chargement…" : "Loading…"}</>
        ) : paid ? (
          <><CheckCircle className="h-4 w-4 mr-1" />{isFr ? "Payé" : "Paid"}</>
        ) : (
          <><CreditCard className="h-4 w-4 mr-1" />{label ?? (isFr ? "Payer" : "Pay")}</>
        )}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
        <DialogContent className="max-w-md" data-testid="dialog-payment">
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">
              {paid
                ? (isFr ? "Paiement réussi ✓" : "Payment successful ✓")
                : (isFr ? "Paiement sécurisé" : "Secure payment")}
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-[#722F37]" />
              <p className="text-sm text-gray-500">{isFr ? "Initialisation du paiement…" : "Initializing payment…"}</p>
            </div>
          ) : paid ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto" />
              <p className="text-gray-700 font-medium">
                {isFr ? "Votre paiement a bien été encaissé." : "Your payment was successfully processed."}
              </p>
              <p className="text-sm text-gray-500">
                {isFr
                  ? "Les fonds seront conservés en séquestre jusqu'à votre confirmation de réception."
                  : "Funds will be held in escrow until you confirm receipt."}
              </p>
              <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white w-full mt-2" onClick={handleClose} data-testid="button-close-payment-success">
                {isFr ? "Fermer" : "Close"}
              </Button>
            </div>
          ) : fetchError ? (
            <div className="py-4 space-y-3">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-red-700 mb-1">
                  {isFr ? "Erreur lors de l'initialisation du paiement" : "Payment initialization error"}
                </p>
                <p className="text-sm text-red-600 font-mono break-all" data-testid="text-fetch-error">
                  {fetchError}
                </p>
              </div>
              <Button variant="outline" className="w-full" onClick={handleClose} data-testid="button-close-error">
                {isFr ? "Fermer" : "Close"}
              </Button>
            </div>
          ) : clientSecret && montants ? (
            <Elements stripe={stripePromise} options={{ clientSecret, locale: isFr ? "fr" : "en" }}>
              <CheckoutForm
                clientSecret={clientSecret}
                montants={montants}
                onSuccess={handleSuccess}
                onClose={handleClose}
              />
            </Elements>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
