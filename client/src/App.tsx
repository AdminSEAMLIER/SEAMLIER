import { Switch, Route, Link, useLocation, Redirect } from "wouter";
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
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
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
import MentionsLegales from "@/pages/mentions-legales";
import Confidentialite from "@/pages/confidentialite";
import CGV from "@/pages/cgv";
import ModifierMotDePasse from "@/pages/modifier-mot-de-passe";
import PreferencesNotifications from "@/pages/preferences-notifications";
import ProParametres from "@/pages/pro-parametres";
import ProModifierMotDePasse from "@/pages/pro-modifier-mot-de-passe";
import ProNotifications from "@/pages/pro-notifications";
import ProSetup from "@/pages/pro-setup";
import Marketplace from "@/pages/marketplace";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#722F37] border-t-transparent rounded-full animate-spin" />
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
      <Link href="/particulier/accueil">
        <Logo className="text-[#722F37]" textClassName="text-[#722F37]" />
      </Link>
      <LanguageToggle />
    </div>
  );
}

function ProMobileHeader() {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
      <Link href="/professionnel/dashboard">
        <div className="flex items-center gap-2">
          <Logo className="text-[#722F37]" textClassName="text-[#722F37]" />
          <Badge variant="secondary" className="bg-[#722F37]/10 text-[#722F37] border-none text-[10px]">Pro</Badge>
        </div>
      </Link>
      <LanguageToggle />
    </div>
  );
}

function ParticulierLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader mode="particulier" />
      <MobileHeader />
      <main className="lg:pt-16 pb-20 lg:pb-0">
        {children}
      </main>
      <BottomNav />
    </>
  );
}

function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader mode="professionnel" />
      <ProMobileHeader />
      <main className="lg:pt-16 pb-20 lg:pb-0">
        {children}
      </main>
      <ProBottomNav />
    </>
  );
}

function Router() {
  return (
    <Switch>
      {/* ===== PAGES PUBLIQUES ===== */}
      <Route path="/" component={Landing} />
      <Route path="/connexion" component={Connexion} />
      <Route path="/inscription" component={Inscription} />
      <Route path="/particulier" component={InscriptionParticulier} />
      <Route path="/professionnel" component={InscriptionProfessionnel} />
      <Route path="/recherche" component={Recherche} />
      <Route path="/couturier/:id" component={CouturierProfile} />
      <Route path="/mentions-legales" component={MentionsLegales} />
      <Route path="/confidentialite" component={Confidentialite} />
      <Route path="/cgv" component={CGV} />

      {/* ===== ESPACE PARTICULIER (protégé) ===== */}
      <Route path="/particulier/accueil">
        <ProtectedRoute><ParticulierLayout><Home /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/decouverte">
        <ProtectedRoute><ParticulierLayout><Discovery /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/mesures">
        <ProtectedRoute><ParticulierLayout><Mesures /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/magazine">
        <ProtectedRoute><ParticulierLayout><Magazine /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/magazine/:id">
        <ProtectedRoute><ParticulierLayout><MagazineDetail /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/marketplace">
        <ProtectedRoute><ParticulierLayout><Marketplace /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/messages">
        <ProtectedRoute><ParticulierLayout><Messages /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/profil">
        <ProtectedRoute><ParticulierLayout><ProfilParticulier /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/profil/mot-de-passe">
        <ProtectedRoute><ParticulierLayout><ModifierMotDePasse /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/profil/notifications">
        <ProtectedRoute><ParticulierLayout><PreferencesNotifications /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/tailor/:id">
        <ProtectedRoute><ParticulierLayout><TailorProfile /></ParticulierLayout></ProtectedRoute>
      </Route>
      <Route path="/particulier/product/:id">
        <ProtectedRoute><ParticulierLayout><ProductDetail /></ParticulierLayout></ProtectedRoute>
      </Route>

      {/* ===== ESPACE PROFESSIONNEL (protégé) ===== */}
      <Route path="/professionnel/dashboard">
        <ProtectedRoute><ProLayout><ProDashboard /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/setup">
        <ProtectedRoute><ProLayout><ProSetup /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/demandes">
        <ProtectedRoute><ProLayout><ProDemandes /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/projets">
        <ProtectedRoute><ProLayout><ProProjets /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/messagerie">
        <ProtectedRoute><ProLayout><ProMessagerie /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/planning">
        <ProtectedRoute><ProLayout><ProPlanning /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/profil">
        <ProtectedRoute><ProLayout><ProProfil /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/profil/mot-de-passe">
        <ProtectedRoute><ProLayout><ProModifierMotDePasse /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/profil/notifications">
        <ProtectedRoute><ProLayout><ProNotifications /></ProLayout></ProtectedRoute>
      </Route>
      <Route path="/professionnel/parametres">
        <ProtectedRoute><ProLayout><ProParametres /></ProLayout></ProtectedRoute>
      </Route>

      {/* ===== ADMIN (protégé) ===== */}
      <Route path="/admin/seamlier">
        <ProtectedRoute><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/access/gestion/seamlier">
        <ProtectedRoute><AdminDashboard /></ProtectedRoute>
      </Route>

      {/* ===== 404 ===== */}
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
