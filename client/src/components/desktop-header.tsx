import { Compass, Search, MessageCircle, ShoppingBag, User, Bell, Scissors } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: Compass, label: "Découverte", path: "/" },
  { icon: Search, label: "Recherche", path: "/search" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: ShoppingBag, label: "Boutique", path: "/marketplace" },
];

export function DesktopHeader() {
  const [location] = useLocation();

  return (
    <header 
      className="hidden lg:flex fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-50"
      data-testid="header-desktop"
    >
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold">L'art de coudre</span>
          </div>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = location === item.path || 
              (item.path !== "/" && location.startsWith(item.path));
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
          <ThemeToggle />
          <Button variant="ghost" size="icon" data-testid="button-notifications">
            <Bell className="h-5 w-5" />
          </Button>
          <Link href="/profile">
            <Button variant="ghost" size="icon" data-testid="button-profile-desktop">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
