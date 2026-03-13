import { Home, Compass, MessageCircle, User, Ruler, BookOpen } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { icon: Home, labelKey: "nav.home", path: "/dashboard-client" },
  { icon: Compass, labelKey: "nav.search", path: "/decouverte" },
  { icon: MessageCircle, labelKey: "nav.messages", path: "/messages", isMessages: true },
  { icon: Ruler, labelKey: "nav.measures", path: "/mesures" },
  { icon: BookOpen, labelKey: "nav.magazine", path: "/magazine" },
  { icon: User, labelKey: "nav.profile", path: "/mon-profil" },
];

export function BottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/conversations/unread-count"],
    refetchInterval: 5000,
    enabled: isAuthenticated,
  });
  const unreadCount = unreadData?.count || 0;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe lg:hidden"
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
                <div className="relative">
                  <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.isMessages && unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-[2px]"
                      data-testid="badge-unread-count"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
