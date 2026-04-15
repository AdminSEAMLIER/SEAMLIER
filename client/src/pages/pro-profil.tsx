import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { User, Mail, Phone, MapPin, Camera, Edit2, Save, LogOut, TrendingUp, Star, Settings, FileText, FolderKanban, Loader2, Briefcase, ImageIcon, XCircle, Clock } from "lucide-react";
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
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerUrl, setBannerUrl] = useState<string>("");
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

  const { data: dbProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/users/me"],
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
  });

  const isLoading = authLoading || profileLoading;

  useEffect(() => {
    if (tailorProfile?.coverImageUrl) setBannerUrl(tailorProfile.coverImageUrl);
  }, [tailorProfile]);

  useEffect(() => {
    const source = dbProfile || user;
    if (source) {
      setProfile({
        firstName: source.firstName || "",
        lastName: source.lastName || "",
        email: source.email || "",
        phone: source.phone || "",
        location: source.location || "",
        profileImageUrl: source.profileImageUrl || "",
      });
    }
  }, [dbProfile, user]);

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
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      setIsEditing(false);
      toast({
        title: t('profile.updated'),
        description: t('profile.updatedDesc'),
      });
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de sauvegarder le profil",
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
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
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
        toast({ title: t('profile.imageTooLarge'), description: t('profile.imageTooLargeDesc'), variant: "destructive" });
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

  const bannerSaveMutation = useMutation({
    mutationFn: async (base64: string) => {
      return apiRequest('PATCH', `/api/user/me/tailor`, { coverImageUrl: base64 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/me/tailor'] });
      toast({ title: "Bannière mise à jour" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder la bannière", variant: "destructive" }),
  });

  const handleBannerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Image trop lourde", description: "Max 8 Mo", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setBannerUrl(base64);
      bannerSaveMutation.mutate(base64);
    };
    reader.readAsDataURL(file);
  };

  const [isAddingPortfolio, setIsAddingPortfolio] = useState(false);
  const [newPortfolioTitle, setNewPortfolioTitle] = useState("");
  const [newPortfolioCategory, setNewPortfolioCategory] = useState("");
  const [newPortfolioImage, setNewPortfolioImage] = useState<string>("");
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const { data: portfolioItems = [], isLoading: portfolioLoading } = useQuery<any[]>({
    queryKey: ["/api/tailors/portfolio"],
    enabled: !!user,
  });

  const addPortfolioMutation = useMutation({
    mutationFn: async (data: { imageUrl: string; title: string; category?: string }) => {
      const res = await apiRequest("POST", "/api/portfolio", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailors/portfolio"] });
      if (tailorProfile?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/tailors", tailorProfile.id, "portfolio"] });
      }
      setIsAddingPortfolio(false);
      setNewPortfolioTitle("");
      setNewPortfolioCategory("");
      setNewPortfolioImage("");
      toast({ title: "Photo ajoutée !", description: "Votre portfolio a été mis à jour." });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible d'ajouter la photo.", variant: "destructive" }),
  });

  const deletePortfolioMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/portfolio/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailors/portfolio"] });
      if (tailorProfile?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/tailors", tailorProfile.id, "portfolio"] });
      }
      toast({ title: "Photo supprimée" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer la photo.", variant: "destructive" }),
  });

  const handlePortfolioImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Image trop lourde", description: "Max 8 Mo", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setNewPortfolioImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddPortfolio = () => {
    if (!newPortfolioImage) {
      toast({ title: "Image requise", description: "Veuillez sélectionner une photo.", variant: "destructive" });
      return;
    }
    if (!newPortfolioTitle.trim()) {
      toast({ title: "Titre requis", description: "Veuillez donner un titre.", variant: "destructive" });
      return;
    }
    addPortfolioMutation.mutate({
      imageUrl: newPortfolioImage,
      title: newPortfolioTitle.trim(),
      category: newPortfolioCategory.trim() || undefined,
    });
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
        <Loader2 className="h-8 w-8 animate-spin text-[#601B28]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pb-20 lg:pb-8 bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vous devez être connecté pour accéder à votre profil.</p>
          <Link href="/connexion">
            <Button className="bg-[#601B28]" data-testid="button-go-login">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      {/* Bannière */}
      <div className="relative h-44 bg-gray-200 overflow-hidden">
        {bannerUrl ? (
          <img src={bannerUrl} alt="Bannière" className="w-full h-full object-cover" />
        ) : (
          <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=400&fit=crop" alt="Bannière" className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <input
          type="file"
          ref={bannerInputRef}
          onChange={handleBannerChange}
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          data-testid="input-banner-file"
        />
        <button
          onClick={() => bannerInputRef.current?.click()}
          className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white text-gray-700 rounded-full text-xs font-medium shadow"
          data-testid="button-change-banner"
        >
          {bannerSaveMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          Changer la bannière
        </button>
        <div className="absolute bottom-3 left-4">
          <h1 className="font-serif text-2xl text-white drop-shadow">{t('nav.profile')}</h1>
        </div>
      </div>

      <div className="bg-gray-50 border-b border-gray-100 hidden">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <User className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">
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
                  <AvatarFallback className="bg-[#601B28]/10 text-[#601B28] text-2xl font-medium">
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
                  <h2 className="font-serif text-xl text-[#601B28]" data-testid="text-profile-name">{fullName || "—"}</h2>
                  <Badge className="bg-[#601B28]/10 text-[#601B28] border-none">
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
            <CardTitle className="text-lg text-[#601B28]">{t('profile.personalInfo')}</CardTitle>
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
                  className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
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
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-3">
            <CardTitle className="text-lg text-[#601B28] flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Mon Portfolio
            </CardTitle>
            <Button
              size="sm"
              className="bg-[#601B28] hover:bg-[#4E1522] text-white gap-1"
              onClick={() => setIsAddingPortfolio(!isAddingPortfolio)}
              data-testid="button-add-portfolio"
            >
              <Camera className="h-4 w-4" />
              Ajouter
            </Button>
          </CardHeader>
          <CardContent className="bg-white">
            {isAddingPortfolio && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 space-y-3">
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-[#601B28] transition-colors"
                  onClick={() => portfolioInputRef.current?.click()}
                >
                  {newPortfolioImage ? (
                    <img src={newPortfolioImage} alt="preview" className="w-full h-40 object-cover rounded-lg" />
                  ) : (
                    <div className="py-4">
                      <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Cliquez pour sélectionner une photo</p>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 8 Mo</p>
                    </div>
                  )}
                  <input
                    ref={portfolioInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePortfolioImageChange}
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-1 block">Titre *</Label>
                  <Input
                    placeholder="Ex: Robe de soirée sur mesure"
                    value={newPortfolioTitle}
                    onChange={(e) => setNewPortfolioTitle(e.target.value)}
                    data-testid="input-portfolio-title"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-700 mb-1 block">Catégorie</Label>
                  <Input
                    placeholder="Ex: Robe, Costume, Retouche…"
                    value={newPortfolioCategory}
                    onChange={(e) => setNewPortfolioCategory(e.target.value)}
                    data-testid="input-portfolio-category"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
                    onClick={handleAddPortfolio}
                    disabled={addPortfolioMutation.isPending}
                    data-testid="button-save-portfolio"
                  >
                    {addPortfolioMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Publier"}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-200"
                    onClick={() => { setIsAddingPortfolio(false); setNewPortfolioImage(""); setNewPortfolioTitle(""); setNewPortfolioCategory(""); }}
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            )}

            {portfolioLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-[#601B28]" />
              </div>
            ) : portfolioItems.length === 0 && !isAddingPortfolio ? (
              <div className="text-center py-8 text-gray-400">
                <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Votre portfolio est vide.</p>
                <p className="text-xs mt-1">Ajoutez des photos de vos créations.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {portfolioItems.map((item: any) => (
                  <div key={item.id} className="relative group rounded-lg overflow-hidden aspect-square bg-gray-100" data-testid={`portfolio-item-${item.id}`}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                      <p className="text-white text-xs font-medium text-center line-clamp-2">{item.title}</p>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7 bg-red-500/90"
                        onClick={() => deletePortfolioMutation.mutate(item.id)}
                        disabled={deletePortfolioMutation.isPending}
                        data-testid={`button-delete-portfolio-${item.id}`}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#601B28]">{t('profile.quickAccess')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-3 gap-3">
              <Link href="/gestion-demandes">
                <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" data-testid="link-demandes">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-[#601B28]" />
                  </div>
                  <span className="text-sm text-[#601B28] font-medium text-center">{t('nav.requests')}</span>
                </div>
              </Link>
              <Link href="/atelier">
                <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" data-testid="link-projets">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <FolderKanban className="h-5 w-5 text-[#601B28]" />
                  </div>
                  <span className="text-sm text-[#601B28] font-medium text-center">{t('nav.projects')}</span>
                </div>
              </Link>
              <Link href="/portefeuille">
                <div className="flex flex-col items-center p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer" data-testid="link-planning">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-[#601B28]" />
                  </div>
                  <span className="text-sm text-[#601B28] font-medium text-center">{t('nav.planning')}</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#601B28]">{t('profile.account')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="space-y-3">
              <Link href="/pro/horaires">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white border border-[#601B28]/30 text-[#601B28] hover:bg-[#601B28]/5"
                  data-testid="button-horaires"
                >
                  <Clock className="h-4 w-4 mr-3" />
                  Horaires de travail
                </Button>
              </Link>
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
