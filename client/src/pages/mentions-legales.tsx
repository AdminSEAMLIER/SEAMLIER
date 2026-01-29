import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTranslation } from "react-i18next";

export default function MentionsLegales() {
  const { t } = useTranslation();

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
          {t('legal.title')}
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('legal.editor')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('legal.editorText')}
            </p>
            <ul className="text-gray-600 space-y-2">
              <li><strong>{t('legal.editorResponsible')}</strong> {t('legal.editorResponsibleValue')}</li>
              <li><strong>{t('legal.editorContact')}</strong> contact@seamlier.fr</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('legal.hosting')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('legal.hostingText')}
            </p>
            <ul className="text-gray-600 space-y-2">
              <li><strong>{t('legal.hostingAddress')}</strong> {t('legal.hostingAddressValue')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('legal.ip')}</h2>
            <p className="text-gray-600 leading-relaxed">
              {t('legal.ipText')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('legal.dataProtection')}</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              {t('legal.dataProtectionText')}
            </p>
            <p className="text-gray-600 leading-relaxed mt-4">
              {t('legal.moreInfo')}{" "}
              <Link href="/confidentialite" className="text-[#722F37] hover:underline">
                {t('legal.privacyPolicyLink')}
              </Link>.
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 SEAMLIER. {t('footer.allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
