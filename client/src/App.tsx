import { Switch, Route, Link, useLocation, Redirect } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNav } from "@/components/bottom-nav";
import { DesktopHeader } from "@/components/desktop-header";
import { ProBottomNav } from "@/components/pro-bottom-nav";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Discovery from "@/pages/discovery";
import Messages from "@/pages/messages";
import Mesures from "@/pages/mesures";
import Magazine from "@/pages/magazine";
import MagazineDetail from "@/pages/magazine-detail";
import AdminDashboard from "@/pages/admin-magazine";
import TailorProfile from "@/pages/tailor-profile";
import ProductDetail from "@/pages/product-detail";
import ProDashboard from "@/pages/pro-dashboard";
import ProDemandes from "@/pages/pro-demandes";
import ProProjets from "@/pages/pro-projets";
import ProMessagerie from "@/pages/pro-messagerie";
import ProPlanning from "@/pages/pro-planning";
import ProProfil from "@/pages/pro-profil";
import InscriptionParticulier from "@/pages/inscription-particulier";
import Recherche from "@/pages/recherche";
import CouturierProfile from "@/pages/couturier-profile";
import InscriptionProfessionnel from "@/pages/inscription-professionnel";
import Inscription from "@/pages/inscription";
import ProfilParticulier from "@/pages/profil-particulier";
import Connexion from "@/pages/connexion";
import ConnexionParticulier from "@/pages/connexion-particulier";
import ConnexionProfessionnel from "@/pages/connexion-professionnel";
import MentionsLegales from "@/pages/mentions-legales";
import Confidentialite from "@/pages/confidentialite";
import CGV from "@/pages/cgv";
import ModifierMotDePasse from "@/pages/modifier-mot-de-passe";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import PreferencesNotifications from "@/pages/preferences-notifications";
import ProParametres from "@/pages/pro-parametres";
import ProModifierMotDePasse from "@/pages/pro-modifier-mot-de-passe";
import ProNotifications from "@/pages/pro-notifications";
import ProSetup from "@/pages/pro-setup";
import MesProjets from "@/pages/mes-projets";
import DashboardClient from "@/pages/dashboard-client";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [location]);
  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/connexion" />;
  }

  return <>{children}</>;
}

function MobileHeader() {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-10" />
      <Link href="/dashboard-client">
        <Logo className="text-[#722F37]" textClassName="text-[#722F37]" />
      </Link>
      <LanguageToggle />
    </div>
  );
}

function ProMobileHeader() {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
      <Link href="/dashboard-pro">
        <div className="flex items-center gap-2">
          <Logo className="text-[#722F37]" textClassName="text-[#722F37]" />
          <Badge
            variant="secondary"
            className="bg-[#722F37] text-white border-none text-[10px]"
          >
            Pro
          </Badge>
        </div>
      </Link>
      <LanguageToggle />
    </div>
  );
}

function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white min-h-screen text-black">
      <DesktopHeader mode="particulier" />
      <MobileHeader />
      <main className="lg:pt-16 pb-20 lg:pb-0">{children}</main>
      <BottomNav />
    </div>
  );
}

function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white min-h-screen text-black">
      <DesktopHeader mode="professionnel" />
      <ProMobileHeader />
      <main className="lg:pt-16 pb-20 lg:pb-0">{children}</main>
      <ProBottomNav />
    </div>
  );
}

function HomeRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin mb-4" />
      </div>
    );
  }
  if (isAuthenticated && user) {
    if (user.role === "admin") return <Redirect to="/admin/dashboard" />;
    if (user.role === "tailor") return <Redirect to="/dashboard-pro" />;
    return <Redirect to="/dashboard-client" />;
  }
  return <Landing />;
}

function ClientRoutes() {
  return (
    <ProtectedRoute>
      <ClientLayout>
        <ScrollToTop />
        <Switch>
          <Route path="/dashboard-client" component={DashboardClient} />
          <Route path="/decouverte" component={Discovery} />
          <Route path="/mesures" component={Mesures} />
          <Route path="/magazine/:id" component={MagazineDetail} />
          <Route path="/magazine" component={Magazine} />
          <Route path="/messages" component={Messages} />
          <Route path="/mon-profil/mot-de-passe" component={ModifierMotDePasse} />
          <Route path="/mon-profil/notifications" component={PreferencesNotifications} />
          <Route path="/mon-profil" component={ProfilParticulier} />
          <Route path="/tailor/:id" component={TailorProfile} />
          <Route path="/product/:id" component={ProductDetail} />
          <Route path="/suivi-projet/:id" component={MesProjets} />
          <Route path="/mes-projets" component={MesProjets} />
        </Switch>
      </ClientLayout>
    </ProtectedRoute>
  );
}

function ProRoutes() {
  return (
    <ProtectedRoute>
      <ProLayout>
        <ScrollToTop />
        <Switch>
          <Route path="/dashboard-pro/setup" component={ProSetup} />
          <Route path="/dashboard-pro" component={ProDashboard} />
          <Route path="/gestion-demandes" component={ProDemandes} />
          <Route path="/atelier/:id" component={ProProjets} />
          <Route path="/atelier" component={ProProjets} />
          <Route path="/messagerie" component={ProMessagerie} />
          <Route path="/vitrine-pro" component={ProProfil} />
          <Route path="/portefeuille" component={ProPlanning} />
          <Route path="/pro-profil/mot-de-passe" component={ProModifierMotDePasse} />
          <Route path="/pro-profil/notifications" component={ProNotifications} />
          <Route path="/pro-profil/parametres" component={ProParametres} />
          <Route path="/pro-profil" component={ProProfil} />
        </Switch>
      </ProLayout>
    </ProtectedRoute>
  );
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={HomeRoute} />
      <Route path="/connexion" component={Connexion} />
      <Route path="/connexion/particulier" component={ConnexionParticulier} />
      <Route path="/connexion/professionnel" component={ConnexionProfessionnel} />
      <Route path="/mot-de-passe-oublie" component={ForgotPassword} />
      <Route path="/reinitialiser-mot-de-passe" component={ResetPassword} />
      <Route path="/inscription" component={Inscription} />
      <Route path="/inscription/particulier" component={InscriptionParticulier} />
      <Route path="/inscription/professionnel" component={InscriptionProfessionnel} />
      <Route path="/recherche" component={Recherche} />
      <Route path="/profil-pro/:id" component={CouturierProfile} />
      <Route path="/mentions-legales" component={MentionsLegales} />
      <Route path="/confidentialite" component={Confidentialite} />
      <Route path="/cgv" component={CGV} />

      {/* Legacy redirects */}
      <Route path="/particulier">
        <Redirect to="/inscription/particulier" />
      </Route>
      <Route path="/professionnel">
        <Redirect to="/inscription/professionnel" />
      </Route>
      <Route path="/couturier/:id">
        {(params: any) => <Redirect to={`/profil-pro/${params.id}`} />}
      </Route>

      {/* Client routes — all share persistent ClientRoutes layout */}
      <Route path="/dashboard-client" component={ClientRoutes} />
      <Route path="/decouverte" component={ClientRoutes} />
      <Route path="/mesures" component={ClientRoutes} />
      <Route path="/magazine/:id" component={ClientRoutes} />
      <Route path="/magazine" component={ClientRoutes} />
      <Route path="/messages" component={ClientRoutes} />
      <Route path="/mon-profil/mot-de-passe" component={ClientRoutes} />
      <Route path="/mon-profil/notifications" component={ClientRoutes} />
      <Route path="/mon-profil" component={ClientRoutes} />
      <Route path="/tailor/:id" component={ClientRoutes} />
      <Route path="/product/:id" component={ClientRoutes} />
      <Route path="/suivi-projet/:id" component={ClientRoutes} />
      <Route path="/mes-projets" component={ClientRoutes} />

      {/* Pro routes — all share persistent ProRoutes layout */}
      <Route path="/dashboard-pro/setup" component={ProRoutes} />
      <Route path="/dashboard-pro" component={ProRoutes} />
      <Route path="/gestion-demandes" component={ProRoutes} />
      <Route path="/atelier/:id" component={ProRoutes} />
      <Route path="/atelier" component={ProRoutes} />
      <Route path="/messagerie" component={ProRoutes} />
      <Route path="/vitrine-pro" component={ProRoutes} />
      <Route path="/portefeuille" component={ProRoutes} />
      <Route path="/pro-profil/mot-de-passe" component={ProRoutes} />
      <Route path="/pro-profil/notifications" component={ProRoutes} />
      <Route path="/pro-profil/parametres" component={ProRoutes} />
      <Route path="/pro-profil" component={ProRoutes} />

      {/* Admin routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/seamlier" component={AdminDashboard} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-white text-black selection:bg-black/10">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
