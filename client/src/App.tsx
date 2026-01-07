import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopHeader } from "@/components/desktop-header";
import { ProBottomNav } from "@/components/pro-bottom-nav";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Discovery from "@/pages/discovery";
import Messages from "@/pages/messages";
import Mesures from "@/pages/mesures";
import Magazine from "@/pages/magazine";
import TailorProfile from "@/pages/tailor-profile";
import ProductDetail from "@/pages/product-detail";
import ProDashboard from "@/pages/pro-dashboard";
import InscriptionParticulier from "@/pages/inscription-particulier";

function ParticulierLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader mode="particulier" />
      <main className="lg:pt-16">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

function ProfessionnelLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader mode="professionnel" />
      <main className="lg:pt-16">
        {children}
      </main>
      <ProBottomNav />
    </>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/inscription-particulier" component={InscriptionParticulier} />
      
      <Route path="/particulier">
        <ParticulierLayout>
          <Home />
        </ParticulierLayout>
      </Route>
      <Route path="/particulier/decouverte">
        <ParticulierLayout>
          <Discovery />
        </ParticulierLayout>
      </Route>
      <Route path="/particulier/messages">
        <ParticulierLayout>
          <Messages />
        </ParticulierLayout>
      </Route>
      <Route path="/particulier/mesures">
        <ParticulierLayout>
          <Mesures />
        </ParticulierLayout>
      </Route>
      <Route path="/particulier/magazine">
        <ParticulierLayout>
          <Magazine />
        </ParticulierLayout>
      </Route>
      <Route path="/particulier/tailor/:id">
        {(params) => (
          <ParticulierLayout>
            <TailorProfile />
          </ParticulierLayout>
        )}
      </Route>
      <Route path="/particulier/product/:id">
        {(params) => (
          <ParticulierLayout>
            <ProductDetail />
          </ParticulierLayout>
        )}
      </Route>

      <Route path="/professionnel">
        <ProfessionnelLayout>
          <ProDashboard />
        </ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/messages">
        <ProfessionnelLayout>
          <Messages />
        </ProfessionnelLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-background">
          <Router />
        </div>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
