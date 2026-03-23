import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function CGU() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>
          <Logo className="text-[#601B28]" textClassName="text-lg text-[#601B28]" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 lg:py-16">
        <div className="mb-10">
          <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28] mb-3">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-gray-500 text-base">Dernière mise à jour : janvier 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8">

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">1. Objet</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes Conditions Générales d'Utilisation (CGU) définissent les règles d'accès et d'utilisation de la plateforme SEAMLIER, accessible à l'adresse <a href="https://www.seamlier.fr" className="text-[#601B28] hover:underline">www.seamlier.fr</a>, exploitée par la société SEAMLIER SAS. Toute utilisation de la plateforme implique l'acceptation pleine et entière des présentes CGU.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">2. Description du service</h2>
            <p className="text-gray-600 leading-relaxed">
              SEAMLIER est une marketplace de mise en relation entre particuliers (clients) et artisans couturiers professionnels. La plateforme permet de : découvrir des artisans vérifiés, demander des devis sur mesure, suivre l'avancement des commandes, effectuer des paiements sécurisés et laisser des avis. SEAMLIER n'est pas partie aux contrats conclus entre clients et artisans.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">3. Inscription et compte utilisateur</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              L'utilisation des fonctionnalités de la plateforme nécessite la création d'un compte. L'utilisateur s'engage à fournir des informations exactes, complètes et à les maintenir à jour. Un compte est strictement personnel et ne peut être cédé.
            </p>
            <p className="text-gray-600 leading-relaxed">
              L'utilisateur est responsable de la confidentialité de ses identifiants de connexion. Toute utilisation frauduleuse du compte doit être signalée immédiatement à SEAMLIER.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">4. Obligations des utilisateurs</h2>
            <p className="text-gray-600 leading-relaxed mb-3">L'utilisateur s'engage à :</p>
            <ul className="text-gray-600 space-y-2 ml-4">
              <li>• Ne pas utiliser la plateforme à des fins illicites ou contraires aux bonnes mœurs</li>
              <li>• Ne pas tenter de contourner les systèmes de paiement de SEAMLIER (pas de transaction hors plateforme)</li>
              <li>• Ne pas publier de contenu faux, trompeur, diffamatoire ou portant atteinte aux droits de tiers</li>
              <li>• Respecter la confidentialité des informations des autres utilisateurs</li>
              <li>• Ne pas utiliser de robots ou systèmes automatisés pour accéder à la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">5. Obligations des artisans</h2>
            <p className="text-gray-600 leading-relaxed">
              Les artisans s'engagent à fournir des informations exactes sur leur savoir-faire, à respecter les devis proposés, à livrer les créations dans les délais convenus et à exercer leur activité en conformité avec la législation française (notamment en matière fiscale et sociale). SEAMLIER se réserve le droit de suspendre tout compte artisan en cas de manquement avéré.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">6. Propriété intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed">
              L'ensemble des éléments de la plateforme (logo, textes, design, code) est protégé par les droits de propriété intellectuelle et appartient à SEAMLIER SAS. Toute reproduction sans autorisation est interdite. Les artisans conservent leurs droits sur les créations et photos qu'ils publient, mais accordent à SEAMLIER une licence d'affichage sur la plateforme.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">7. Limitation de responsabilité</h2>
            <p className="text-gray-600 leading-relaxed">
              SEAMLIER agit en qualité d'intermédiaire et ne saurait être tenu responsable des différends entre clients et artisans, des défauts de fabrication, des retards de livraison ou de tout préjudice indirect. SEAMLIER met en œuvre tous les moyens raisonnables pour assurer la disponibilité de la plateforme, sans garantie de continuité.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">8. Suspension et résiliation</h2>
            <p className="text-gray-600 leading-relaxed">
              SEAMLIER se réserve le droit de suspendre ou supprimer tout compte en cas de violation des présentes CGU, sans préavis ni indemnité. L'utilisateur peut clôturer son compte à tout moment en contactant support@seamlier.fr.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">9. Données personnelles</h2>
            <p className="text-gray-600 leading-relaxed">
              Le traitement des données personnelles est régi par notre{" "}
              <Link href="/confidentialite" className="text-[#601B28] hover:underline">Politique de confidentialité</Link>.
              Conformément au RGPD, tout utilisateur dispose d'un droit d'accès, de rectification et de suppression de ses données.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">10. Droit applicable et juridiction</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux français seront compétents.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#601B28] mb-3">11. Modification des CGU</h2>
            <p className="text-gray-600 leading-relaxed">
              SEAMLIER se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés par email. L'utilisation continue de la plateforme après modification vaut acceptation des nouvelles CGU.
            </p>
          </section>

          <section>
            <p className="text-gray-500 text-sm">
              Contact : <a href="mailto:contact@seamlier.fr" className="text-[#601B28] hover:underline">contact@seamlier.fr</a> — 
              SEAMLIER SAS, France
            </p>
          </section>

        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-8 px-4 mt-12">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-6 text-sm text-gray-400">
          <Link href="/cgv" className="hover:text-[#601B28]">CGV</Link>
          <Link href="/politique-remboursement" className="hover:text-[#601B28]">Remboursement</Link>
          <Link href="/mentions-legales" className="hover:text-[#601B28]">Mentions légales</Link>
          <Link href="/confidentialite" className="hover:text-[#601B28]">Confidentialité</Link>
        </div>
        <p className="text-center text-gray-400 text-xs mt-4">© 2026 SEAMLIER. Tous droits réservés.</p>
      </footer>
    </div>
  );
}
