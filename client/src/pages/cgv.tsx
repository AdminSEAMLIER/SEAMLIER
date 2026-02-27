import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTranslation } from "react-i18next";

export default function CGV() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>
          <Logo className="text-[#722F37]" textClassName="text-lg text-[#722F37]" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 lg:py-12">
        <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-8">
          {t('terms.title')}
        </h1>

        <div className="prose prose-gray max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('terms.object')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.objectText')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('terms.role')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('terms.roleIntro')}
            </p>
            <ul className="text-muted-foreground space-y-3">
              <li>
                <strong>{t('terms.selection')}</strong> {t('terms.selectionText')}
              </li>
              <li>
                <strong>{t('terms.support')}</strong> {t('terms.supportText')}
              </li>
              <li>
                <strong>{t('terms.guarantee')}</strong> {t('terms.guaranteeText')}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('terms.process')}</h2>
            <ul className="text-muted-foreground space-y-3">
              <li>
                <strong>{t('terms.precision')}</strong> {t('terms.precisionText')}
              </li>
              <li>
                <strong>{t('terms.validation')}</strong> {t('terms.validationText')}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('terms.pricing')}</h2>
            <ul className="text-muted-foreground space-y-3">
              <li>
                <strong>{t('terms.transparency')}</strong> {t('terms.transparencyText')}
              </li>
              <li>
                <strong>{t('terms.securePay')}</strong> {t('terms.securePayText')}
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('terms.withdrawal')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.withdrawalText')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('terms.responsibility')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.responsibilityText')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('terms.disputes')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.disputesText')}
            </p>
          </section>

          <section>
            <p className="text-muted-foreground leading-relaxed">
              {t('terms.lastUpdate')}
            </p>
            <p className="text-muted-foreground text-sm mt-4">
              {t('terms.copyright')}
            </p>
          </section>
        </div>
      </main>

      <footer className="bg-white border-t border-border py-6 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-muted-foreground text-sm">
            © 2026 SEAMLIER. {t('footer.allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
