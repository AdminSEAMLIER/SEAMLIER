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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 lg:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = location === item.href || 
            (item.href !== "/professionnel" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full gap-1 px-2 transition-colors",
                  isActive
                    ? "text-[#722F37]"
                    : "text-gray-700"
                )}
                data-testid={`nav-pro-${item.labelKey.split('.')[1]}`}
              >
                <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
