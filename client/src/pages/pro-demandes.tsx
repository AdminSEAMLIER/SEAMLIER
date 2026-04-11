import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { FileText, Clock, MapPin, Euro, XCircle, MessageSquare, Users, Loader2, Send, Shirt, Image, CalendarDays, CheckCircle2, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-config";
import type { ProjectWithClient } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type FilterType = "all" | "pending" | "quoted" | "cancelled";

function statusBadge(status: string) {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-700 border-none">Nouvelle demande</Badge>;
    case "quoted":
      return <Badge className="bg-blue-100 text-blue-700 border-none">Devis envoyé</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700 border-none">Annulé / Refusé</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-600 border-none">{status}</Badge>;
  }
}

export default function ProDemandes() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [openQuoteId, setOpenQuoteId] = useState<string | null>(null);
  const [quoteAmounts, setQuoteAmounts] = useState<Record<string, string>>({});

  const { data: allProjects = [], isLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/tailor/projects"],
  });

  const { data: tailorEvents = [] } = useQuery<any[]>({
    queryKey: ["/api/tailor/events"],
  });

  const pendingEvents = tailorEvents.filter((e: any) => e.status === "pending_tailor_approval");

  const approveMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiFetch(`/api/events/${eventId}/approve`, { method: "PATCH" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/events"] });
      toast({ title: "Commande acceptée", description: "Le client a été notifié." });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible d'accepter.", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await apiFetch(`/api/events/${eventId}/reject`, { method: "PATCH" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/events"] });
      toast({ title: "Commande refusée", description: "L'organisateur a été informé." });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de refuser.", variant: "destructive" }),
  });

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const projects = allProjects.filter((p) => {
    if (p.status === "pending" || p.status === "quoted") return true;
    const created = p.createdAt ? new Date(p.createdAt) : null;
    if (created && created >= thirtyDaysAgo) return true;
    return false;
  });

  const quoteMutation = useMutation({
    mutationFn: async ({ projectId, status, amount }: { projectId: string; status: string; amount?: number }) => {
      const res = await apiFetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...(amount != null ? { amount } : {}) }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/projects"] });
      setOpenQuoteId(null);
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour ce projet.", variant: "destructive" });
    },
  });

  const handleSendQuote = (project: ProjectWithClient) => {
    const amount = parseFloat(quoteAmounts[project.id] || "");
    if (!amount || isNaN(amount) || amount <= 0) {
      toast({ title: "Montant invalide", description: "Veuillez saisir un montant valide.", variant: "destructive" });
      return;
    }
    quoteMutation.mutate(
      { projectId: project.id, status: "quoted", amount },
      {
        onSuccess: () => {
          toast({ title: "Devis envoyé !", description: "Le client a été notifié par message." });
        },
      }
    );
  };

  const [openingConvId, setOpeningConvId] = useState<string | null>(null);

  const handleOpenConversation = async (project: ProjectWithClient) => {
    const clientUserId = (project.client as any)?.id;
    if (!clientUserId) { setLocation("/messagerie"); return; }
    setOpeningConvId(project.id);
    try {
      const res = await apiFetch("/api/conversations", {
        method: "POST",
        body: JSON.stringify({ participantId: clientUserId }),
      });
      if (!res.ok) throw new Error("conv error");
      const conv = await res.json();
      setLocation(`/messagerie?conv=${conv.id}`);
    } catch {
      setLocation("/messagerie");
    } finally {
      setOpeningConvId(null);
    }
  };

  const handleDecline = (projectId: string) => {
    quoteMutation.mutate(
      { projectId, status: "cancelled" },
      {
        onSuccess: () => {
          toast({ title: "Demande refusée", description: "La demande a été déclinée." });
        },
      }
    );
  };

  const filtered = projects.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return p.status === "pending";
    if (activeFilter === "quoted") return p.status === "quoted";
    if (activeFilter === "cancelled") return p.status === "cancelled";
    return true;
  });

  const countPending = projects.filter((p) => p.status === "pending").length;
  const countQuoted = projects.filter((p) => p.status === "quoted").length;
  const countCancelled = projects.filter((p) => p.status === "cancelled").length;

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "";
    try {
      return format(new Date(date), "d MMM yyyy", { locale: fr });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">
              {t("nav.requests")}
            </h1>
            {(countPending + pendingEvents.length) > 0 && (
              <Badge className="bg-[#601B28] text-white border-none ml-1">{countPending + pendingEvents.length}</Badge>
            )}
          </div>
          <p className="text-gray-600 mt-2">Gérez les demandes clients et envoyez vos devis.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">

        {pendingEvents.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="h-4 w-4 text-[#601B28]" />
              <h2 className="font-semibold text-[#601B28] text-sm uppercase tracking-wide">Commandes groupées en attente</h2>
              <Badge className="bg-amber-100 text-amber-700 border-none text-xs">{pendingEvents.length}</Badge>
            </div>
            {pendingEvents.map((ev: any) => (
              <Card key={ev.id} className="border border-amber-100 bg-amber-50/40 shadow-sm mb-3" data-testid={`card-event-${ev.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{ev.name}</h3>
                      <p className="text-sm text-gray-500">Organisateur : {ev.organizer_first_name} {ev.organizer_last_name}</p>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-none flex-shrink-0 text-xs">En attente</Badge>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                    {ev.event_date && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {format(new Date(ev.event_date), "d MMM yyyy", { locale: fr })}
                      </span>
                    )}
                    {ev.max_participants && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {ev.max_participants} personnes max
                      </span>
                    )}
                    {ev.price_per_person && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3.5 w-3.5" />
                        {ev.price_per_person}€/pers.
                      </span>
                    )}
                    {ev.price_group && (
                      <span className="flex items-center gap-1">
                        <Euro className="h-3.5 w-3.5" />
                        {ev.price_group}€ groupe
                      </span>
                    )}
                  </div>

                  {ev.description && (
                    <p className="text-sm text-gray-600 bg-white rounded-lg p-3 mb-3 border border-amber-100">{ev.description}</p>
                  )}

                  <div className="flex gap-2 pt-3 border-t border-amber-100">
                    <Button
                      className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white gap-1"
                      size="sm"
                      onClick={() => approveMutation.mutate(ev.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-event-${ev.id}`}
                    >
                      {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Accepter
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-200 text-gray-600 gap-1"
                      size="sm"
                      onClick={() => rejectMutation.mutate(ev.id)}
                      disabled={rejectMutation.isPending}
                      data-testid={`button-reject-event-${ev.id}`}
                    >
                      {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                      Refuser
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-4 bg-white">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(
                [
                  { key: "all", label: "Toutes", count: projects.length },
                  { key: "pending", label: "Nouvelles", count: countPending },
                  { key: "quoted", label: "Devis envoyés", count: countQuoted },
                  { key: "cancelled", label: "Refusées", count: countCancelled },
                ] as { key: FilterType; label: string; count: number }[]
              ).map((f) => (
                <Button
                  key={f.key}
                  variant="default"
                  className={
                    activeFilter === f.key
                      ? "bg-[#601B28] text-white hover:bg-[#4E1522] flex-shrink-0"
                      : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#601B28] hover:text-[#601B28] flex-shrink-0"
                  }
                  size="sm"
                  onClick={() => setActiveFilter(f.key)}
                  data-testid={`filter-${f.key}`}
                >
                  {f.label} ({f.count})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <Loader2 className="h-6 w-6 animate-spin text-[#601B28] mx-auto mb-2" />
              <p className="text-gray-500">{t("common.loading")}</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-12 bg-white text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-serif text-xl text-[#601B28] mb-2">
                Aucune demande
              </h3>
              <p className="text-gray-500 mb-2">Vous n'avez pas encore de demandes clients.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((project) => {
            const clientName = `${project.client?.firstName || ""} ${project.client?.lastName || ""}`.trim() || "Client";
            const isMutating = quoteMutation.isPending && (quoteMutation.variables?.projectId === project.id);
            const isQuoteOpen = openQuoteId === project.id;

            return (
              <Card
                key={project.id}
                className="border border-gray-100 bg-white shadow-sm mb-4"
                data-testid={`card-project-${project.id}`}
              >
                <CardContent className="p-5 bg-white">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[#601B28] truncate">{project.title || "Projet sans titre"}</h3>
                        {statusBadge(project.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                        <span className="font-medium text-gray-700">{clientName}</span>
                        {project.client?.location && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {project.client.location}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDate(project.createdAt?.toString())}
                    </span>
                  </div>

                  {(project as any).clothingType && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
                      <Shirt className="h-4 w-4 text-[#601B28]" />
                      <span className="font-medium">{(project as any).clothingType}</span>
                    </div>
                  )}

                  {project.description && (
                    <p className="text-gray-600 text-sm mb-3 bg-gray-50 rounded-lg p-3">{project.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    {(project as any).requestedPrice != null && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Euro className="h-4 w-4 text-[#601B28]" />
                        <span>Budget client : <strong>{(project as any).requestedPrice}€</strong></span>
                      </div>
                    )}
                    {project.status === "quoted" && project.amount != null && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Euro className="h-4 w-4" />
                        <span>Votre devis : <strong>{project.amount}€</strong></span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4 text-[#601B28]" />
                        <span>{formatDate(project.deadline ? new Date(project.deadline).toISOString() : "")}</span>
                      </div>
                    )}
                  </div>

                  {(project as any).modelPhotoUrl && (
                    <div className="mb-3">
                      <a href={(project as any).modelPhotoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-[#601B28] hover:underline">
                        <Image className="h-4 w-4" />
                        Voir la photo modèle
                      </a>
                    </div>
                  )}

                  {project.status === "quoted" && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-700 mb-3">
                      ✉️ Devis envoyé au client. En attente de sa réponse.
                    </div>
                  )}

                  {project.status === "pending" && (
                    <>
                      {isQuoteOpen ? (
                        <div className="border-t border-gray-100 pt-4 space-y-3">
                          <Label className="text-sm font-medium text-gray-700">Montant du devis (€)</Label>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              min="1"
                              placeholder="Ex: 150"
                              value={quoteAmounts[project.id] || ""}
                              onChange={(e) => setQuoteAmounts((prev) => ({ ...prev, [project.id]: e.target.value }))}
                              className="flex-1"
                              data-testid={`input-quote-amount-${project.id}`}
                            />
                            <Button
                              className="bg-[#601B28] hover:bg-[#4E1522] text-white gap-1"
                              onClick={() => handleSendQuote(project)}
                              disabled={isMutating}
                              data-testid={`button-send-quote-${project.id}`}
                            >
                              {isMutating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                              Envoyer
                            </Button>
                            <Button
                              variant="outline"
                              className="border-gray-200"
                              onClick={() => setOpenQuoteId(null)}
                            >
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-4 border-t border-gray-100">
                          <Button
                            className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white gap-1"
                            onClick={() => setOpenQuoteId(project.id)}
                            disabled={isMutating}
                            data-testid={`button-open-quote-${project.id}`}
                          >
                            <Euro className="h-4 w-4" />
                            Envoyer un devis
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-200"
                            size="icon"
                            onClick={() => handleOpenConversation(project)}
                            disabled={openingConvId === project.id}
                            data-testid={`button-message-${project.id}`}
                          >
                            {openingConvId === project.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : <MessageSquare className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            className="border-gray-200 text-gray-500"
                            size="icon"
                            onClick={() => handleDecline(project.id)}
                            disabled={isMutating}
                            data-testid={`button-decline-${project.id}`}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}

                  {project.status !== "pending" && project.status !== "cancelled" && (
                    <div className="pt-3 border-t border-gray-100 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 gap-1"
                        onClick={() => handleOpenConversation(project)}
                        disabled={openingConvId === project.id}
                        data-testid={`button-message-conv-${project.id}`}
                      >
                        {openingConvId === project.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <MessageSquare className="h-4 w-4" />}
                        Messagerie
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
