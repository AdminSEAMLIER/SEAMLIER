import { Switch, Route, Link } from "wouter";
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

// Imports des pages
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Discovery from "@/pages/discovery";
import Messages from "@/pages/messages";
import Mesures from "@/pages/mesures";
import Magazine from "@/pages/magazine"; 
import MagazineDetail from "@/pages/magazine-detail"; 
import AdminMagazine from "@/pages/admin-magazine"; // <--- AJOUTÉ : Import de l'admin
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

// --- Headers Mobiles ---

function MobileHeader() {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="w-10" />
      <Link href="/particulier">
        <Logo className="text-[#722F37]" textClassName="text-[#722F37]" />
      </Link>
      <LanguageToggle />
    </div>
  );
}

function ProMobileHeader() {
  return (
    <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-50">
      <Link href="/professionnel">
        <div className="flex items-center gap-2">
          <Logo className="text-[#722F37]" textClassName="text-[#722F37]" />
          <Badge variant="secondary" className="bg-[#722F37]/10 text-[#722F37] border-none text-[10px]">Pro</Badge>
        </div>
      </Link>
      <LanguageToggle />
    </div>
  );
}

// --- Layouts ---

function ParticulierLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DesktopHeader mode="particulier" />
      <MobileHeader />
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
      <ProMobileHeader />
      <main className="lg:pt-16">
        {children}
      </main>
      <ProBottomNav />
    </>
  );
}

// --- Router Principal ---

function Router() {
  return (
    <Switch>
      {/* --- ACCÈS ADMIN SECRET --- */}
      <Route path="/access/gestion/seamlier" component={AdminMagazine} />

      {/* Routes Publiques */}
      <Route path="/" component={Landing} />
      <Route path="/connexion" component={Connexion} />
      <Route path="/mentions-legales" component={MentionsLegales} />
      <Route path="/confidentialite" component={Confidentialite} />
      <Route path="/cgv" component={CGV} />
      <Route path="/inscription" component={Inscription} />
      <Route path="/inscription-particulier" component={InscriptionParticulier} />
      <Route path="/inscription-professionnel" component={InscriptionProfessionnel} />
      <Route path="/recherche" component={Recherche} />
      <Route path="/couturier/:id" component={CouturierProfile} />

      {/* Espace Particulier */}
      <Route path="/particulier">
        <ParticulierLayout><Home /></ParticulierLayout>
      </Route>
      <Route path="/particulier/decouverte">
        <ParticulierLayout><Discovery /></ParticulierLayout>
      </Route>
      <Route path="/particulier/messages">
        <ParticulierLayout><Messages /></ParticulierLayout>
      </Route>
      <Route path="/particulier/mesures">
        <ParticulierLayout><Mesures /></ParticulierLayout>
      </Route>

      {/* SECTION MAGAZINE */}
      <Route path="/particulier/magazine">
        <ParticulierLayout><Magazine /></ParticulierLayout>
      </Route>
      <Route path="/particulier/magazine/:id">
        <ParticulierLayout><MagazineDetail /></ParticulierLayout>
      </Route>

      <Route path="/particulier/profil">
        <ParticulierLayout><ProfilParticulier /></ParticulierLayout>
      </Route>
      <Route path="/particulier/profil/mot-de-passe">
        <ParticulierLayout><ModifierMotDePasse /></ParticulierLayout>
      </Route>
      <Route path="/particulier/profil/notifications">
        <ParticulierLayout><PreferencesNotifications /></ParticulierLayout>
      </Route>
      <Route path="/particulier/tailor/:id">
        {(params) => (
          <ParticulierLayout><TailorProfile id={params.id} /></ParticulierLayout>
        )}
      </Route>
      <Route path="/particulier/product/:id">
        {(params) => (
          <ParticulierLayout><ProductDetail id={params.id} /></ParticulierLayout>
        )}
      </Route>

      {/* Espace Professionnel */}
      <Route path="/professionnel">
        <ProfessionnelLayout><ProDashboard /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/setup" component={ProSetup} />
      <Route path="/professionnel/demandes">
        <ProfessionnelLayout><ProDemandes /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/projets">
        <ProfessionnelLayout><ProProjets /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/messagerie">
        <ProfessionnelLayout><ProMessagerie /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/planning">
        <ProfessionnelLayout><ProPlanning /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/profil">
        <ProfessionnelLayout><ProProfil /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/parametres">
        <ProfessionnelLayout><ProParametres /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/profil/mot-de-passe">
        <ProfessionnelLayout><ProModifierMotDePasse /></ProfessionnelLayout>
      </Route>
      <Route path="/professionnel/profil/notifications">
        <ProfessionnelLayout><ProNotifications /></ProfessionnelLayout>
      </Route>

      {/* 404 */}
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