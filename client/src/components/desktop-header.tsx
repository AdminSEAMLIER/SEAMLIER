import { Home, Compass, MessageCircle, Ruler, BookOpen, User, Bell, LayoutDashboard, ArrowLeft } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";

const particulierNavItems = [
  { icon: Home, label: "Accueil", path: "/particulier" },
  { icon: Compass, label: "Découverte", path: "/particulier/decouverte" },
  { icon: Ruler, label: "Mesures", path: "/particulier/mesures" },
  { icon: BookOpen, label: "Magazine", path: "/particulier/magazine" },
  { icon: User, label: "Profil", path: "/particulier/profil" },
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
  const basePath = mode === "professionnel" ? "/professionnel" : "/particulier";

  return (
    <header 
      className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-50"
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
                    "gap-2",
                    isActive && "bg-gray-100 text-[#722F37]"
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
            <Button variant="ghost" size="sm" className="gap-2 text-gray-600" data-testid="button-switch-space">
              <ArrowLeft className="h-4 w-4" />
              Accueil
            </Button>
          </Link>
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="text-gray-600" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
