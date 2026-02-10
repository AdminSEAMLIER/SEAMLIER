import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useEffect } from "react";

export default function Connexion() {
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role');
    if (role === 'client' || role === 'tailor') {
      window.location.href = `/api/login?role=${role}`;
    }
  }, []);

  const handleLogin = (role: string) => {
    window.location.href = `/api/login?role=${role}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-gray-600" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Logo className="text-[#722F37]" textClassName="text-lg text-[#722F37]" />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="font-serif text-base lg:text-lg text-[#722F37] mb-1">
              {t('auth.login')}
            </h1>
            <p className="text-gray-600 text-xs">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          <div className="space-y-4">
            <Card className="border-2 border-gray-200 cursor-pointer" onClick={() => handleLogin('client')} data-testid="card-login-particulier">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-7 w-7 text-[#722F37]" />
                </div>
                <h2 className="font-serif text-sm text-[#722F37] mb-1">
                  {t('auth.loginAsClient')}
                </h2>
                <p className="text-gray-500 text-xs mb-3">
                  {t('auth.loginAsClientDesc')}
                </p>
                <Button 
                  className="w-full bg-[#722F37] hover:bg-[#5a252c]" 
                  data-testid="button-login-particulier"
                >
                  {t('auth.loginAsClientButton')}
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 cursor-pointer" onClick={() => handleLogin('tailor')} data-testid="card-login-professionnel">
              <CardContent className="p-6 text-center">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Briefcase className="h-7 w-7 text-[#722F37]" />
                </div>
                <h2 className="font-serif text-sm text-[#722F37] mb-1">
                  {t('auth.loginAsPro')}
                </h2>
                <p className="text-gray-500 text-xs mb-3">
                  {t('auth.loginAsProDesc')}
                </p>
                <Button 
                  className="w-full bg-[#722F37] hover:bg-[#5a252c]" 
                  data-testid="button-login-professionnel"
                >
                  {t('auth.loginAsProButton')}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-500 text-xs mb-3">
              {t('auth.noAccount')}
            </p>
            <Link href="/inscription">
              <Button 
                variant="outline" 
                className="bg-white border-[#722F37] text-[#722F37] text-sm"
                data-testid="button-inscription"
              >
                {t('auth.createAccount')}
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <Link href="/">
          <span className="text-sm text-gray-500 hover:text-[#722F37]" data-testid="link-home">
            {t('common.backToHome')}
          </span>
        </Link>
      </footer>
    </div>
  );
}
