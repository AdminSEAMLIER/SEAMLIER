import { Compass, Search, MessageCircle, ShoppingBag, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Compass, label: "Découverte", path: "/particulier" },
  { icon: Search, label: "Recherche", path: "/particulier/search" },
  { icon: MessageCircle, label: "Messages", path: "/particulier/messages" },
  { icon: ShoppingBag, label: "Boutique", path: "/particulier/marketplace" },
  { icon: User, label: "Profil", path: "/particulier/profile" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100 shadow-lg z-50 pb-safe lg:hidden"
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
                    : "text-gray-400 hover:text-gray-600"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
