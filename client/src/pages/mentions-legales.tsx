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
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">1. Éditeur du Site</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le site www.seamlier.fr est édité par l'enseigne SEAMLIER.
            </p>
            <ul className="text-gray-600 space-y-2">
              <li><strong>Responsable de la publication :</strong> La Direction de Seamlier.</li>
              <li><strong>Contact :</strong> contact@seamlier.fr</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">2. Hébergement</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Le site est hébergé par la société o2switch :
            </p>
            <ul className="text-gray-600 space-y-2">
              <li><strong>Adresse :</strong> Chemin des Pardiaux, 63000 Clermont-Ferrand, France.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">3. Propriété Intellectuelle</h2>
            <p className="text-gray-600 leading-relaxed">
              L'ensemble des éléments (logo, charte graphique, textes, outils métiers) est la propriété exclusive de Seamlier. Toute reproduction est interdite sans accord préalable.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">4. Protection des Données Personnelles (RGPD)</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Seamlier collecte uniquement les données nécessaires à la mise en relation et à la gestion des projets (mesures, contacts). Conformément à la loi, vous disposez d'un droit d'accès et de suppression de vos données en écrivant à : contact@seamlier.fr.
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              Pour plus d'informations sur le traitement de vos données, veuillez consulter notre{" "}
              <Link href="/confidentialite" className="text-[#722F37] hover:underline">
                Politique de Confidentialité
              </Link>.
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
