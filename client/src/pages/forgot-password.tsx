import { useState } from "react";
import { Link } from "wouter";
import { Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const forgotMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/forgot-password", { email });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      return data;
    },
    onSuccess: () => {
      setSent(true);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Erreur", description: "Veuillez entrer votre adresse email.", variant: "destructive" });
      return;
    }
    forgotMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/connexion">
            <span className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#601B28] cursor-pointer mb-6 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </span>
          </Link>
          <h1 className="font-serif text-3xl text-[#601B28] mb-2">SEAMLIER</h1>
          <p className="text-gray-500 text-sm">Réinitialisation de mot de passe</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#601B28]/10 flex items-center justify-center">
                {sent ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Mail className="h-6 w-6 text-[#601B28]" />}
              </div>
            </div>
            <CardTitle className="text-center text-lg text-gray-800">
              {sent ? "Email envoyé !" : "Mot de passe oublié ?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-sm leading-relaxed">
                  Si un compte existe avec l'adresse <strong>{email}</strong>, vous recevrez un email contenant un lien pour réinitialiser votre mot de passe.
                </p>
                <p className="text-gray-400 text-xs">Ce lien est valable 2 heures. Vérifiez vos spams si vous ne le voyez pas.</p>
                <Link href="/connexion">
                  <Button className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white mt-4" data-testid="button-back-to-login">
                    Retour à la connexion
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-gray-600 text-sm mb-4">
                  Entrez l'adresse email associée à votre compte. Nous vous enverrons un lien pour créer un nouveau mot de passe.
                </p>
                <div>
                  <Label htmlFor="email" className="text-gray-700 text-sm font-medium">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="votre@email.fr"
                    className="mt-1.5 h-11"
                    autoComplete="email"
                    data-testid="input-email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white h-11"
                  disabled={forgotMutation.isPending}
                  data-testid="button-submit"
                >
                  {forgotMutation.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</span>
                  ) : "Envoyer le lien de réinitialisation"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
