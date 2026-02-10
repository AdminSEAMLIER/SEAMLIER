import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Connexion() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: t('auth.error'),
        description: t('auth.fillAllFields'),
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.welcomeBack'),
        });
        if (data.role === 'tailor') {
          setLocation('/professionnel');
        } else {
          setLocation('/particulier');
        }
      } else {
        toast({
          title: t('auth.error'),
          description: data.message || t('auth.invalidCredentials'),
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t('auth.error'),
        description: t('auth.serverError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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

          <Card className="border border-gray-200">
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-gray-700">{t('auth.email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-gray-700">{t('auth.password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#722F37] hover:bg-[#5a252c]"
                  disabled={isLoading}
                  data-testid="button-login-submit"
                >
                  {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
                </Button>
              </form>
            </CardContent>
          </Card>

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
