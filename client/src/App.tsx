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
import AdminDashboard from "@/pages/admin-magazine"; // <--- CORRIGÉ : On importe AdminDashboard
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