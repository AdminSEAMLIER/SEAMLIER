import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Home, 
  FileText, 
  FolderKanban, 
  MessageSquare, 
  Calendar,
  Euro,
  TrendingUp,
  Star,
  ArrowRight,
  Ruler,
  ArrowUpRight,
  ShieldAlert,
  CheckCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, ConversationWithParticipant } from "@shared/schema";

const STARTER_LIMIT = 10;

export default function ProDashboard() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showConfirmStep, setShowConfirmStep] = useState(false);
  
  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: conversations } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/settings"],
  });

  const { data: planData } = useQuery<{ tailorId: string; subscriptionPlan: string }>({
    queryKey: ["/api/professionnel/plan"],
  });

  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);

  useEffect(() => {
    const upgradeStatus = searchParams.get("upgrade");
    const sessionId = searchParams.get("session_id");
    if (upgradeStatus === "success" && sessionId) {
      fetch(`/api/stripe/subscription/verify?session_id=${sessionId}`, { credentials: "include" })
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            queryClient.invalidateQueries({ queryKey: ["/api/professionnel/plan"] });
            toast({
              title: "Abonnement Pro activé !",
              description: "Vous bénéficiez maintenant de 0% de commission et de mesures illimitées.",
            });
          }
        })
        .catch(() => {});
      window.history.replaceState({}, "", "/dashboard-pro");
    }
  }, []);

  const upgradeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/subscription/create");
      const data = await res.json();
      if (data.alreadyPro) {
        queryClient.invalidateQueries({ queryKey: ["/api/professionnel/plan"] });
        return data;
      }
      if (data.url) {
        window.location.href = data.url;
        return data;
      }
      throw new Error(data.error || "Réponse inattendue");
    },
    onSuccess: (data) => {
      if (data?.alreadyPro) {
        setShowUpgradeModal(false);
        toast({ title: "Vous êtes déjà Pro !", description: "Votre plan Pro est actif." });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Erreur",
        description: err?.message || "Impossible de créer la session de paiement.",
        variant: "destructive",
      });
    },
  });

  const subscriptionPrice = settings?.subscriptionPrice || "29";
  const currentPlan = (planData?.subscriptionPlan || "Starter") as "Starter" | "Pro";
  const measureCount = 0;
  const limitPercent = Math.min(100, (measureCount / STARTER_LIMIT) * 100);

  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/conversations/unread-count"],
    refetchInterval: 5000,
  });
  const unreadCount = unreadData?.count ?? 0;
  const productCount = products?.length ?? 0;

  const stats = [
    { label: t('pro.thisMonth'), value: "0€", icon: Euro },
    { label: t('pro.activeProjects'), value: String(productCount), icon: FolderKanban },
    { label: t('pro.newRequests'), value: String(unreadCount), icon: FileText },
    { label: t('pro.averageRating'), value: "-", icon: Star },
  ];

  const quickLinks = [
    { label: t('nav.requests'), icon: FileText, href: "/gestion-demandes", count: 0 },
    { label: t('nav.projects'), icon: FolderKanban, href: "/atelier", count: productCount },
    { label: t('nav.messaging'), icon: MessageSquare, href: "/messagerie", count: unreadCount },
    { label: t('nav.planning'), icon: Calendar, href: "/portefeuille", count: 0 },
  ];

  const handleOpenUpgradeModal = () => {
    setShowConfirmStep(false);
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    upgradeMutation.mutate();
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Home className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]" data-testid="text-pro-welcome">
              {t('pro.welcome')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pro.manageActivity')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">

        {currentPlan === "Starter" && (
          <Card className="border border-gray-100 bg-white shadow-sm" data-testid="card-starter-limit">
            <CardContent className="p-5 bg-white space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Ruler className="h-5 w-5 text-[#722F37]" />
                  <span className="font-semibold text-gray-900">Plan Couturier</span>
                  <Badge className="bg-blue-50 text-blue-700 border-none text-[10px]">Starter</Badge>
                </div>
                <span className={cn(
                  "text-sm font-bold",
                  measureCount >= STARTER_LIMIT ? "text-red-600" : measureCount >= 7 ? "text-amber-600" : "text-green-600"
                )} data-testid="text-pro-measure-count">
                  {measureCount} / {STARTER_LIMIT} projets
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={cn(
                    "h-2.5 rounded-full transition-all",
                    measureCount >= STARTER_LIMIT ? "bg-red-500" : measureCount >= 7 ? "bg-amber-500" : "bg-green-500"
                  )}
                  style={{ width: `${limitPercent}%` }}
                  data-testid="progress-pro-starter-limit"
                />
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs text-gray-500">
                  Plan Starter : 15% commission artisan
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs text-purple-700 border-purple-200"
                  onClick={handleOpenUpgradeModal}
                  data-testid="button-pro-upgrade"
                >
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Passer au Pro
                </Button>
              </div>

              {measureCount >= STARTER_LIMIT && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">
                    Limite atteinte. Passez au plan Pro pour des projets illimités et 0% de commission.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentPlan === "Pro" && (
          <Card className="border border-purple-200 bg-purple-50/30 shadow-sm" data-testid="card-pro-plan-active">
            <CardContent className="p-4 bg-transparent flex items-center gap-3 flex-wrap">
              <CheckCircle className="h-5 w-5 text-purple-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-purple-800">Plan Pro actif</p>
                <p className="text-xs text-purple-600">0% commission - Projets illimités</p>
              </div>
              <Badge className="bg-purple-100 text-purple-700 border-none">PRO</Badge>
            </CardContent>
          </Card>
        )}

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <div key={stat.label} className="p-4 bg-gray-50 rounded-lg text-center" data-testid={`stat-${stat.label.replace(/\s/g, "-").toLowerCase()}`}>
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <stat.icon className="h-5 w-5 text-[#722F37]" />
                  </div>
                  <p className="text-2xl font-bold text-[#722F37]">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('pro.quickActions')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="grid grid-cols-2 gap-3">
              {quickLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer" data-testid={`link-pro-${link.label.replace(/\s/g, "-").toLowerCase()}`}>
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center mb-2">
                        <link.icon className="h-5 w-5 text-[#722F37]" />
                      </div>
                      {link.count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#722F37] text-white text-xs rounded-full flex items-center justify-center">
                          {link.count}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-600 text-center">{link.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-lg text-[#722F37]">{t('pro.recentMessages')}</CardTitle>
            <Link href="/messagerie">
              <Button variant="ghost" size="sm" className="text-[#722F37]" data-testid="button-pro-view-messages">
                {t('landing.viewAll')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="bg-white">
            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.slice(0, 3).map((conv) => (
                  <div key={conv.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="w-10 h-10 rounded-full bg-[#722F37]/10 flex items-center justify-center">
                      <span className="text-[#722F37] font-medium">
                        {conv.otherParticipant?.firstName?.charAt(0) || "?"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {conv.otherParticipant ? `${conv.otherParticipant.firstName} ${conv.otherParticipant.lastName}` : "Client"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString() : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">{t('pro.noMessages')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#722F37]">{t('pro.revenue')}</CardTitle>
          </CardHeader>
          <CardContent className="bg-white">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-[#722F37]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t('pro.thisMonth')}</p>
                <p className="text-2xl font-bold text-[#722F37]" data-testid="text-pro-revenue">0€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showUpgradeModal} onOpenChange={(open) => { setShowUpgradeModal(open); if (!open) setShowConfirmStep(false); }}>
        <DialogContent className="sm:max-w-md bg-white" data-testid="dialog-pro-upgrade">
          <DialogHeader>
            <DialogTitle className="text-[#722F37] font-serif text-xl">
              {showConfirmStep ? "Confirmer votre abonnement" : "Passer au Plan Pro"}
            </DialogTitle>
            <DialogDescription>
              {showConfirmStep
                ? `Vous allez souscrire au plan Pro à ${subscriptionPrice}€/mois.`
                : "Boostez votre activité avec le plan Pro et profitez de tous les avantages."}
            </DialogDescription>
          </DialogHeader>

          {!showConfirmStep ? (
            <>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="border border-gray-200 rounded-lg p-3">
                  <Badge className="bg-blue-50 text-blue-700 border-none text-[10px] font-bold mb-2">STARTER</Badge>
                  <p className="text-sm font-bold text-gray-500 line-through">Votre plan actuel</p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-600">
                    <li className="text-red-500 font-bold">15% commission</li>
                    <li>{STARTER_LIMIT} projets/mois</li>
                  </ul>
                </div>
                <div className="border-2 border-purple-300 rounded-lg p-3 bg-purple-50/30 relative">
                  <div className="absolute -top-2 right-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] font-bold mb-2">PRO</Badge>
                  <p className="text-sm font-bold">{subscriptionPrice}€/mois</p>
                  <ul className="mt-2 space-y-1 text-xs text-gray-700">
                    <li className="font-bold text-green-600">0% commission</li>
                    <li className="font-bold text-green-600">Projets illimités</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowUpgradeModal(false)}
                  data-testid="button-close-pro-upgrade"
                >
                  Plus tard
                </Button>
                <Button
                  className="flex-1 bg-purple-700 hover:bg-purple-800 text-white"
                  onClick={() => setShowConfirmStep(true)}
                  data-testid="button-choose-pro"
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  Choisir le Pro
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-3 mt-2">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Plan Pro - {subscriptionPrice}€/mois</span>
                  </div>
                  <ul className="space-y-2 text-sm text-purple-700">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      0% de commission sur vos prestations
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Projets illimités
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Visibilité prioritaire dans les résultats
                    </li>
                  </ul>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  En confirmant, vous activez immédiatement le plan Pro.
                </p>
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmStep(false)}
                  data-testid="button-back-upgrade"
                >
                  Retour
                </Button>
                <Button
                  className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
                  onClick={handleConfirmUpgrade}
                  disabled={upgradeMutation.isPending}
                  data-testid="button-confirm-pro-upgrade"
                >
                  {upgradeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      Activation...
                    </>
                  ) : (
                    "Confirmer et activer"
                  )}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
