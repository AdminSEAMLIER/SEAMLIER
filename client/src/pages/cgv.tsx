import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function CGV() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </Button>
          </Link>
          <Logo className="text-[#722F37]" textClassName="text-lg text-[#722F37]" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-8">
          Conditions Générales de Vente (CGV)
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">1. Objet et Présentation</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions Générales de Vente (CGV) régissent l'utilisation de la plateforme Seamlier, marketplace premium dédiée à la couture locale, et définissent les conditions de mise en relation et de réalisation des projets entre les Clients et les Couturiers Professionnels.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">2. Rôle de Seamlier : Le Tiers de Confiance</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Contrairement à un simple annuaire, Seamlier s'engage activement dans la réussite de chaque projet :
            </p>
            <ul className="text-gray-600 space-y-3">
              <li>
                <strong>Sélection rigoureuse :</strong> Seamlier sélectionne les couturiers admis sur la plateforme selon des critères de professionnalisme et de savoir-faire.
              </li>
              <li>
                <strong>Accompagnement et Suivi :</strong> La plateforme met à disposition des outils métiers (gestion des mesures, suivi de projet) pour sécuriser chaque étape de la commande.
              </li>
              <li>
                <strong>Garantie de Satisfaction :</strong> En cas de difficulté sur la qualité ou les délais, Seamlier intervient en tant que médiateur pour s'assurer que le résultat final soit conforme aux attentes du Client et aux standards d'excellence de la marque.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">3. Processus de Commande et Mesures</h2>
            <ul className="text-gray-600 space-y-3">
              <li>
                <strong>Précision :</strong> L'outil métier de Seamlier permet au Client de transmettre ses mesures.
              </li>
              <li>
                <strong>Validation :</strong> Le projet est considéré comme lancé une fois que le Couturier a validé les faisabilités techniques via la messagerie Seamlier.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">4. Tarifs et Paiement</h2>
            <ul className="text-gray-600 space-y-3">
              <li>
                <strong>Transparence :</strong> Les tarifs sont fixés par les Couturiers. Seamlier s'assure de la clarté des devis avant tout commencement de travaux.
              </li>
              <li>
                <strong>Sécurisation :</strong> Les paiements effectués via la plateforme sont sécurisés et garantissent la réservation de la prestation.
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">5. Droit de Rétractation et Spécificités du Sur-Mesure</h2>
            <p className="text-gray-600 leading-relaxed">
              Conformément à la loi (Art. L221-28), le droit de rétractation ne s'applique pas aux produits nettement personnalisés ou confectionnés selon les spécifications du Client (confection sur-mesure et retouches spécifiques). Toutefois, Seamlier s'engage à trouver une solution amiable si le résultat n'est pas conforme au projet initial.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">6. Responsabilités</h2>
            <p className="text-gray-600 leading-relaxed">
              Seamlier est responsable de la fiabilité de sa plateforme et de la mise en relation. Bien que la réalisation technique de la couture soit effectuée par le professionnel, Seamlier reste l'interlocuteur garant du respect de la charte de qualité "Seamlier".
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">7. Litiges</h2>
            <p className="text-gray-600 leading-relaxed">
              Tout problème doit être signalé à <strong>contact@seamlier.fr</strong>. Seamlier s'engage à traiter chaque réclamation sous 48h pour garantir une expérience premium sans accroc.
            </p>
          </section>

          <section>
            <p className="text-gray-600 leading-relaxed">
              Dernière mise à jour : Janvier 2026
            </p>
            <p className="text-gray-500 text-sm mt-4">
              © SEAMLIER – L'excellence de la couture locale, l'esprit tranquille.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 SEAMLIER. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
