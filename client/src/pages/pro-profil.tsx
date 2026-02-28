import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { User, Mail, Phone, MapPin, Camera, Edit2, Save, LogOut, TrendingUp, Star, Settings, FileText, FolderKanban, Loader2, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

export default function ProProfil() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user, isLoading: authLoading, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    profileImageUrl: "",
  });

  const { data: tailorProfile } = useQuery<any>({
    queryKey: ['/api/user/me/tailor'],
    enabled: !!user,
  });

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: (user as any).phone || "",
        location: (user as any).location || "",
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', `/api/users/${user?.id}`, {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        profileImageUrl: profile.profileImageUrl || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      setIsEditing(false);
      toast({
        title: t('profile.updated'),
        description: t('profile.updatedDesc'),
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder le profil",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    saveMutation.mutate();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const photoSaveMutation = useMutation({
    mutationFn: async (base64: string) => {
      return apiRequest('PATCH', `/api/users/${user?.id}`, {
        profileImageUrl: base64,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth-user"] });
      toast({
        title: t('profile.photoUpdated'),
        description: t('profile.photoUpdatedDesc'),
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la photo",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('profile.imageTooLarge'),
          description: t('profile.imageTooLargeDesc'),
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfile({ ...profile, profileImageUrl: base64 });
        photoSaveMutation.mutate(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");

  const getInitials = () => {
    const first = profile.firstName?.[0] || "";
    const last = profile.lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen pb-20 lg:pb-8 bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#722F37]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-20 lg:pb-8 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à votre profil.</p>
          <Link href="/connexion">
            <Button className="bg-[#722F37]" data-testid="button-go-login">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <User className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('nav.profile')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {t('profile.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-6 bg-white">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-gray-100">
                  <AvatarImage src={profile.profileImageUrl} alt={fullName} />
                  <AvatarFallback className="bg-[#722F37]/10 text-[#722F37] text-2xl font-medium">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  data-testid="input-avatar-file"
                />
                <button
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  data-testid="button-change-avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1 flex-wrap">
                  <h2 className="font-serif text-xl text-[#722F37]" data-testid="text-profile-name">{fullName || "—"}</h2>
                  <Badge className="bg-[#722F37]/10 text-[#722F37] border-none">
                    <Briefcase className="h-3 w-3 mr-1" />
                    Pro
                  </Badge>
                </div>
                <p className="text-gray-600" data-testid="text-profile-email">{profile.email}</p>
                {tailorProfile?.specialty && (
                  <p className="text-sm text-gray-500 mt-1">{tailorProfile.specialty}</p>
                )}
                {tailorProfile?.rating && (
                  <div className="flex items-center justify-center sm:justify-start gap-1 text-sm mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{tailorProfile.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg text-[#722F37]">{t('profile.personalInfo')}</CardTitle>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-gray-500"
                data-testid="button-edit-profile"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                {t('profile.edit')}
              </Button>
            )}
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-gray-500 text-sm">{t('auth.fullName')}</Label>
                  {isEditing ? (
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        placeholder="Prénom"
                        data-testid="input-firstname"
                      />
                      <Input
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        placeholder="Nom"
                        data-testid="input-lastname"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-700" data-testid="text-fullname">{fullName || "—"}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-gray-500 text-sm">{t('auth.email')}</Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="mt-1 border-gray-200"
                      data-testid="input-email"
                    />
                  ) : (
                    <p className="text-gray-700 truncate" data-testid="text-email">{profile.email || "—"}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-gray-500 text-sm">{t('auth.phone')}</Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="mt-1 border-gray-200"
                      data-testid="input-phone"
                    />
                  ) : (
                    <p className="text-gray-700" data-testid="text-phone">{profile.phone || "—"}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <Label className="text-gray-500 text-sm">{t('profile.city')}</Label>
                  {isEditing ? (
                    <Input
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="mt-1 border-gray-200"
                      data-testid="input-location"
                    />
                  ) : (
                    <p className="text-gray-700" data-testid="text-location">{profile.location || "—"}</p>
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
                  {t('profile.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
                  onClick={handleSave}
                  disabled={saveMutation.isPending}
                  data-testid="button-save"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('profile.save')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('profile.quickAccess')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-3 gap-3">
              <Link href="/gestion-demandes">
                <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" data-testid="link-demandes">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-[#722F37] font-medium text-center">{t('nav.requests')}</span>
                </div>
              </Link>
              <Link href="/atelier">
                <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" data-testid="link-projets">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <FolderKanban className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-[#722F37] font-medium text-center">{t('nav.projects')}</span>
                </div>
              </Link>
              <Link href="/portefeuille">
                <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" data-testid="link-planning">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-[#722F37] font-medium text-center">{t('nav.planning')}</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('profile.account')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-3">
              <Link href="/pro-profil/parametres">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  {t('pro.settings')}
                </Button>
              </Link>
              <Link href="/pro-profil/mot-de-passe">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                  data-testid="button-change-password"
                >
                  {t('profile.changePassword')}
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-start bg-white border border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => logout()}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {t('auth.logout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
