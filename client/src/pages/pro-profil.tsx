import { useState, useRef } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { User, Mail, Phone, MapPin, Camera, Edit2, Save, LogOut, Euro, TrendingUp, Star, Settings, FileText, FolderKanban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

export default function ProProfil() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    fullName: "Sophie Marchand",
    businessName: "Atelier Sophie Couture",
    email: "sophie@ateliersophie.fr",
    phone: "06 12 34 56 78",
    location: "Paris 16e",
    specialties: ["Haute Couture", "Robes de mariée", "Sur-mesure"],
    avatarUrl: "",
  });

  const handleSave = () => {
    setIsEditing(false);
    toast({
      title: t('profile.updated'),
      description: t('profile.updatedDesc'),
    });
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

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
        setProfile({ ...profile, avatarUrl: reader.result as string });
        toast({
          title: t('profile.photoUpdated'),
          description: t('profile.photoUpdatedDesc'),
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const revenueStats = [
    { label: t('pro.thisMonth'), value: "4,250€", trend: "+12%" },
    { label: t('pro.thisYear'), value: "38,500€", trend: "+25%" },
  ];

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
                  <AvatarImage src={profile.avatarUrl} alt={profile.fullName} />
                  <AvatarFallback className="bg-[#722F37]/10 text-[#722F37] text-2xl font-medium">
                    {getInitials(profile.fullName)}
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
                  <h2 className="font-serif text-xl text-[#722F37]">{profile.businessName}</h2>
                  <Badge className="bg-[#722F37]/10 text-[#722F37] border-none">Pro</Badge>
                </div>
                <p className="text-gray-600 mb-2">{profile.fullName}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">4.9</span>
                  <span className="text-gray-400">(47 {t('tailor.reviews')})</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#722F37]">32</p>
                  <p className="text-sm text-gray-500">{t('pro.projectsCompleted')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-[#722F37]">4.9</p>
                  <p className="text-sm text-gray-500">{t('pro.averageRating')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('pro.revenue')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-2 gap-4">
              {revenueStats.map((stat) => (
                <div key={stat.label} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Euro className="h-4 w-4 text-[#722F37]" />
                    <span className="text-sm text-gray-600">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-[#722F37]">{stat.value}</span>
                    <span className="text-sm text-green-600">{stat.trend}</span>
                  </div>
                </div>
              ))}
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
                    <p className="text-gray-700 truncate">{profile.email}</p>
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
                    <p className="text-gray-700">{profile.phone}</p>
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
                  {t('profile.cancel')}
                </Button>
                <Button 
                  className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
                  onClick={handleSave}
                  data-testid="button-save"
                >
                  <Save className="h-4 w-4 mr-2" />
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
              <Link href="/professionnel/demandes">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid="link-demandes">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-gray-600 text-center">{t('nav.requests')}</span>
                </div>
              </Link>
              <Link href="/professionnel/projets">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid="link-projets">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                    <FolderKanban className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-gray-600 text-center">{t('nav.projects')}</span>
                </div>
              </Link>
              <Link href="/professionnel/planning">
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid="link-planning">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <span className="text-sm text-gray-600 text-center">{t('nav.planning')}</span>
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
              <Link href="/professionnel/parametres">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                  data-testid="button-settings"
                >
                  <Settings className="h-4 w-4 mr-3" />
                  {t('pro.settings')}
                </Button>
              </Link>
              <Link href="/professionnel/profil/mot-de-passe">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                  data-testid="button-change-password"
                >
                  {t('profile.changePassword')}
                </Button>
              </Link>
              <Link href="/professionnel/profil/notifications">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border border-gray-200 text-gray-600"
                  data-testid="button-notifications"
                >
                  {t('profile.notifications')}
                </Button>
              </Link>
              <Link href="/">
                <Button 
                  variant="outline" 
                  className="w-full justify-start bg-white border border-red-200 text-red-600 hover:bg-red-50"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('auth.logout')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
