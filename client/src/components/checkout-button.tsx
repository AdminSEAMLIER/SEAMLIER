import { loadStripe } from "@stripe/stripe-js";
import { useState, useEffect } from "react";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    // Récupère la clé depuis les variables d'environnement Vite
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (key) {
      setStripePromise(loadStripe(key));
    }
  }, []);

  const handleCheckout = async () => {
    if (!stripePromise) {
      alert("Configuration en cours, veuillez patienter...");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });

      const session = await response.json();
      const stripe = await stripePromise;

      if (stripe && session.id) {
        await stripe.redirectToCheckout({ sessionId: session.id });
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors du lancement du paiement.");
    } finally {
      setLoading(false);
    }
  };

  // Ne rien afficher si la clé n'est pas encore détectée (évite le plantage)
  if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) return null;

  return (
    <button 
      onClick={handleCheckout}
      disabled={loading}
      className="h-12 px-8 bg-[#722F37] text-white rounded-md font-bold hover:bg-[#5a252c] transition-all w-full shadow-lg"
    >
      {loading ? "Chargement..." : "Soutenir SEAMLIER - 20€"}
    </button>
  );
}