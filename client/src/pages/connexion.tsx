import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { User, Scissors, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { Badge } from "@/components/ui/badge";

export default function Connexion() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-100 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:text-[#722F37]" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Logo textClassName="text-xl text-[#722F37]" />
          <LanguageToggle />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-serif text-2xl text-[#722F37] mb-2" data-testid="text-title">
              {t('auth.login')}
            </h1>
            <p className="text-zinc-500 text-sm" data-testid="text-subtitle">
              {t('auth.choosePortal')}
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/connexion/particulier">
              <Card className="border-none shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer group" data-testid="card-login-client">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#722F37]/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#722F37]/20 transition-colors">
                    <User className="h-7 w-7 text-[#722F37]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-zinc-900 text-lg">{t('auth.loginAsClient')}</h2>
                    <p className="text-zinc-500 text-sm mt-0.5">{t('auth.loginAsClientDesc')}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/connexion/professionnel">
              <Card className="border-none shadow-lg bg-white hover:shadow-xl transition-shadow cursor-pointer group" data-testid="card-login-pro">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="w-14 h-14 bg-[#722F37]/10 rounded-full flex items-center justify-center flex-shrink-0 group-hover:bg-[#722F37]/20 transition-colors">
                    <Scissors className="h-7 w-7 text-[#722F37]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-zinc-900 text-lg">{t('auth.loginAsPro')}</h2>
                      <Badge variant="secondary" className="bg-[#722F37] text-white border-none text-[10px]">Pro</Badge>
                    </div>
                    <p className="text-zinc-500 text-sm mt-0.5">{t('auth.loginAsProDesc')}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>
      </main>

      <footer className="py-8 text-center space-y-4">
        <p className="text-zinc-500 text-sm">
          {t('auth.noAccount')}{" "}
          <Link href="/inscription">
            <span className="text-[#722F37] font-semibold hover:underline cursor-pointer" data-testid="link-signup">
              {t('auth.createAccount')}
            </span>
          </Link>
        </p>
        <Link href="/">
          <span className="text-xs text-zinc-400 hover:text-[#722F37] uppercase tracking-widest cursor-pointer transition-colors" data-testid="link-home">
            {t('common.backToHome')}
          </span>
        </Link>
      </footer>
    </div>
  );
}
