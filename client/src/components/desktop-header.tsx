import { Home, Compass, MessageCircle, Ruler, BookOpen, User, FileText, FolderKanban, Calendar, ArrowLeftRight, Briefcase, Users, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "./language-toggle";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const particulierNavItems = [
  { icon: Home, labelKey: "nav.home", path: "/dashboard-client" },
  { icon: Compass, labelKey: "nav.search", path: "/decouverte" },
  { icon: MessageCircle, labelKey: "nav.messages", path: "/messages", isMessages: true },
  { icon: Ruler, labelKey: "nav.measures", path: "/mesures" },
  { icon: BookOpen, labelKey: "nav.magazine", path: "/magazine" },
  { icon: User, labelKey: "nav.profile", path: "/mon-profil" },
];

const proNavItems = [
  { icon: Home, labelKey: "nav.proHome", path: "/dashboard-pro" },
  { icon: FileText, labelKey: "nav.requests", path: "/gestion-demandes" },
  { icon: FolderKanban, labelKey: "nav.projects", path: "/atelier" },
  { icon: MessageCircle, labelKey: "nav.messaging", path: "/messagerie", isMessages: true },
  { icon: Calendar, labelKey: "nav.planning", path: "/portefeuille" },
  { icon: User, labelKey: "nav.profile", path: "/pro-profil" },
];

interface DesktopHeaderProps {
  mode?: "particulier" | "professionnel";
}

export function DesktopHeader({ mode = "particulier" }: DesktopHeaderProps) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const navItems = mode === "professionnel" ? proNavItems : particulierNavItems;
  const basePath = mode === "professionnel" ? "/dashboard-pro" : "/dashboard-client";
  
  const userInitials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U' : 'U';

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/conversations/unread-count"],
    refetchInterval: 5000,
    enabled: isAuthenticated,
  });
  const unreadCount = unreadData?.count || 0;

  return (
    <header 
      className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50"
      data-testid="header-desktop"
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Logo className="text-[#722F37] cursor-pointer" textClassName="text-base text-[#722F37]" />
          </Link>
          {mode === "professionnel" && (
            <Badge variant="secondary" className="bg-[#722F37]/10 text-[#722F37] border-none">Pro</Badge>
          )}
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== basePath && location.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link key={item.path} href={item.path}>
                <Button
                  variant="ghost"
                  className={cn(
                    "gap-2 text-foreground relative",
                    isActive && "bg-muted text-[#722F37]"
                  )}
                  data-testid={`nav-desktop-${item.labelKey.split('.')[1]}`}
                >
                  <div className="relative">
                    <Icon className="h-4 w-4" />
                    {item.isMessages && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-[2px]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </div>
                  <span>{t(item.labelKey)}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
          {isAuthenticated && user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || ''} />
                    <AvatarFallback className="bg-[#722F37] text-white text-xs">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-foreground">
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2 text-red-600 cursor-pointer"
                  onClick={() => logout()}
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
