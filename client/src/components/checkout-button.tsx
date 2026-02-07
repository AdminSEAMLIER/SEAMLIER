import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

// On utilise la clé publique configurée dans ton .env
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // 1. Demande au serveur de créer la session de paiement
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const session = await response.json();

      if (!response.ok) {
        throw new Error(session.error || "Erreur serveur");
      }

      // 2. Redirection vers la page de paiement Stripe
      const stripe = await stripePromise;
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({
          sessionId: session.id,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      console.error("Détails de l'erreur:", err);
      alert("Erreur de paiement : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleCheckout}
      disabled={loading}
      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full"
    >
      {loading ? "Chargement..." : "Acheter maintenant - 20€"}
    </button>
  );
}