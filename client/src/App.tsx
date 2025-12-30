import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopHeader } from "@/components/desktop-header";
import NotFound from "@/pages/not-found";
import Discovery from "@/pages/discovery";
import SearchPage from "@/pages/search";
import Marketplace from "@/pages/marketplace";
import Messages from "@/pages/messages";
import Profile from "@/pages/profile";
import TailorProfile from "@/pages/tailor-profile";
import ProductDetail from "@/pages/product-detail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Discovery} />
      <Route path="/search" component={SearchPage} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/messages" component={Messages} />
      <Route path="/profile" component={Profile} />
      <Route path="/tailor/:id" component={TailorProfile} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <DesktopHeader />
          <main className="lg:pt-16">
            <Router />
          </main>
          <BottomNav />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
