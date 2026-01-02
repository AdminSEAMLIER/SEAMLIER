import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <div className="min-h-screen pb-20 lg:pb-8 px-4 lg:px-6 py-6">
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
    <div className="min-h-screen pb-20 lg:pb-8">
      <div className="px-4 lg:px-6 py-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl lg:text-3xl text-[#722F37]">
            Mon Profil
          </h1>
          <ThemeToggle />
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user?.fullName?.charAt(0) || <User className="h-8 w-8" />}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h2 className="font-semibold text-lg">
                {user?.fullName || "Utilisateur"}
              </h2>
              {user?.location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{user.location}</span>
                </div>
              )}
              {user?.role === "tailor" && (
                <Badge variant="secondary" className="mt-2">
                  Couturier
                </Badge>
              )}
            </div>
            
            <Button variant="outline" size="sm" data-testid="button-edit-profile">
              Modifier
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            {user?.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            )}
            {user?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{user.phone}</span>
              </div>
            )}
          </div>
        </Card>

        <Card className="mb-6 overflow-hidden">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 text-left"
                data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
                    <Icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </Card>

        <Card className="mb-6 overflow-hidden">
          {settingsItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                className="w-full flex items-center justify-between p-4 hover-elevate active-elevate-2 text-left"
                data-testid={`menu-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </Card>

        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </div>
  );
}
