import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Home, FileText, FolderKanban, MessageSquare, BarChart2, User, FolderOpen } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export function ProBottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/conversations/unread-count"],
    refetchInterval: 15000,
    enabled: isAuthenticated,
  });
  const unreadCount = unreadData?.count || 0;

  const navItems = [
    { icon: Home, labelKey: "nav.proHome", href: "/dashboard-pro" },
    { icon: FileText, labelKey: "nav.requests", href: "/gestion-demandes" },
    { icon: FolderKanban, labelKey: "nav.projects", href: "/atelier" },
    { icon: MessageSquare, labelKey: "nav.messaging", href: "/messagerie", isMessages: true },
    { icon: BarChart2, labelKey: "nav.stats", href: "/pro-statistiques" },
    { icon: FolderOpen, labelKey: "nav.dossier", href: "/pro-dossier" },
    { icon: User, labelKey: "nav.profile", href: "/pro-profil" },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-200 shadow-lg z-50 pb-safe lg:hidden"
      data-testid="nav-bottom-pro"
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/dashboard-pro" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-12 h-full transition-colors",
                  isActive
                    ? "text-[#601B28]"
                    : "text-gray-700 hover:text-gray-900"
                )}
                data-testid={`nav-pro-${item.labelKey.split('.')[1]}`}
              >
                <div className="relative">
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  {item.isMessages && unreadCount > 0 && (
                    <span
                      className="absolute -top-1 -right-1 min-w-[14px] h-[14px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-[2px]"
                      data-testid="badge-pro-unread-count"
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
