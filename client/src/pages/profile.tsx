import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { 
  User, 
  Settings, 
  Heart, 
  ShoppingBag, 
  Calendar, 
  MapPin, 
  Mail, 
  Phone,
  ChevronRight,
  LogOut,
  Bell,
  HelpCircle,
  Shield
} from "lucide-react";
import type { User as UserType } from "@shared/schema";

const menuItems = [
  { icon: Heart, label: "Favoris", path: "/favorites" },
  { icon: ShoppingBag, label: "Mes commandes", path: "/orders" },
  { icon: Calendar, label: "Mes rendez-vous", path: "/appointments" },
  { icon: Bell, label: "Notifications", path: "/notifications" },
];

const settingsItems = [
  { icon: Settings, label: "Paramètres", path: "/settings" },
  { icon: Shield, label: "Confidentialité", path: "/privacy" },
  { icon: HelpCircle, label: "Aide & Support", path: "/help" },
];

export default function Profile() {
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/user/me"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 lg:pb-8 px-4 lg:px-6 py-6 bg-white">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-full skeleton-shimmer" />
            <div className="space-y-2">
              <div className="h-6 w-32 rounded skeleton-shimmer" />
              <div className="h-4 w-24 rounded skeleton-shimmer" />
            </div>
          </div>
          <div className="h-48 rounded-xl skeleton-shimmer" />
          <div className="h-32 rounded-xl skeleton-shimmer" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              Mon Profil
            </h1>
            <ThemeToggle />
          </div>

          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-4 border-white shadow-md">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-[#722F37] text-white text-2xl">
                {user?.fullName?.charAt(0) || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="font-semibold text-xl text-gray-900">
                {user?.fullName || "Utilisateur"}
              </h2>
              {user?.location && (
                <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
              {user?.role === "tailor" && (
                <span className="inline-block bg-[#722F37]/10 text-[#722F37] text-xs font-medium px-2 py-1 rounded-full mt-2">
                  Couturier
                </span>
              )}
            </div>
            
            <Button variant="outline" size="sm" className="border-gray-200" data-testid="button-edit-profile">
              Modifier
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl mx-auto">
        <Card className="mb-6 border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 space-y-3">
            {user?.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{user.email}</span>
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-700">{user.phone}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="mb-6 border-gray-100 shadow-sm overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </Card>

        <Card className="mb-6 border-gray-100 shadow-sm overflow-hidden">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            );
          })}
        </Card>

        <Button 
          variant="outline" 
          className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
