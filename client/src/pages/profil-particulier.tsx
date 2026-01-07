import { useState } from "react";
import { Link } from "wouter";
import { User, Mail, Phone, MapPin, Camera, Edit2, Save, LogOut, Ruler, BookOpen, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

export default function ProfilParticulier() {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    fullName: "Marie Dupont",
    email: "marie.dupont@email.com",
    phone: "06 12 34 56 78",
    location: "Paris",
    avatarUrl: "",
  });

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: "Profil mis à jour",
      description: "Vos informations ont été enregistrées avec succès.",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <User className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              Mon Profil
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Gérez vos informations personnelles
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-6 bg-white">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-gray-100">
                  <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                  <AvatarFallback className="bg-[#722F37]/10 text-[#722F37] text-2xl font-medium">
                    {getInitials(profile.fullName)}
                  </AvatarFallback>
                </Avatar>
                <button 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  data-testid="button-change-avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-semibold text-[#722F37]">{profile.fullName}</h2>
                <p className="text-gray-500">Membre depuis janvier 2026</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#722F37]">3</p>
                  <p className="text-sm text-gray-500">Projets réalisés</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#722F37]">2</p>
                  <p className="text-sm text-gray-500">Couturiers contactés</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg text-[#722F37]">Informations personnelles</CardTitle>
            {!isEditing && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsEditing(true)}
                className="text-gray-500"
                data-testid="button-edit-profile"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Nom complet</Label>
                  {isEditing ? (
                    <Input
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      className="mt-1 border-gray-200"
                      data-testid="input-fullname"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.fullName}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Email</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="mt-1 border-gray-200"
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Téléphone</Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="mt-1 border-gray-200"
                      data-testid="input-phone"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <Label className="text-gray-500 text-sm">Ville</Label>
                  {isEditing ? (
                    <Input
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="mt-1 border-gray-200"
                      data-testid="input-location"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.location}</p>
                  )}
                </div>
              </div>
            </div>

            {isEditing && (
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="outline"
                  className="flex-1 bg-white border border-gray-300 text-gray-600"
                  onClick={() => setIsEditing(false)}
                  data-testid="button-cancel"
                >
                  Annuler
                </Button>
                <Button 
                  className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
                  onClick={handleSave}
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">Accès rapide</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-3 gap-3">
              <Link href="/particulier/decouverte">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid="link-recherche">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                    <Search className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-gray-600 text-center">Recherche</span>
                </div>
              </Link>
              <Link href="/particulier/mesures">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid="link-mesures">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                    <Ruler className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-gray-600 text-center">Mesures</span>
                </div>
              </Link>
              <Link href="/particulier/magazine">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid="link-magazine">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                    <BookOpen className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-gray-600 text-center">Magazine</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">Compte</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                data-testid="button-change-password"
              >
                Changer de mot de passe
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                data-testid="button-notifications"
              >
                Préférences de notifications
              </Button>
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border border-red-200 text-red-600 hover:bg-red-50"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Se déconnecter
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
