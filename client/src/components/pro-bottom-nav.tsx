import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { Home, FileText, FolderKanban, MessageSquare, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProBottomNav() {
  const { t } = useTranslation();
  const [location] = useLocation();

  const navItems = [
    { icon: Home, labelKey: "nav.proHome", href: "/professionnel" },
    { icon: FileText, labelKey: "nav.requests", href: "/professionnel/demandes" },
    { icon: FolderKanban, labelKey: "nav.projects", href: "/professionnel/projets" },
    { icon: MessageSquare, labelKey: "nav.messaging", href: "/professionnel/messagerie" },
    { icon: User, labelKey: "nav.profile", href: "/professionnel/profil" },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 shadow-lg z-50 pb-safe lg:hidden"
      data-testid="nav-bottom-pro"
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/professionnel" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                  isActive
                    ? "text-[#722F37]"
                    : "text-gray-700 hover:text-gray-900"
                )}
                data-testid={`nav-pro-${item.labelKey.split('.')[1]}`}
              >
                <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
