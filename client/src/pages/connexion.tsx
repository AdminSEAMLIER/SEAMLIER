import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useToast } from "@/hooks/use-toast";

export default function Connexion() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: t('auth.loginSuccess'),
        description: t('auth.welcomeMessage'),
      });
      setLocation("/particulier");
    }, 1000);
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
        <Card className="w-full max-w-md border border-gray-100 bg-white shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-serif text-2xl text-[#722F37]">
              {t('auth.login')}
            </CardTitle>
            <p className="text-gray-500 mt-2">
              {t('auth.loginSubtitle')}
            </p>
          </CardHeader>
          <CardContent className="bg-white pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">{t('auth.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('auth.emailPlaceholder')}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 border-gray-200"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">{t('auth.password')}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t('auth.passwordPlaceholder')}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10 border-gray-200"
                    required
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="button" className="text-sm text-[#722F37] hover:underline" data-testid="link-forgot-password">
                  {t('auth.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? t('common.loading') : t('auth.login')}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-gray-500 text-sm mb-4">
                {t('auth.noAccount')}
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/inscription-particulier">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-[#722F37] text-[#722F37]"
                    data-testid="button-inscription-particulier"
                  >
                    {t('auth.signupAsClient')}
                  </Button>
                </Link>
                <Link href="/inscription-professionnel">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-gray-300 text-gray-600"
                    data-testid="button-inscription-pro"
                  >
                    {t('auth.signupAsPro')}
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
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
