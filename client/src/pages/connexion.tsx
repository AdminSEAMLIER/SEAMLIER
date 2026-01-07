import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useToast } from "@/hooks/use-toast";

export default function Connexion() {
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
        title: "Connexion réussie",
        description: "Bienvenue sur L'Art de Coudre !",
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
          <div className="w-9" />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md border border-gray-100 bg-white shadow-sm">
          <CardHeader className="text-center pb-2">
            <CardTitle className="font-serif text-2xl text-[#722F37]">
              Connexion
            </CardTitle>
            <p className="text-gray-500 mt-2">
              Connectez-vous à votre compte
            </p>
          </CardHeader>
          <CardContent className="bg-white pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 border-gray-200"
                    required
                    data-testid="input-email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Votre mot de passe"
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
                  Mot de passe oublié ?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-center text-gray-500 text-sm mb-4">
                Pas encore de compte ?
              </p>
              <div className="flex flex-col gap-3">
                <Link href="/inscription-particulier">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-[#722F37] text-[#722F37]"
                    data-testid="button-inscription-particulier"
                  >
                    S'inscrire comme particulier
                  </Button>
                </Link>
                <Link href="/inscription-professionnel">
                  <Button 
                    variant="outline" 
                    className="w-full bg-white border-gray-300 text-gray-600"
                    data-testid="button-inscription-pro"
                  >
                    S'inscrire comme professionnel
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
            Retour à l'accueil
          </span>
        </Link>
      </footer>
    </div>
  );
}
