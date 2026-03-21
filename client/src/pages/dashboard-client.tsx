import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import {
  Compass,
  Ruler,
  MessageCircle,
  BookOpen,
  ClipboardList,
  ChevronRight,
  Scissors,
  Star,
  CalendarCheck,
  AlertTriangle,
  History,
  Euro,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import type { TailorWithUser, ProjectWithTailor } from "@shared/schema";

export default function DashboardClient() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: tailors, isLoading: tailorsLoading } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const { data: projects = [] } = useQuery<ProjectWithTailor[]>({
    queryKey: ["/api/client/projects"],
  });

  // FIX: utilise /api/conversations au lieu de /api/conversations/unread-count qui n'existe pas
  const { data: conversations = [] } = useQuery<any[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: clientAppointments = [] } = useQuery<any[]>({
    queryKey: ["/api/client/appointments-with-tailor"],
    queryFn: async () => {
      const res = await fetch("/api/client/appointments-with-tailor", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: measurements } = useQuery<any>({
    queryKey: ["/api/measurements"],
  });

  const measurementsOutdated = (() => {
    if (!measurements?.updatedAt) return false;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(measurements.updatedAt) < sixMonthsAgo;
  })();

  const featuredTailors = tailors?.slice(0, 3) || [];
  const activeProjects = projects.filter((p) => p.status !== "terminé").length;
  const unreadCount = conversations.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
  const upcomingRdv = clientAppointments.filter(
    (a: any) => new Date(a.scheduled_at) >= new Date() && a.status !== "cancelled"
  ).length;
  const pendingRdv = clientAppointments.filter(
    (a: any) => new Date(a.scheduled_at) >= new Date() && a.status === "scheduled"
  ).length;

  const quickActions = [
    {
      icon: Compass,
      label: "Trouver un artisan",
      sublabel: "Découvrez nos couturiers",
      href: "/decouverte",
      color: "bg-[#722F37]",
    },
    {
      icon: CalendarCheck,
      label: "Mes rendez-vous",
      sublabel: upcomingRdv > 0 ? `${upcomingRdv} à venir` : "Aucun rendez-vous",
      href: "/mes-rendez-vous",
      color: "bg-emerald-700",
      badge: pendingRdv,
    },
    {
      icon: ClipboardList,
      label: "Mes projets",
      sublabel: activeProjects > 0 ? `${activeProjects} en cours` : "Aucun projet actif",
      href: "/mes-projets",
      color: "bg-slate-700",
    },
    {
      icon: MessageCircle,
      label: "Messages",
      sublabel: unreadCount > 0 ? `${unreadCount} non lu${unreadCount > 1 ? "s" : ""}` : "Aucun message",
      href: "/messages",
      color: "bg-zinc-700",
      badge: unreadCount,
    },
  ];

  return (
    <div className="min-h-screen pb-24 bg-[#faf9f8]">
      {/* Hero greeting */}
      <div className="bg-[#722F37] text-white px-4 lg:px-8 pt-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-sm mb-1">Bienvenue sur SEAMLIER</p>
          <h1 className="font-serif text-2xl lg:text-3xl font-medium">
            Bonjour{user?.firstName ? `, ${user.firstName}` : ""} 👋
          </h1>
          <p className="text-white/80 mt-2 text-sm lg:text-base">
            Trouvez le couturier idéal pour votre prochain projet.
          </p>
          <Link href="/decouverte">
            <Button className="mt-5 bg-white text-[#722F37] hover:bg-white/90 font-semibold h-10 px-5 text-sm">
              <Compass className="h-4 w-4 mr-2" />
              Explorer les artisans
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 lg:px-8 -mt-4">
        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-[#722F37]/30 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
                  {action.badge && action.badge > 0 ? (
                    <span className="absolute top-3 right-3 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {action.badge > 9 ? "9+" : action.badge}
                    </span>
                  ) : null}
                  <div className={`w-9 h-9 rounded-lg ${action.color} flex items-center justify-center mb-3`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{action.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{action.sublabel}</p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Alerte mesures obsolètes */}
        {measurementsOutdated && (
          <Link href="/mesures">
            <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:bg-orange-100 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-orange-800 text-sm">Mesures à mettre à jour</p>
                <p className="text-orange-700 text-xs mt-0.5">
                  Vos mesures datent de plus de 6 mois — mettez-les à jour pour un résultat parfait.
                </p>
              </div>
              <Ruler className="h-4 w-4 text-orange-400 shrink-0 mt-0.5" />
            </div>
          </Link>
        )}

        {/* Featured tailors */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-[#722F37] flex items-center gap-2">
              <Star className="h-5 w-5" />
              Nos artisans
            </h2>
            <Link href="/decouverte">
              <button className="text-[#722F37] text-sm font-medium flex items-center gap-1 hover:underline">
                Voir tous <ChevronRight className="h-4 w-4" />
              </button>
            </Link>
          </div>

          {tailorsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <TailorCardSkeleton key={i} />)}
            </div>
          ) : featuredTailors.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredTailors.map((tailor) => (
                <TailorCard key={tailor.id} tailor={tailor} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 py-10 text-center">
              <Scissors className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun artisan disponible pour le moment</p>
            </div>
          )}
        </div>

        {/* Historique des commandes */}
        {projects.filter(p => ["terminé", "completed", "cancelled"].includes(p.status)).length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-[#722F37] flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique
              </h2>
              <Link href="/mes-projets">
                <button className="text-[#722F37] text-sm font-medium flex items-center gap-1 hover:underline">
                  Tout voir <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {projects
                .filter(p => ["terminé", "completed", "cancelled"].includes(p.status))
                .slice(0, 5)
                .map(p => {
                  const isCompleted = ["terminé", "completed"].includes(p.status);
                  const isCancelled = p.status === "cancelled";
                  return (
                    <Link key={p.id} href={`/suivi-projet/${p.id}`}>
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:border-[#722F37]/20 hover:shadow-md transition-all cursor-pointer">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCompleted ? "bg-green-50" : "bg-red-50"}`}>
                          {isCompleted ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">{p.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${isCompleted ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                              {isCompleted ? "Terminé" : "Annulé"}
                            </span>
                            {p.createdAt && (
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date(p.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                        {(p as any).amountArtisan ? (
                          <span className="text-sm font-bold text-[#722F37] flex items-center gap-0.5 shrink-0">
                            <Euro className="h-3.5 w-3.5" />{(p as any).amountArtisan}
                          </span>
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
            </div>
          </div>
        )}

        {/* Magazine teaser */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#722F37]/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-[#722F37]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Magazine SEAMLIER</p>
              <p className="text-gray-500 text-xs">Tendances, conseils & inspirations couture</p>
            </div>
          </div>
          <Link href="/magazine">
            <Button variant="outline" size="sm" className="border-[#722F37] text-[#722F37] hover:bg-[#722F37] hover:text-white shrink-0">
              Lire
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}