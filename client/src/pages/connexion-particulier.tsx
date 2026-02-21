import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { API_ENDPOINTS, apiFetch } from "@/lib/api-config";

export default function ConnexionParticulier() {
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
      const response = await apiFetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data) {
        await queryClient.invalidateQueries({ queryKey: ["auth-user"] });

        toast({
          title: t('auth.loginSuccess'),
          description: t('auth.welcomeBack'),
        });

        if (data.role === 'admin') {
          setLocation('/admin/dashboard');
        } else if (data.role === 'tailor') {
          setLocation('/dashboard-pro');
        } else {
          setLocation('/dashboard-client');
        }
      } else {
        toast({
          title: t('auth.error'),
          description: data?.message || t('auth.invalidCredentials'),
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: t('auth.error'),
        description: err.message || t('auth.serverError'),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col">
      <header className="bg-white border-b border-zinc-100 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link href="/connexion">
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
            <div className="w-16 h-16 bg-[#722F37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="h-8 w-8 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-2xl text-[#722F37] mb-2" data-testid="text-title">
              {t('auth.loginAsClient')}
            </h1>
            <p className="text-zinc-500 text-sm" data-testid="text-subtitle">
              {t('auth.loginAsClientDesc')}
            </p>
          </div>

          <Card className="border-none shadow-xl bg-white">
            <CardContent className="p-8">
              <form onSubmit={handleLogin} className="space-y-5" data-testid="form-login-client">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-zinc-700">
                    {t('auth.email')}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 border-zinc-200 focus:border-[#722F37] focus:ring-[#722F37]"
                      data-testid="input-email"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-zinc-700">
                    {t('auth.password')}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 border-zinc-200 focus:border-[#722F37] focus:ring-[#722F37]"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#722F37] hover:bg-[#5a1f25] text-white h-12 text-base font-medium transition-all shadow-md"
                  disabled={isLoading}
                  data-testid="button-submit"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('auth.loggingIn')}
                    </div>
                  ) : (
                    t('auth.loginAsClientButton')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="py-8 text-center space-y-4">
        <p className="text-zinc-500 text-sm">
          {t('auth.noAccount')}{" "}
          <Link href="/inscription/particulier">
            <span className="text-[#722F37] font-semibold hover:underline cursor-pointer" data-testid="link-signup">
              {t('auth.createClientAccount')}
            </span>
          </Link>
        </p>
        <Link href="/connexion">
          <span className="text-xs text-zinc-400 hover:text-[#722F37] uppercase tracking-widest cursor-pointer transition-colors" data-testid="link-back">
            {t('common.backToHome')}
          </span>
        </Link>
      </footer>
    </div>
  );
}
