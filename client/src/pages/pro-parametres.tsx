import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Settings, Globe, Shield, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function ProParametres() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    profileVisible: true,
    acceptNewClients: true,
    showPricing: true,
    language: "fr",
  });

  const handleToggle = (key: keyof typeof settings) => {
    if (typeof settings[key] === 'boolean') {
      setSettings({ ...settings, [key]: !settings[key] });
    }
  };

  const handleSave = () => {
    toast({
      title: "Paramètres enregistrés",
      description: "Vos paramètres ont été mis à jour",
    });
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link href="/professionnel/profil">
            <Button variant="ghost" size="sm" className="mb-4 -ml-2 text-gray-600" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au profil
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Settings className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              Paramètres
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Gérez les paramètres de votre compte professionnel
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Visibilité
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Profil visible</Label>
                <p className="text-sm text-gray-500">Votre profil apparaît dans les recherches</p>
              </div>
              <Switch
                checked={settings.profileVisible}
                onCheckedChange={() => handleToggle('profileVisible')}
                data-testid="switch-profile-visible"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Accepter de nouveaux clients</Label>
                <p className="text-sm text-gray-500">Les clients peuvent vous envoyer des demandes</p>
              </div>
              <Switch
                checked={settings.acceptNewClients}
                onCheckedChange={() => handleToggle('acceptNewClients')}
                data-testid="switch-accept-clients"
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Afficher les tarifs</Label>
                <p className="text-sm text-gray-500">Afficher vos tarifs indicatifs sur votre profil</p>
              </div>
              <Switch
                checked={settings.showPricing}
                onCheckedChange={() => handleToggle('showPricing')}
                data-testid="switch-show-pricing"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Langue
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label className="text-gray-700 font-medium">Langue de l'interface</Label>
                <p className="text-sm text-gray-500">Choisissez votre langue préférée</p>
              </div>
              <Select 
                value={settings.language} 
                onValueChange={(value) => setSettings({ ...settings, language: value })}
              >
                <SelectTrigger className="w-32" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37] flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-3">
            <Link href="/professionnel/profil/mot-de-passe">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                data-testid="button-change-password"
              >
                Modifier le mot de passe
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Button 
          className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white"
          onClick={handleSave}
          data-testid="button-save-settings"
        >
          <Save className="h-4 w-4 mr-2" />
          Enregistrer les paramètres
        </Button>
      </div>
    </div>
  );
}
