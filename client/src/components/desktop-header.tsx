import { Compass, Search, MessageCircle, ShoppingBag, User, Bell, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoImage from "@assets/logo.png";

const particulierNavItems = [
  { icon: Compass, label: "Découverte", path: "/particulier" },
  { icon: Search, label: "Recherche", path: "/particulier/search" },
  { icon: MessageCircle, label: "Messages", path: "/particulier/messages" },
  { icon: ShoppingBag, label: "Boutique", path: "/particulier/marketplace" },
];

const proNavItems = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/professionnel" },
  { icon: MessageCircle, label: "Messages", path: "/professionnel/messages" },
];

interface DesktopHeaderProps {
  mode?: "particulier" | "professionnel";
}

export function DesktopHeader({ mode = "particulier" }: DesktopHeaderProps) {
  const [location] = useLocation();
  const navItems = mode === "professionnel" ? proNavItems : particulierNavItems;
  const profilePath = mode === "professionnel" ? "/professionnel/profile" : "/particulier/profile";
  const basePath = mode === "professionnel" ? "/professionnel" : "/particulier";

  return (
    <header 
      className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50"
      data-testid="header-desktop"
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
        <div className="flex items-center gap-4">
          <Link href="/">
            <div className="bg-[#b8b4af] rounded-lg p-1.5 shadow-sm cursor-pointer">
              <img src={logoImage} alt="L'art de coudre" className="h-12 w-auto" style={{ mixBlendMode: 'multiply' }} />
            </div>
          </Link>
          {mode === "professionnel" && (
            <Badge variant="secondary">Pro</Badge>
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
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "gap-2",
                    isActive && "bg-accent"
                  )}
                  data-testid={`nav-desktop-${item.label.toLowerCase()}`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2" data-testid="button-switch-space">
              <ArrowLeft className="h-4 w-4" />
              Changer d'espace
            </Button>
          </Link>
          <ThemeToggle />
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Link href={profilePath}>
            <Button variant="ghost" size="icon" data-testid="button-profile-desktop">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
