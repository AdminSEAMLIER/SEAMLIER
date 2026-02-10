import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, Briefcase } from "lucide-react";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useLocation } from "wouter";

export default function Inscription() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const handleSignup = (role: string) => {
    setLocation(`/connexion?role=${role}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="text-[#722F37]" textClassName="text-[#722F37]" />
          </Link>
          <LanguageToggle />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/">
          <Button variant="ghost" className="mb-6 text-gray-600" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
        </Link>

        <div className="text-center mb-6">
          <h1 className="font-serif text-base lg:text-lg text-[#722F37] mb-1">
            {t('inscription.title')}
          </h1>
          <p className="text-gray-600 text-xs">
            {t('inscription.subtitle')}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <Card
            className="border-2 border-gray-200 hover:border-[#722F37] transition-colors cursor-pointer group"
            onClick={() => handleSignup('client')}
            data-testid="card-inscription-particulier"
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 group-hover:bg-[#722F37]/10 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                <User className="h-8 w-8 text-[#722F37]" />
              </div>
              <h2 className="font-serif text-sm text-[#722F37] mb-1">
                {t('inscription.clientTitle')}
              </h2>
              <p className="text-gray-500 text-xs mb-3">
                {t('inscription.clientDesc')}
              </p>
              <Button className="w-full bg-[#722F37] hover:bg-[#5a252c] text-xs px-2" data-testid="button-inscription-particulier">
                {t('inscription.clientButton')}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="border-2 border-gray-200 hover:border-[#722F37] transition-colors cursor-pointer group"
            onClick={() => handleSignup('tailor')}
            data-testid="card-inscription-professionnel"
          >
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 group-hover:bg-[#722F37]/10 rounded-full flex items-center justify-center mx-auto mb-6 transition-colors">
                <Briefcase className="h-8 w-8 text-[#722F37]" />
              </div>
              <h2 className="font-serif text-sm text-[#722F37] mb-1">
                {t('inscription.proTitle')}
              </h2>
              <p className="text-gray-500 text-xs mb-3">
                {t('inscription.proDesc')}
              </p>
              <Button className="w-full bg-[#722F37] hover:bg-[#5a252c] text-xs px-2" data-testid="button-inscription-professionnel">
                {t('inscription.proButton')}
              </Button>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-gray-500 mt-8">
          {t('inscription.alreadyAccount')}{' '}
          <Link href="/connexion" className="text-[#722F37] hover:underline" data-testid="link-connexion">
            {t('inscription.loginLink')}
          </Link>
        </p>
      </main>
    </div>
  );
}
