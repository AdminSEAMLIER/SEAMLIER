import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

export default function MentionsLegales() {
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
          Mentions Légales
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">1. Éditeur du site</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le site L'Art de Coudre est édité par la société L'Art de Coudre SAS, société par actions simplifiée au capital de 10 000 euros, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro RCS Paris XXX XXX XXX.
            </p>
            <ul className="text-gray-600 space-y-2">
              <li><strong>Siège social :</strong> 123 Rue de la Couture, 75001 Paris, France</li>
              <li><strong>Numéro de TVA intracommunautaire :</strong> FR XX XXX XXX XXX</li>
              <li><strong>Email :</strong> contact@lartdecoudre.fr</li>
              <li><strong>Téléphone :</strong> +33 (0)1 XX XX XX XX</li>
              <li><strong>Directeur de la publication :</strong> [Nom du Directeur]</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">2. Hébergement</h2>
            <p className="text-gray-600 leading-relaxed">
              Le site est hébergé par Replit, Inc., dont le siège social est situé au 900 Broadway, San Francisco, CA 94133, États-Unis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">3. Propriété intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              L'ensemble du contenu du site L'Art de Coudre (textes, images, vidéos, logos, icônes, sons, logiciels, etc.) est protégé par le droit d'auteur, le droit des marques et le droit des bases de données.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de L'Art de Coudre SAS.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">4. Protection des données personnelles</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
            </p>
            <p className="text-gray-600 leading-relaxed mb-4">
              Pour exercer ces droits ou pour toute question relative à la protection de vos données personnelles, vous pouvez nous contacter :
            </p>
            <ul className="text-gray-600 space-y-2">
              <li><strong>Par email :</strong> dpo@lartdecoudre.fr</li>
              <li><strong>Par courrier :</strong> L'Art de Coudre SAS - DPO, 123 Rue de la Couture, 75001 Paris</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-4">
              Pour plus d'informations sur le traitement de vos données, veuillez consulter notre{" "}
              <Link href="/confidentialite" className="text-[#722F37] hover:underline">
                Politique de Confidentialité
              </Link>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">5. Cookies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le site L'Art de Coudre utilise des cookies pour améliorer l'expérience utilisateur, réaliser des statistiques de visite et proposer des contenus personnalisés.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Vous pouvez à tout moment modifier vos préférences en matière de cookies depuis les paramètres de votre navigateur.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">6. Responsabilité</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              L'Art de Coudre agit en tant qu'intermédiaire entre les particuliers et les professionnels de la couture. À ce titre, L'Art de Coudre ne peut être tenu responsable :
            </p>
            <ul className="text-gray-600 space-y-2 list-disc list-inside">
              <li>De la qualité des prestations réalisées par les couturiers référencés sur la plateforme</li>
              <li>Des litiges pouvant survenir entre les utilisateurs et les professionnels</li>
              <li>Des informations fournies par les professionnels sur leurs profils</li>
              <li>De l'indisponibilité temporaire du site pour des raisons de maintenance ou techniques</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">7. Liens hypertextes</h2>
            <p className="text-gray-600 leading-relaxed">
              Le site peut contenir des liens vers d'autres sites internet. L'Art de Coudre n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant à leur contenu.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">8. Droit applicable et juridiction compétente</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. En cas de litige, et après tentative de résolution amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">9. Médiation</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Conformément aux dispositions du Code de la consommation concernant le règlement amiable des litiges, L'Art de Coudre adhère au Service du Médiateur du e-commerce de la FEVAD (Fédération du e-commerce et de la vente à distance).
            </p>
            <p className="text-gray-600 leading-relaxed">
              Après démarche préalable écrite des consommateurs auprès de L'Art de Coudre, le Service du Médiateur peut être saisi pour tout litige de consommation dont le règlement n'aurait pas abouti. Pour connaître les modalités de saisine du Médiateur, veuillez consulter : www.mediateurfevad.fr
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">10. Mise à jour</h2>
            <p className="text-gray-600 leading-relaxed">
              Les présentes mentions légales peuvent être modifiées à tout moment. Date de dernière mise à jour : Janvier 2026.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 L'Art de Coudre. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
