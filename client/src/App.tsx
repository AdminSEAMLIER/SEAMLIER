import { Switch, Route, Link, useLocation, Redirect } from "wouter";
import { useLayoutEffect, lazy, Suspense } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
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

// Lazy imports — chaque page est chargée uniquement quand elle est visitée
const NotFound = lazy(() => import("@/pages/not-found"));
const Landing = lazy(() => import("@/pages/landing"));
const Discovery = lazy(() => import("@/pages/discovery"));
const Messages = lazy(() => import("@/pages/messages"));
const Mesures = lazy(() => import("@/pages/mesures"));
const Magazine = lazy(() => import("@/pages/magazine"));
const MagazinePublic = lazy(() => import("@/pages/magazine-public"));
const MagazineDetailPublic = lazy(() => import("@/pages/magazine-detail-public"));
const MagazineDetail = lazy(() => import("@/pages/magazine-detail"));
const AdminDashboard = lazy(() => import("@/pages/admin-magazine"));
const PrendreRdv = lazy(() => import("@/pages/prendre-rdv"));
const TailorProfile = lazy(() => import("@/pages/tailor-profile"));
const ProductDetail = lazy(() => import("@/pages/product-detail"));
const ProDashboard = lazy(() => import("@/pages/pro-dashboard"));
const ProDemandes = lazy(() => import("@/pages/pro-demandes"));
const ProProjets = lazy(() => import("@/pages/pro-projets"));
const ProMessagerie = lazy(() => import("@/pages/pro-messagerie"));
const ProPlanning = lazy(() => import("@/pages/pro-planning"));
const ProProfil = lazy(() => import("@/pages/pro-profil"));
const InscriptionParticulier = lazy(() => import("@/pages/inscription-particulier"));
const Recherche = lazy(() => import("@/pages/recherche"));
const CouturierProfile = lazy(() => import("@/pages/couturier-profile"));
const InscriptionProfessionnel = lazy(() => import("@/pages/inscription-professionnel"));
const Inscription = lazy(() => import("@/pages/inscription"));
const ProfilParticulier = lazy(() => import("@/pages/profil-particulier"));
const Connexion = lazy(() => import("@/pages/connexion"));
const ConnexionParticulier = lazy(() => import("@/pages/connexion-particulier"));
const ConnexionProfessionnel = lazy(() => import("@/pages/connexion-professionnel"));
const MentionsLegales = lazy(() => import("@/pages/mentions-legales"));
const Confidentialite = lazy(() => import("@/pages/confidentialite"));
const CGV = lazy(() => import("@/pages/cgv"));
const CGU = lazy(() => import("@/pages/cgu"));
const PolitiqueRemboursement = lazy(() => import("@/pages/politique-remboursement"));
const SuiviProjet = lazy(() => import("@/pages/suivi-projet"));
const ModifierMotDePasse = lazy(() => import("@/pages/modifier-mot-de-passe"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const PreferencesNotifications = lazy(() => import("@/pages/preferences-notifications"));
const ProParametres = lazy(() => import("@/pages/pro-parametres"));
const ProModifierMotDePasse = lazy(() => import("@/pages/pro-modifier-mot-de-passe"));
const ProNotifications = lazy(() => import("@/pages/pro-notifications"));
const ProSetup = lazy(() => import("@/pages/pro-setup"));
const ProStatistiques = lazy(() => import("@/pages/pro-statistiques"));
const ProDossier = lazy(() => import("@/pages/pro-dossier"));
const ProHoraires = lazy(() => import("@/pages/pro-horaires"));
const MesProjets = lazy(() => import("@/pages/mes-projets"));
const MesRendezVous = lazy(() => import("@/pages/mes-rendez-vous"));
const DashboardClient = lazy(() => import("@/pages/dashboard-client"));
const EvenementCreer = lazy(() => import("@/pages/evenement-creer"));
const EvenementRejoindre = lazy(() => import("@/pages/evenement-rejoindre"));
const EvenementDetail = lazy(() => import("@/pages/evenement-detail"));

// Fallback de chargement entre les pages
function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div className="w-10 h-10 border-4 border-[#601B28] border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-zinc-600 font-medium">Chargement...</p>
    </div>
  );
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

function Router() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
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
            <ProtectedRoute>
              <ClientLayout><Discovery /></ClientLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/mesures">
            <ProtectedRoute>
              <ClientLayout><Mesures /></ClientLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/magazine">
            <MagazinePublic />
          </Route>
          <Route path="/magazine/:id">
            <MagazineDetailPublic />
          </Route>
          <Route path="/espace-client/magazine">
            <ProtectedRoute>
              <ClientLayout><Magazine /></ClientLayout>
            </ProtectedRoute>
          </Route>
          <Route path="/espace-client/magazine/:id">
            <ProtectedRoute>
              <ClientLayout><MagazineDetail /></ClientLayout>
            </ProtectedRoute>
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
            <TailorProfile />
          </Route>
          <Route path="/espace-client/tailor/:id">
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
              <SuiviProjet />
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
            <PrendreRdv />
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

          <Route path="/pro-dossier">
            <ProtectedRoute>
              <ProLayout><ProDossier /></ProLayout>
            </ProtectedRoute>
          </Route>

          <Route path="/pro-profil">
            <ProtectedRoute>
              <ProLayout><ProProfil /></ProLayout>
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
          <Route path="/admin/dashboard" component={AdminDashboard} />
          <Route path="/admin/seamlier" component={AdminDashboard} />

          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </>
  );
}

function PushInit() {
  usePushNotifications();
  return null;
}

function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { data } = useQuery<{ active: boolean }>({
    queryKey: ["/api/maintenance-status"],
    refetchInterval: 30000,
    staleTime: 10000,
  });

  if (data?.active && user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#601B28]/10 flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#601B28" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl text-[#601B28] font-bold">Maintenance en cours</h1>
          <p className="text-gray-600 leading-relaxed">SEAMLIER est temporairement indisponible pour une maintenance planifiée. Nous serons de retour très bientôt.</p>
          <p className="text-sm text-gray-400">Merci de votre patience.</p>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="min-h-screen bg-white text-black selection:bg-black/10">
          <PushInit />
          <MaintenanceGate>
            <Router />
          </MaintenanceGate>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}