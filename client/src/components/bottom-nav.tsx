import { Compass, Search, MessageCircle, ShoppingBag, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Compass, label: "Découverte", path: "/" },
  { icon: Search, label: "Recherche", path: "/search" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: ShoppingBag, label: "Boutique", path: "/marketplace" },
  { icon: User, label: "Profil", path: "/profile" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t border-border shadow-lg z-50 pb-safe lg:hidden"
      data-testid="nav-bottom"
    >
      <div className="flex items-center justify-around h-full max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location === item.path || 
            (item.path !== "/" && location.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <div className="relative">
                  <Icon className="h-6 w-6" strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full" />
                  )}
                </div>
                <span className="text-nav-label">{item.label}</span>
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
