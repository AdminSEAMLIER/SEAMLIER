import { Home, Compass, MessageCircle, Ruler, BookOpen, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/dashboard-client" },
  { icon: Compass, labelKey: "nav.search", path: "/decouverte" },
  { icon: Ruler, labelKey: "nav.measures", path: "/mesures" },
  { icon: BookOpen, labelKey: "nav.magazine", path: "/magazine" },
  { icon: User, labelKey: "nav.profile", path: "/mon-profil" },
];

export function BottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-lg z-50 pb-safe lg:hidden"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/dashboard-client" && location.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                  isActive 
                    ? "text-[#722F37]" 
                    : "text-muted-foreground hover:text-foreground"
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
