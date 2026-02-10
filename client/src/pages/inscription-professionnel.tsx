import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Check, Users, TrendingUp, MessageCircle, Scissors, ArrowRight } from "lucide-react";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";

export default function InscriptionProfessionnel() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const benefits = [
    { icon: Users, text: t('auth.proBenefits.clients') },
    { icon: TrendingUp, text: t('auth.proBenefits.growth') },
    { icon: MessageCircle, text: t('auth.proBenefits.messaging') },
    { icon: Check, text: t('auth.proBenefits.portfolio') },
  ];

  const steps = [
    { number: 1, text: t('auth.proSteps.step1') },
    { number: 2, text: t('auth.proSteps.step2') },
    { number: 3, text: t('auth.proSteps.step3') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Button>
            </Link>
            <Logo className="text-2xl text-[#722F37]" />
          </div>
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 lg:py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-[#722F37]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scissors className="h-8 w-8 text-[#722F37]" />
          </div>
          <h1 className="font-serif text-xl lg:text-2xl text-[#722F37] mb-4">
            {t('auth.joinOurNetwork')}
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            {t('auth.developActivity')}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-6 lg:p-8">
              <h2 className="font-serif text-xl text-[#722F37] mb-6">
                {t('auth.whyJoinUs')}
              </h2>
              <div className="space-y-5">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center shrink-0">
                      <benefit.icon className="h-5 w-5 text-[#722F37]" />
                    </div>
                    <span className="text-gray-700">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-100 shadow-sm">
            <CardContent className="p-6 lg:p-8">
              <h2 className="font-serif text-xl text-[#722F37] mb-6">
                {t('auth.howItWorks')}
              </h2>
              <div className="space-y-5">
                {steps.map((step) => (
                  <div key={step.number} className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#722F37] text-white flex items-center justify-center shrink-0 text-sm font-medium">
                      {step.number}
                    </div>
                    <span className="text-gray-700 pt-1">{step.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-gray-100 shadow-sm bg-gray-50">
          <CardContent className="p-8 text-center">
            <h2 className="font-serif text-lg text-[#722F37] mb-3">
              {t('auth.readyToStart')}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {t('auth.createAccountInSeconds')}
            </p>
            <Button 
              size="lg" 
              className="bg-[#722F37] hover:bg-[#5a252c] text-white px-8"
              data-testid="button-start-registration"
              onClick={() => setLocation('/connexion?role=tailor')}
            >
              {t('auth.startRegistration')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <p className="text-sm text-gray-500 mt-4">
              {t('auth.termsAccept')}{' '}
              <Link href="/mentions-legales" className="text-[#722F37] hover:underline">
                {t('auth.termsOfUse')}
              </Link>
              {' '}{t('auth.and')}{' '}
              <Link href="/confidentialite" className="text-[#722F37] hover:underline">
                {t('auth.privacyPolicy')}
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-gray-500 mt-8">
          {t('auth.areYouClient')}{" "}
          <Link href="/inscription-particulier" className="text-[#722F37] font-medium hover:underline" data-testid="link-client-signup">
            {t('auth.createClientAccount')}
          </Link>
        </p>
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-500 text-sm">
            © 2026 SEAMLIER. {t('footer.allRightsReserved')}
          </p>
        </div>
      </footer>
    </div>
  );
}
