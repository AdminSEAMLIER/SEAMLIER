import { Home, Compass, MessageCircle, Ruler, BookOpen, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/particulier" },
  { icon: Compass, labelKey: "nav.search", path: "/particulier/decouverte" },
  { icon: Ruler, labelKey: "nav.measures", path: "/particulier/mesures" },
  { icon: BookOpen, labelKey: "nav.magazine", path: "/particulier/magazine" },
  { icon: User, labelKey: "nav.profile", path: "/particulier/profil" },
];

export function BottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border shadow-lg z-50 pb-safe lg:hidden"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/particulier" && location.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                  isActive 
                    ? "text-[#722F37]" 
                    : "text-gray-700 hover:text-gray-900"
                )}
                data-testid={`nav-${item.labelKey.split('.')[1]}`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
