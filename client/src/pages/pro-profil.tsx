import { useTranslation } from "react-i18next";
import { User, Mail, Phone, MapPin, Camera, Edit2, Euro, TrendingUp, Calendar, Star, Settings, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

export default function ProProfil() {
  const { t } = useTranslation();
  const [profile] = useState({
    fullName: "Sophie Marchand",
    businessName: "Atelier Sophie Couture",
    email: "sophie@ateliersophie.fr",
    phone: "06 12 34 56 78",
    location: "Paris 16e",
    specialties: ["Haute Couture", "Robes de mariée", "Sur-mesure"],
    rating: 4.9,
    reviewCount: 47,
    memberSince: "2024",
  });

  const revenueStats = [
    { label: t('pro.thisMonth'), value: "4,250€", trend: "+12%", icon: Euro },
    { label: t('pro.thisYear'), value: "38,500€", trend: "+25%", icon: TrendingUp },
    { label: t('pro.projectsCompleted'), value: "32", trend: "", icon: Calendar },
    { label: t('pro.averageRating'), value: "4.9", trend: "", icon: Star },
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
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-6 bg-white">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2 border-gray-100">
                  <AvatarImage src="" alt={profile.fullName} />
                  <AvatarFallback className="bg-[#722F37]/10 text-[#722F37] text-2xl font-medium">
                    SM
                  </AvatarFallback>
                </Avatar>
                <button 
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50"
                  data-testid="button-change-avatar"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h2 className="font-serif text-2xl text-[#722F37]">{profile.businessName}</h2>
                  <Badge className="bg-[#722F37]/10 text-[#722F37] border-none">Pro</Badge>
                </div>
                <p className="text-gray-600 mb-2">{profile.fullName}</p>
                <div className="flex items-center justify-center sm:justify-start gap-1 text-sm">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-medium">{profile.rating}</span>
                  <span className="text-gray-400">({profile.reviewCount} {t('tailor.reviews')})</span>
                </div>
              </div>

              <Button variant="outline" className="border-gray-200" data-testid="button-edit-profile">
                <Edit2 className="h-4 w-4 mr-2" />
                {t('profile.edit')}
              </Button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
              <div className="flex items-center gap-3 text-gray-600">
                <Mail className="h-4 w-4 text-[#722F37]" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <Phone className="h-4 w-4 text-[#722F37]" />
                <span>{profile.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-gray-600">
                <MapPin className="h-4 w-4 text-[#722F37]" />
                <span>{profile.location}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {profile.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="bg-gray-100 text-gray-700 border-none">
                  {specialty}
                </Badge>
              ))}
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
                    <stat.icon className="h-4 w-4 text-[#722F37]" />
                    <span className="text-sm text-gray-600">{stat.label}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#722F37]">{stat.value}</span>
                    {stat.trend && (
                      <span className="text-sm text-green-600">{stat.trend}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('pro.accountSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white space-y-2">
            <Button variant="ghost" className="w-full justify-start text-gray-700" data-testid="button-settings">
              <Settings className="h-4 w-4 mr-3" />
              {t('pro.settings')}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700" data-testid="button-notifications">
              {t('profile.notifications')}
            </Button>
            <Button variant="ghost" className="w-full justify-start text-gray-700" data-testid="button-password">
              {t('profile.changePassword')}
            </Button>
            <div className="pt-4 border-t border-gray-100">
              <Button variant="ghost" className="w-full justify-start text-red-600" data-testid="button-logout">
                <LogOut className="h-4 w-4 mr-3" />
                {t('auth.logout')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
