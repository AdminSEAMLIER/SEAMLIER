import { useState } from "react";
import { Link, useSearch, useLocation } from "wouter";
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const searchStr = useSearch();
  const token = new URLSearchParams(searchStr).get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/reset-password", { token, newPassword });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur");
      return data;
    },
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate("/connexion"), 3000);
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Erreur", description: "Les mots de passe ne correspondent pas.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ title: "Erreur", description: "Le mot de passe doit contenir au moins 8 caractères.", variant: "destructive" });
      return;
    }
    resetMutation.mutate();
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <Card className="w-full max-w-md border-none shadow-lg">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <AlertCircle className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Lien invalide</h2>
            <p className="text-gray-500 text-sm">Ce lien de réinitialisation est invalide ou a expiré.</p>
            <Link href="/mot-de-passe-oublie">
              <Button className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white">Faire une nouvelle demande</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl text-[#601B28] mb-2">SEAMLIER</h1>
          <p className="text-gray-500 text-sm">Créer un nouveau mot de passe</p>
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-[#601B28]/10 flex items-center justify-center">
                {success ? <CheckCircle className="h-6 w-6 text-green-600" /> : <Lock className="h-6 w-6 text-[#601B28]" />}
              </div>
            </div>
            <CardTitle className="text-center text-lg text-gray-800">
              {success ? "Mot de passe réinitialisé !" : "Nouveau mot de passe"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="text-center space-y-4">
                <p className="text-gray-600 text-sm">Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers la page de connexion…</p>
                <Link href="/connexion">
                  <Button className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white" data-testid="button-go-to-login">
                    Se connecter maintenant
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="newPassword" className="text-gray-700 text-sm font-medium">Nouveau mot de passe</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 caractères"
                      className="h-11 pr-10"
                      data-testid="input-new-password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-gray-700 text-sm font-medium">Confirmer le mot de passe</Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="Retapez votre mot de passe"
                      className="h-11 pr-10"
                      data-testid="input-confirm-password"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white h-11"
                  disabled={resetMutation.isPending}
                  data-testid="button-submit"
                >
                  {resetMutation.isPending ? (
                    <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</span>
                  ) : "Enregistrer le nouveau mot de passe"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
