import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { useTranslation } from "react-i18next";

export default function Confidentialite() {
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
          {t('privacy.title')}
        </h1>

        <div className="prose prose-gray max-w-none">
          <p className="text-muted-foreground leading-relaxed mb-8">
            {t('privacy.intro')}
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.controller')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.controllerText')}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>{t('privacy.contact')}</strong> contact@seamlier.fr
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.dataCollected')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.dataCollectedIntro')}
            </p>
            
            <h3 className="text-lg font-medium text-foreground mb-2">{t('privacy.identification')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.identificationText')}
            </p>

            <h3 className="text-lg font-medium text-foreground mb-2">{t('privacy.dataClients')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.dataClientsText')}
            </p>

            <h3 className="text-lg font-medium text-foreground mb-2">{t('privacy.dataPros')}</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.dataProsText')}
            </p>

            <h3 className="text-lg font-medium text-foreground mb-2">{t('privacy.connectionData')}</h3>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.connectionDataText')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.purposes')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.purposesIntro')}
            </p>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>{t('privacy.purpose1')}</li>
              <li>{t('privacy.purpose2')}</li>
              <li>{t('privacy.purpose3')}</li>
              <li>{t('privacy.purpose4')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.legalBasis')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.legalBasisText')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.recipients')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.recipientsIntro')}
            </p>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>{t('privacy.recipient1')}</li>
              <li>{t('privacy.recipient2')}</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.retention')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.retentionText')}
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.rights')}</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              {t('privacy.rightsText')} <strong>contact@seamlier.fr</strong>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-[#722F37] mb-4">{t('privacy.security')}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.securityText')}
            </p>
          </section>

          <section>
            <p className="text-muted-foreground leading-relaxed">
              {t('privacy.lastUpdate')}
            </p>
            <p className="text-muted-foreground text-sm mt-4">
              {t('privacy.copyright')}
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
