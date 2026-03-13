import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { FileText, Clock, MapPin, Euro, CheckCircle, XCircle, MessageSquare, Users, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-config";
import type { ProjectWithClient } from "@shared/schema";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type FilterType = "all" | "pending" | "accepted" | "refused";

function statusBadge(status: string) {
  switch (status) {
    case "pending":
    case "new":
      return <Badge className="bg-yellow-100 text-yellow-700 border-none">En attente</Badge>;
    case "accepted":
    case "en_cours":
      return <Badge className="bg-blue-100 text-blue-700 border-none">Accepté</Badge>;
    case "refused":
      return <Badge className="bg-red-100 text-red-700 border-none">Refusé</Badge>;
    case "terminé":
      return <Badge className="bg-green-100 text-green-700 border-none">Terminé</Badge>;
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

  const { data: projects = [], isLoading } = useQuery<ProjectWithClient[]>({
    queryKey: ["/api/tailor/projects"],
  });

  const statusMutation = useMutation({
    mutationFn: async ({ projectId, status }: { projectId: string; status: string }) => {
      const res = await apiFetch(`/api/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/projects"] });
    },
  });

  const handleAccept = (project: ProjectWithClient) => {
    statusMutation.mutate(
      { projectId: project.id, status: "accepted" },
      {
        onSuccess: () => {
          toast({
            title: t("pro.requestAccepted"),
            description: t("pro.redirectingToMessaging"),
          });
          sessionStorage.setItem(
            "acceptedRequest",
            JSON.stringify({
              clientName: `${project.client.firstName} ${project.client.lastName}`.trim(),
              projectType: project.title,
              autoMessage: t("pro.acceptanceMessage"),
            })
          );
          setTimeout(() => setLocation("/messagerie?newConversation=true"), 500);
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible d'accepter ce projet.", variant: "destructive" });
        },
      }
    );
  };

  const handleDecline = (projectId: string) => {
    statusMutation.mutate(
      { projectId, status: "refused" },
      {
        onSuccess: () => {
          toast({ title: t("pro.requestDeclined"), description: t("pro.requestDeclinedDesc") });
        },
        onError: () => {
          toast({ title: "Erreur", description: "Impossible de refuser ce projet.", variant: "destructive" });
        },
      }
    );
  };

  const filtered = projects.filter((p) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return p.status === "pending" || p.status === "new";
    if (activeFilter === "accepted") return p.status === "accepted" || p.status === "en_cours";
    if (activeFilter === "refused") return p.status === "refused";
    return true;
  });

  const countPending = projects.filter((p) => p.status === "pending" || p.status === "new").length;

  const formatDeadline = (deadline: string | null | undefined) => {
    if (!deadline) return "—";
    try {
      return format(new Date(deadline), "d MMM yyyy", { locale: fr });
    } catch {
      return deadline;
    }
  };

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
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t("nav.requests")}
            </h1>
            {countPending > 0 && (
              <Badge className="bg-[#722F37] text-white border-none ml-1">{countPending}</Badge>
            )}
          </div>
          <p className="text-gray-600 mt-2">{t("pro.requestsSubtitle")}</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-4 bg-white">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(
                [
                  { key: "all", label: "Tous", count: projects.length },
                  { key: "pending", label: "En attente", count: countPending },
                  { key: "accepted", label: "Acceptés", count: projects.filter((p) => p.status === "accepted" || p.status === "en_cours").length },
                  { key: "refused", label: "Refusés", count: projects.filter((p) => p.status === "refused").length },
                ] as { key: FilterType; label: string; count: number }[]
              ).map((f) => (
                <Button
                  key={f.key}
                  variant="default"
                  className={
                    activeFilter === f.key
                      ? "bg-[#722F37] text-white hover:bg-[#5a252c] flex-shrink-0"
                      : "bg-white border-2 border-gray-200 text-gray-600 hover:border-[#722F37] hover:text-[#722F37] flex-shrink-0"
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
              <Loader2 className="h-6 w-6 animate-spin text-[#722F37] mx-auto mb-2" />
              <p className="text-gray-500">{t("common.loading")}</p>
            </CardContent>
          </Card>
        ) : filtered.length === 0 ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-12 bg-white text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-serif text-xl text-[#722F37] mb-2">
                {t("pro.noRequestsTitle")}
              </h3>
              <p className="text-gray-500 mb-2">{t("pro.noRequestsDesc")}</p>
              <p className="text-gray-400 text-sm">{t("pro.noRequestsHint")}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((project) => {
            const clientName = `${project.client?.firstName || ""} ${project.client?.lastName || ""}`.trim() || "Client";
            const isMutating = statusMutation.isPending && (statusMutation.variables?.projectId === project.id);
            const isPending = project.status === "pending" || project.status === "new";

            return (
              <Card
                key={project.id}
                className="border border-gray-100 bg-white shadow-sm mb-4"
                data-testid={`card-project-${project.id}`}
              >
                <CardContent className="p-5 bg-white">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[#722F37] truncate">{project.title || "Projet sans titre"}</h3>
                        {statusBadge(project.status)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                        <span>{clientName}</span>
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

                  {project.description && (
                    <p className="text-gray-600 text-sm mb-4">{project.description}</p>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm mb-4">
                    {project.amount != null && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Euro className="h-4 w-4 text-[#722F37]" />
                        <span>{project.amount} €</span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4 text-[#722F37]" />
                        <span>{formatDeadline(project.deadline)}</span>
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <Button
                        className="flex-1 bg-white border-2 border-[#722F37] text-[#722F37] hover:bg-[#722F37]/10"
                        onClick={() => handleAccept(project)}
                        disabled={isMutating}
                        data-testid={`button-accept-${project.id}`}
                      >
                        {isMutating ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        {t("pro.accept")}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-200"
                        size="icon"
                        onClick={() => setLocation("/messagerie")}
                        data-testid={`button-message-${project.id}`}
                      >
                        <MessageSquare className="h-4 w-4" />
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
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
