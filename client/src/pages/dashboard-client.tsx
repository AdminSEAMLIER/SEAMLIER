import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  PartyPopper,
  Calendar,
  Users,
  Gift,
  Send,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { TailorWithUser, ProjectWithTailor } from "@shared/schema";

export default function DashboardClient() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState("");

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

  const { data: clientEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/client/events"],
  });

  const { data: organizedEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/client/events/organized"],
  });

  const measurementsOutdated = (() => {
    if (!measurements?.updatedAt) return false;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(measurements.updatedAt) < sixMonthsAgo;
  })();

  const inviteMutation = useMutation({
    mutationFn: (email: string) => apiRequest("POST", "/api/referrals", { email }),
    onSuccess: () => {
      setInviteEmail("");
      toast({ title: "Invitation envoyée", description: "Votre ami recevra un email d'invitation." });
      queryClient.invalidateQueries({ queryKey: ["/api/referrals/mine"] });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible d'envoyer l'invitation.", variant: "destructive" }),
  });

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
      color: "bg-[#601B28]",
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
      <div className="bg-[#601B28] text-white px-4 lg:px-8 pt-8 pb-12">
        <div className="max-w-3xl mx-auto">
          <p className="text-white/70 text-sm mb-1">Bienvenue sur SEAMLIER</p>
          <h1 className="font-serif text-2xl lg:text-3xl font-medium">
            Bonjour{user?.firstName ? `, ${user.firstName}` : ""} 👋
          </h1>
          <p className="text-white/80 mt-2 text-sm lg:text-base">
            Trouvez le couturier idéal pour votre prochain projet.
          </p>
          <Link href="/decouverte">
            <Button className="mt-5 bg-white text-[#601B28] hover:bg-white/90 font-semibold h-10 px-5 text-sm">
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
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-[#601B28]/30 hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
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
            <h2 className="font-serif text-xl text-[#601B28] flex items-center gap-2">
              <Star className="h-5 w-5" />
              Nos artisans
            </h2>
            <Link href="/decouverte">
              <button className="text-[#601B28] text-sm font-medium flex items-center gap-1 hover:underline">
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
              <h2 className="font-serif text-xl text-[#601B28] flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique
              </h2>
              <Link href="/mes-projets">
                <button className="text-[#601B28] text-sm font-medium flex items-center gap-1 hover:underline">
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
                      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:border-[#601B28]/20 hover:shadow-md transition-all cursor-pointer">
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
                          <span className="text-sm font-bold text-[#601B28] flex items-center gap-0.5 shrink-0">
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

        {/* Événements que j'organise */}
        {organizedEvents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-[#601B28] flex items-center gap-2">
                <PartyPopper className="h-5 w-5" />
                Mes événements organisés
              </h2>
              <Link href="/evenement/creer">
                <button className="text-[#601B28] text-sm font-medium flex items-center gap-1 hover:underline">
                  + Créer <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {organizedEvents.map((ev: any) => (
                <Link key={ev.id} href={`/evenement/${ev.id}`} data-testid={`link-org-event-${ev.id}`}>
                  <div className="bg-white rounded-xl border border-[#601B28]/20 shadow-sm px-4 py-3 flex items-center gap-3 hover:border-[#601B28]/40 hover:shadow-md transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-[#601B28] flex items-center justify-center shrink-0">
                      <PartyPopper className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{ev.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(ev.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <Users className="h-3 w-3 ml-1" />
                        <span>{ev.participant_count} participant{ev.participant_count > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium shrink-0 px-2 py-0.5 rounded-full ${
                      ev.status === "active" ? "bg-green-100 text-green-700" :
                      ev.status === "pending_tailor_approval" ? "bg-amber-100 text-amber-700" :
                      ev.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {ev.status === "active" ? "Actif" :
                       ev.status === "pending_tailor_approval" ? "En attente" :
                       ev.status === "rejected" ? "Refusé" : ev.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Événements collectifs (rejoints) */}
        {clientEvents.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-[#601B28] flex items-center gap-2">
                <PartyPopper className="h-5 w-5" />
                Mes événements
              </h2>
              <Link href="/evenement/creer">
                <button className="text-[#601B28] text-sm font-medium flex items-center gap-1 hover:underline">
                  + Créer <ChevronRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
            <div className="space-y-2">
              {clientEvents.slice(0, 3).map((ev: any) => (
                <Link key={ev.id} href={`/evenement/${ev.id}`} data-testid={`link-event-${ev.id}`}>
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 hover:border-[#601B28]/30 hover:shadow-md transition-all cursor-pointer">
                    <div className="w-9 h-9 rounded-lg bg-[#601B28]/10 flex items-center justify-center shrink-0">
                      <PartyPopper className="h-4 w-4 text-[#601B28]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{ev.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(ev.event_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                        <Users className="h-3 w-3 ml-1" />
                        <span>{ev.participant_count} participant{ev.participant_count > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <span className="text-xs text-[#601B28] font-medium shrink-0">
                      {ev.tailor_first_name} {ev.tailor_last_name}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Créer un événement CTA (si aucun des deux) */}
        {clientEvents.length === 0 && organizedEvents.length === 0 && (
          <div className="mb-8">
            <Link href="/evenement/creer">
              <div className="bg-gradient-to-r from-[#601B28]/5 to-[#601B28]/10 border border-[#601B28]/20 rounded-xl p-4 flex items-center gap-3 cursor-pointer hover:from-[#601B28]/10 hover:to-[#601B28]/15 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-[#601B28] flex items-center justify-center shrink-0">
                  <PartyPopper className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#601B28] text-sm">Organiser un événement collectif</p>
                  <p className="text-gray-500 text-xs mt-0.5">Mariage, EVJF, groupe d'amies — invitez vos proches !</p>
                </div>
                <ChevronRight className="h-4 w-4 text-[#601B28] shrink-0" />
              </div>
            </Link>
          </div>
        )}

        {/* Magazine teaser */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#601B28]/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-[#601B28]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Magazine SEAMLIER</p>
              <p className="text-gray-500 text-xs">Tendances, conseils & inspirations couture</p>
            </div>
          </div>
          <Link href="/magazine">
            <Button variant="outline" size="sm" className="border-[#601B28] text-[#601B28] hover:bg-[#601B28] hover:text-white shrink-0">
              Lire
            </Button>
          </Link>
        </div>

        {/* Parrainage */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#601B28]/10 flex items-center justify-center">
              <Gift className="h-5 w-5 text-[#601B28]" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Inviter un proche</p>
              <p className="text-gray-500 text-xs">Partagez SEAMLIER avec vos proches</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@exemple.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && inviteEmail && inviteMutation.mutate(inviteEmail)}
              className="flex-1 h-9 text-sm"
            />
            <Button
              size="sm"
              className="bg-[#601B28] hover:bg-[#4E1522] text-white h-9 px-3 shrink-0"
              onClick={() => inviteEmail && inviteMutation.mutate(inviteEmail)}
              disabled={inviteMutation.isPending || !inviteEmail}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}