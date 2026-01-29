import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function Confidentialite() {
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
          Politique de Confidentialité
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed mb-8">
            La présente politique de confidentialité décrit comment SEAMLIER collecte, utilise et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">1. Responsable du traitement</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le responsable du traitement des données personnelles est l'enseigne SEAMLIER.
            </p>
            <p className="text-gray-600 leading-relaxed">
              <strong>Contact :</strong> contact@seamlier.fr
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">2. Données collectées</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nous collectons uniquement les données strictement nécessaires à la fourniture de nos services premium de couture locale :
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">Identification</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Prénom, nom, adresse email, numéro de téléphone.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Données spécifiques (Particuliers)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Mensurations corporelles, historique des projets, messages échangés avec les couturiers.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Données spécifiques (Professionnels)</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Spécialités, portfolio, expérience professionnelle.
            </p>

            <h3 className="text-lg font-medium text-gray-800 mb-2">Données de connexion</h3>
            <p className="text-gray-600 leading-relaxed">
              Adresse IP, type de navigateur, date et heure de connexion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">3. Finalités du traitement</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vos données personnelles sont traitées pour les finalités suivantes :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Création et gestion de votre compte utilisateur.</li>
              <li>Mise en relation directe entre particuliers et professionnels de la couture.</li>
              <li>Gestion de l'outil métier (suivi des mesures et des projets).</li>
              <li>Sécurisation des échanges et de la plateforme.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">4. Base légale du traitement</h2>
            <p className="text-gray-600 leading-relaxed">
              Le traitement de vos données repose sur l'exécution du contrat (pour la fourniture de nos services de marketplace) et sur votre consentement explicite recueilli lors de la création de votre compte.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">5. Destinataires des données</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vos données personnelles ne sont jamais vendues à des tiers. Elles sont uniquement partagées avec :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Le couturier ou le client concerné dans le cadre d'une mise en relation.</li>
              <li>Notre prestataire technique pour l'hébergement du site (o2switch).</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">6. Durée de conservation</h2>
            <p className="text-gray-600 leading-relaxed">
              Vos données sont conservées pendant toute la durée de votre inscription sur la plateforme. Vous pouvez demander leur suppression totale à tout moment.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">7. Vos Droits</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, de portabilité et d'effacement de vos données. Pour exercer ces droits, contactez-nous à l'adresse unique : <strong>contact@seamlier.fr</strong>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">8. Sécurité</h2>
            <p className="text-gray-600 leading-relaxed">
              Nous mettons en œuvre des mesures techniques appropriées (chiffrement SSL) pour protéger vos données contre tout accès non autorisé, notamment pour la protection de vos données de mesures corporelles.
            </p>
          </section>

          <section>
            <p className="text-gray-600 leading-relaxed">
              Dernière mise à jour : Janvier 2026
            </p>
            <p className="text-gray-500 text-sm mt-4">
              © SEAMLIER – L'art de la couture locale et simplifiée.
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
