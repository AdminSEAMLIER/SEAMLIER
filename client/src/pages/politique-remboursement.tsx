import { Link } from "wouter";
import { ArrowLeft, Shield, Clock, MessageCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function PolitiqueRemboursement() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <Logo className="text-[#722F37]" textClassName="text-lg text-[#722F37]" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 lg:py-16">
        <div className="mb-10">
          <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-3">
            Politique de remboursement
          </h1>
          <p className="text-gray-500 text-base">
            Dernière mise à jour : janvier 2026
          </p>
        </div>

        <div className="space-y-8">

          {/* Section 1 */}
          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <h2 className="text-lg font-semibold text-gray-900">Délai de réclamation — 48h</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Toute réclamation concernant une commande doit être signalée à SEAMLIER dans un délai de <strong>48 heures</strong> après la confirmation de réception par le client. Au-delà de ce délai, le paiement est définitivement libéré à l'artisan et aucune contestation ne pourra être traitée.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="h-5 w-5 text-[#722F37]" />
              <h2 className="text-xl font-semibold text-gray-900">Conditions de remboursement</h2>
            </div>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>Un remboursement total ou partiel peut être accordé dans les cas suivants :</p>
              <ul className="space-y-3 ml-4">
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#722F37] mt-2 shrink-0" />
                  <span><strong>Non-conformité majeure :</strong> l'article livré ne correspond pas aux spécifications convenues (tissu, coupe, taille avec écart &gt; 3 cm).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#722F37] mt-2 shrink-0" />
                  <span><strong>Défaut de fabrication :</strong> coutures non réalisées, finitions manquantes, tissu endommagé constaté à la livraison.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#722F37] mt-2 shrink-0" />
                  <span><strong>Non-livraison :</strong> la commande n'est pas livrée dans un délai supérieur de 30% au délai convenu, sans accord préalable du client.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#722F37] mt-2 shrink-0" />
                  <span><strong>Annulation artisan :</strong> l'artisan annule la commande après paiement.</span>
                </li>
              </ul>
              <p className="mt-4">
                Les demandes de remboursement pour des raisons de goût, de préférence personnelle ou de changement d'avis ne sont <strong>pas éligibles</strong>, la couture sur mesure étant un service personnalisé.
              </p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Processus de remboursement</h2>
            <div className="space-y-4">
              {[
                { n: "1", title: "Contactez le support SEAMLIER", desc: "Via le chat intégré ou à contact@seamlier.fr dans les 48h suivant la réception." },
                { n: "2", title: "Fournissez les preuves", desc: "Photos de l'article, description du problème, et numéro de commande." },
                { n: "3", title: "Médiation", desc: "SEAMLIER analyse la demande et contacte l'artisan dans un délai de 3 jours ouvrés." },
                { n: "4", title: "Décision et remboursement", desc: "En cas d'accord, le remboursement est effectué sur le moyen de paiement original sous 5 à 10 jours ouvrés." },
              ].map(step => (
                <div key={step.n} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#722F37] text-white flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                    {step.n}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{step.title}</p>
                    <p className="text-gray-600 text-sm mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 4 */}
          <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="h-5 w-5 text-gray-500 shrink-0" />
              <h2 className="text-lg font-semibold text-gray-900">Remboursement partiel</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Dans certains cas (défaut mineur, retard partiel), SEAMLIER peut proposer un remboursement partiel négocié entre le client et l'artisan. SEAMLIER intervient uniquement comme médiateur et se réserve le droit de décision finale en cas de désaccord.
            </p>
          </section>

          {/* Contact */}
          <section>
            <div className="flex items-center gap-3 mb-3">
              <MessageCircle className="h-5 w-5 text-[#722F37]" />
              <h2 className="text-lg font-semibold text-gray-900">Contact support</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              Pour toute demande de remboursement ou réclamation :{" "}
              <a href="mailto:contact@seamlier.fr" className="text-[#722F37] hover:underline font-medium">
                contact@seamlier.fr
              </a>
              <br />
              Réponse garantie sous 2 jours ouvrés.
            </p>
          </section>

        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/cgv" className="hover:text-[#722F37]">CGV</Link>
          <Link href="/cgu" className="hover:text-[#722F37]">CGU</Link>
          <Link href="/mentions-legales" className="hover:text-[#722F37]">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-[#722F37]">Confidentialité</Link>
        </div>
        <p className="text-center text-gray-400 text-xs mt-4">© 2026 SEAMLIER. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
