import { Switch, Route, Link, useLocation, Redirect } from "wouter";
import { useLayoutEffect } from "react";
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
import { usePushNotifications } from "@/hooks/use-push-notifications";

import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Discovery from "@/pages/discovery";
import Messages from "@/pages/messages";
import Mesures from "@/pages/mesures";
import Magazine from "@/pages/magazine";
import MagazinePublic from "@/pages/magazine-public";
import MagazineDetailPublic from "@/pages/magazine-detail-public";
import MagazineDetail from "@/pages/magazine-detail";
import AdminDashboard from "@/pages/admin-magazine";
import PrendreRdv from "@/pages/prendre-rdv";
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
import CGU from "@/pages/cgu";
import PolitiqueRemboursement from "@/pages/politique-remboursement";
import SuiviProjet from "@/pages/suivi-projet";
import ModifierMotDePasse from "@/pages/modifier-mot-de-passe";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import PreferencesNotifications from "@/pages/preferences-notifications";
import ProParametres from "@/pages/pro-parametres";
import ProModifierMotDePasse from "@/pages/pro-modifier-mot-de-passe";
import ProNotifications from "@/pages/pro-notifications";
import ProSetup from "@/pages/pro-setup";
import ProStatistiques from "@/pages/pro-statistiques";
import ProHoraires from "@/pages/pro-horaires";
import MesProjets from "@/pages/mes-projets";
import MesRendezVous from "@/pages/mes-rendez-vous";
import DashboardClient from "@/pages/dashboard-client";
import EvenementCreer from "@/pages/evenement-creer";
import EvenementRejoindre from "@/pages/evenement-rejoindre";
import EvenementDetail from "@/pages/evenement-detail";
import ProParrainage from "@/pages/pro-parrainage";

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading || user === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#601B28] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-600 font-medium">Chargement...</p>
      </div>
    );
  }
  if (!user || user.role !== "admin") return <Redirect to="/connexion" />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#601B28] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-600 font-medium">Chargement...</p>
      </div>
    );
  }

  if (user === undefined) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-[#601B28] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-zinc-600 font-medium">Vérification...</p>
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
        <Logo className="text-[#601B28]" textClassName="text-[#601B28]" />
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
          <Logo className="text-[#601B28]" textClassName="text-[#601B28]" />
          <Badge
            variant="secondary"
            className="bg-[#601B28] text-white border-none text-[10px]"
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

function ScrollToTop() {
  const [location] = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

function HomeRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (!isLoading && isAuthenticated && user) {
    if (user.role === "admin") return <Redirect to="/admin/dashboard" />;
    if (user.role === "tailor") return <Redirect to="/dashboard-pro" />;
    return <Redirect to="/dashboard-client" />;
  }
  return <Landing />;
}

// Route magazine intelligente : layout selon le rôle, page publique si non connecté
function MagazineRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role === "tailor") return <ProLayout><Magazine /></ProLayout>;
  if (user) return <ClientLayout><Magazine /></ClientLayout>;
  return <MagazinePublic />;
}

function MagazineDetailRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user?.role === "tailor") return <ProLayout><MagazineDetail /></ProLayout>;
  if (user) return <ClientLayout><MagazineDetail /></ClientLayout>;
  return <MagazineDetailPublic />;
}

function PushActivator() {
  const { isAuthenticated } = useAuth();
  usePushNotifications(isAuthenticated);
  return null;
}

function Router() {
  return (
    <>
    <ScrollToTop />
    <PushActivator />
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
      <Route path="/cgu" component={CGU} />
      <Route path="/politique-remboursement" component={PolitiqueRemboursement} />

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

      {/* Client routes */}
      <Route path="/dashboard-client">
        <ProtectedRoute>
          <ClientLayout><DashboardClient /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/decouverte">
        <ClientLayout><Discovery /></ClientLayout>
      </Route>

      <Route path="/mesures">
        <ProtectedRoute>
          <ClientLayout><Mesures /></ClientLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/magazine">
        <MagazineRoute />
      </Route>
      <Route path="/magazine/:id">
        <MagazineDetailRoute />
      </Route>

      <Route path="/messages">
        <ProtectedRoute>
          <ClientLayout><Messages /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/mon-profil">
        <ProtectedRoute>
          <ClientLayout><ProfilParticulier /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/mon-profil/mot-de-passe">
        <ProtectedRoute>
          <ClientLayout><ModifierMotDePasse /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/mon-profil/notifications">
        <ProtectedRoute>
          <ClientLayout><PreferencesNotifications /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/tailor/:id">
        <ProtectedRoute>
          <ClientLayout><TailorProfile /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/product/:id">
        <ProtectedRoute>
          <ClientLayout><ProductDetail /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/suivi-projet/:id">
        <ProtectedRoute>
          <ClientLayout><SuiviProjet /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/mes-projets">
        <ProtectedRoute>
          <ClientLayout><MesProjets /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/mes-rendez-vous">
        <ProtectedRoute>
          <ClientLayout><MesRendezVous /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/evenement/creer">
        <ProtectedRoute>
          <ClientLayout><EvenementCreer /></ClientLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/evenement/rejoindre/:inviteCode">
        <EvenementRejoindre />
      </Route>

      <Route path="/prendre-rdv">
        <ProtectedRoute>
          <PrendreRdv />
        </ProtectedRoute>
      </Route>

      <Route path="/evenement/:id">
        <ProtectedRoute>
          <EvenementDetail />
        </ProtectedRoute>
      </Route>

      {/* Pro routes */}
      <Route path="/dashboard-pro">
        <ProtectedRoute>
          <ProLayout><ProDashboard /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/dashboard-pro/setup">
        <ProtectedRoute>
          <ProLayout><ProSetup /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/gestion-demandes">
        <ProtectedRoute>
          <ProLayout><ProDemandes /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/atelier/:id">
        <ProtectedRoute>
          <ProLayout><ProProjets /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/atelier">
        <ProtectedRoute>
          <ProLayout><ProProjets /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/messagerie">
        <ProtectedRoute>
          <ProLayout><ProMessagerie /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/vitrine-pro">
        <ProtectedRoute>
          <ProLayout><ProProfil /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/portefeuille">
        <ProtectedRoute>
          <ProLayout><ProPlanning /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pro-statistiques">
        <ProtectedRoute>
          <ProLayout><ProStatistiques /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pro-profil">
        <ProtectedRoute>
          <ProLayout><ProProfil /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pro-parrainage">
        <ProtectedRoute>
          <ProLayout><ProParrainage /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pro-profil/mot-de-passe">
        <ProtectedRoute>
          <ProLayout><ProModifierMotDePasse /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pro-profil/notifications">
        <ProtectedRoute>
          <ProLayout><ProNotifications /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pro-profil/parametres">
        <ProtectedRoute>
          <ProLayout><ProParametres /></ProLayout>
        </ProtectedRoute>
      </Route>

      <Route path="/pro/horaires">
        <ProtectedRoute>
          <ProLayout><ProHoraires /></ProLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/dashboard">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>
      <Route path="/admin/seamlier">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
    </>
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
