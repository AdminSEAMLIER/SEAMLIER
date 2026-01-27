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
            La présente politique de confidentialité décrit comment SEAMLiER SAS collecte, utilise et protège vos données personnelles conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">1. Responsable du traitement</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le responsable du traitement des données personnelles est :
            </p>
            <ul className="text-gray-600 space-y-2">
              <li><strong>Société :</strong> SEAMLiER SAS</li>
              <li><strong>Adresse :</strong> 123 Rue de la Couture, 75001 Paris, France</li>
              <li><strong>Email :</strong> dpo@seamlier.com</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">2. Données collectées</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nous collectons différentes catégories de données personnelles :
            </p>
            
            <h3 className="text-lg font-medium text-gray-800 mb-2">2.1 Données d'identification</h3>
            <ul className="text-gray-600 space-y-1 list-disc list-inside mb-4">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone</li>
              <li>Adresse postale</li>
              <li>Photo de profil (facultatif)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.2 Données de connexion</h3>
            <ul className="text-gray-600 space-y-1 list-disc list-inside mb-4">
              <li>Adresse IP</li>
              <li>Type de navigateur</li>
              <li>Pages visitées et durée de visite</li>
              <li>Date et heure de connexion</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-800 mb-2">2.3 Données spécifiques aux utilisateurs</h3>
            <p className="text-gray-600 leading-relaxed mb-2">Pour les particuliers :</p>
            <ul className="text-gray-600 space-y-1 list-disc list-inside mb-4">
              <li>Mensurations corporelles (facultatif)</li>
              <li>Historique des projets et demandes</li>
              <li>Messages échangés avec les couturiers</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mb-2">Pour les professionnels :</p>
            <ul className="text-gray-600 space-y-1 list-disc list-inside">
              <li>Informations professionnelles (spécialités, expérience, tarifs)</li>
              <li>Portfolio et réalisations</li>
              <li>Numéro SIRET (le cas échéant)</li>
              <li>Coordonnées bancaires pour les paiements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">3. Finalités du traitement</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vos données personnelles sont collectées et traitées pour les finalités suivantes :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Création et gestion de votre compte utilisateur</li>
              <li>Mise en relation entre particuliers et professionnels de la couture</li>
              <li>Gestion des messages et communications entre utilisateurs</li>
              <li>Traitement des demandes de devis et des projets</li>
              <li>Amélioration de nos services et de l'expérience utilisateur</li>
              <li>Envoi de notifications relatives à votre compte et vos projets</li>
              <li>Envoi de newsletters et communications marketing (avec votre consentement)</li>
              <li>Prévention de la fraude et sécurité de la plateforme</li>
              <li>Respect de nos obligations légales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">4. Base légale du traitement</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le traitement de vos données personnelles repose sur les bases légales suivantes :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Exécution du contrat :</strong> pour la fourniture de nos services</li>
              <li><strong>Consentement :</strong> pour l'envoi de communications marketing</li>
              <li><strong>Intérêt légitime :</strong> pour l'amélioration de nos services et la prévention de la fraude</li>
              <li><strong>Obligation légale :</strong> pour le respect de nos obligations fiscales et comptables</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">5. Destinataires des données</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vos données personnelles peuvent être communiquées aux destinataires suivants :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Nos équipes internes (service client, technique, marketing)</li>
              <li>Les autres utilisateurs de la plateforme (dans le cadre de la mise en relation)</li>
              <li>Nos prestataires techniques (hébergement, paiement, emailing)</li>
              <li>Les autorités compétentes en cas d'obligation légale</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Nous ne vendons jamais vos données personnelles à des tiers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">6. Durée de conservation</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Vos données personnelles sont conservées pendant les durées suivantes :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Données de compte :</strong> pendant toute la durée de votre inscription, puis 3 ans après la dernière activité</li>
              <li><strong>Messages :</strong> 5 ans après leur envoi</li>
              <li><strong>Données de connexion :</strong> 1 an</li>
              <li><strong>Données de facturation :</strong> 10 ans (obligation légale)</li>
              <li><strong>Cookies :</strong> 13 mois maximum</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">7. Vos droits</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Droit d'accès :</strong> obtenir une copie de vos données personnelles</li>
              <li><strong>Droit de rectification :</strong> corriger des données inexactes ou incomplètes</li>
              <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
              <li><strong>Droit à la limitation :</strong> restreindre le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
              <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement à tout moment</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Pour exercer ces droits, contactez-nous à : <strong>dpo@seamlier.com</strong>
            </p>
            <p className="text-gray-600 leading-relaxed mt-2">
              Vous pouvez également introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-[#722F37] hover:underline">www.cnil.fr</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">8. Sécurité des données</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, modification, divulgation ou destruction :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>Chiffrement des données sensibles (SSL/TLS)</li>
              <li>Authentification sécurisée des utilisateurs</li>
              <li>Accès restreint aux données par nos équipes</li>
              <li>Sauvegardes régulières et sécurisées</li>
              <li>Tests de sécurité et mises à jour régulières</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">9. Transferts de données hors UE</h2>
            <p className="text-gray-600 leading-relaxed">
              Certaines de nos solutions techniques peuvent impliquer des transferts de données vers des pays situés hors de l'Union Européenne. Dans ce cas, nous nous assurons que ces transferts sont encadrés par des garanties appropriées (clauses contractuelles types de la Commission Européenne, décision d'adéquation, etc.).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">10. Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Notre site utilise des cookies pour :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site (authentification, sécurité)</li>
              <li><strong>Cookies analytiques :</strong> pour mesurer l'audience et améliorer nos services</li>
              <li><strong>Cookies de préférences :</strong> pour mémoriser vos choix (langue, thème)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Vous pouvez gérer vos préférences de cookies à tout moment depuis les paramètres de votre navigateur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">11. Mineurs</h2>
            <p className="text-gray-600 leading-relaxed">
              Nos services sont destinés aux personnes majeures. Si vous êtes mineur, vous devez obtenir le consentement de vos parents ou représentants légaux avant de vous inscrire sur notre plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">12. Modifications</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nous pouvons modifier cette politique de confidentialité à tout moment. En cas de modification substantielle, nous vous en informerons par email ou via une notification sur notre site.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Date de dernière mise à jour : Janvier 2026
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 SEAMLiER. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
