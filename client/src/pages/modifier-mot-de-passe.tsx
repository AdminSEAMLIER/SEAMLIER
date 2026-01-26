import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Eye, EyeOff, Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ModifierMotDePasse() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 8 caractères",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Mot de passe modifié",
      description: "Votre mot de passe a été mis à jour avec succès",
    });

    setFormData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link href="/particulier/profil">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-gray-600" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Lock className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              Modifier le mot de passe
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Choisissez un mot de passe sécurisé pour protéger votre compte
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">Changer votre mot de passe</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="current-password" className="text-gray-600">Mot de passe actuel</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="pr-10 border-gray-200"
                    placeholder="••••••••"
                    required
                    data-testid="input-current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-current-password"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-gray-600">Nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="pr-10 border-gray-200"
                    placeholder="••••••••"
                    required
                    data-testid="input-new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-new-password"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-gray-500">Minimum 8 caractères</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-gray-600">Confirmer le nouveau mot de passe</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pr-10 border-gray-200"
                    placeholder="••••••••"
                    required
                    data-testid="input-confirm-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="button-toggle-confirm-password"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Link href="/particulier/profil" className="flex-1">
                  <Button 
                    type="button"
                    variant="outline" 
                    className="w-full bg-white border border-gray-300 text-gray-600"
                    data-testid="button-cancel"
                  >
                    Annuler
                  </Button>
                </Link>
                <Button 
                  type="submit"
                  className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
                  data-testid="button-save-password"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
