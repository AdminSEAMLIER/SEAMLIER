import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FolderKanban, Clock, Euro, CheckCircle, Circle, Loader2, ArrowLeft, Scissors, MessageSquare, Calendar, Star, X, Eye, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ProjectWithTailor } from "@shared/schema";
import PaymentButton from "@/components/checkout-button";

const FABRICATION_STEPS = [
  { key: "prise_mesures", label: "Prise de mesures", labelEn: "Measurements", progress: 0 },
  { key: "choix_tissu", label: "Choix du tissu", labelEn: "Fabric selection", progress: 15 },
  { key: "patronage", label: "Patronage", labelEn: "Pattern making", progress: 30 },
  { key: "coupe", label: "Coupe", labelEn: "Cutting", progress: 45 },
  { key: "assemblage", label: "Assemblage", labelEn: "Assembly", progress: 60 },
  { key: "essayage", label: "Essayage", labelEn: "Fitting", progress: 75 },
  { key: "finitions", label: "Finitions", labelEn: "Finishing", progress: 90 },
  { key: "livraison", label: "Prêt / Livraison", labelEn: "Ready / Delivery", progress: 100 },
];

export default function MesProjets() {
  const { t, i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [bookingProject, setBookingProject] = useState<ProjectWithTailor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingType, setBookingType] = useState("consultation");

  const [reviewProject, setReviewProject] = useState<ProjectWithTailor | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [confirmProject, setConfirmProject] = useState<ProjectWithTailor | null>(null);
  const [deadlineRespected, setDeadlineRespected] = useState<boolean | null>(null);
  const [articleReceived, setArticleReceived] = useState<boolean | null>(null);
  const [showDone, setShowDone] = useState(false);

  const { data: projects = [], isLoading } = useQuery<ProjectWithTailor[]>({
    queryKey: ["/api/client/projects"],
  });

  const isDone = (p: ProjectWithTailor) =>
    p.status === "completed" && !!(p as any).clientConfirmed;
  const activeProjects = projects.filter(p => !isDone(p));
  const doneProjects = projects.filter(p => isDone(p));

  const acceptQuoteMutation = useMutation({
    mutationFn: (projectId: string) =>
      apiRequest("PATCH", `/api/projects/${projectId}`, { status: "in_progress" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      toast({ title: isFr ? "Devis accepté !" : "Quote accepted!", description: isFr ? "La confection va démarrer." : "Production will start." });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const rejectQuoteMutation = useMutation({
    mutationFn: (projectId: string) =>
      apiRequest("PATCH", `/api/projects/${projectId}`, { status: "cancelled" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      toast({ title: isFr ? "Devis refusé" : "Quote rejected" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const bookingMutation = useMutation({
    mutationFn: async () => {
      if (!bookingProject || !bookingDate || !bookingTime) throw new Error("Champs requis");
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}`).toISOString();
      const res = await apiRequest("POST", "/api/appointments", {
        tailorId: bookingProject.tailorId,
        scheduledAt,
        type: bookingType,
        duration: 60,
        status: "scheduled",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setBookingProject(null);
      setBookingDate(""); setBookingTime("");
      toast({ title: isFr ? "Rendez-vous demandé" : "Appointment requested" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewProject || !reviewComment) throw new Error("Commentaire requis");
      const res = await apiRequest("POST", "/api/reviews", {
        tailorId: reviewProject.tailorId,
        rating: reviewRating,
        comment: reviewComment,
      });
      return res.json();
    },
    onSuccess: () => {
      const tailorId = reviewProject?.tailorId;
      setReviewProject(null);
      setReviewComment(""); setReviewRating(5);
      if (tailorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/tailors", tailorId] });
        queryClient.invalidateQueries({ queryKey: ["/api/tailors", tailorId, "reviews"] });
      }
      toast({ title: isFr ? "Avis envoyé, merci !" : "Review submitted, thanks!" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      if (!confirmProject) throw new Error("Projet manquant");
      const res = await apiRequest("POST", `/api/projects/${confirmProject.id}/client-confirm`, { deadlineRespected });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      const project = confirmProject;
      setConfirmProject(null);
      setDeadlineRespected(null);
      setArticleReceived(null);
      toast({ title: isFr ? "Merci pour votre confirmation !" : "Thanks for confirming!", description: isFr ? "Le paiement va être libéré à l'artisan." : "Payment will be released to the tailor." });
      if (project) {
        setTimeout(() => { setReviewProject(project); setReviewRating(5); setReviewComment(""); }, 500);
      }
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const getStatusBadge = (project: ProjectWithTailor) => {
    const paymentStatus = (project as any).paymentStatus ?? "";
    const isPaid = ["paid", "client_confirmed", "transferred"].includes(paymentStatus);
    switch (project.status) {
      case "in_progress":
        if (!isPaid && project.amount && project.amount > 0) {
          return <Badge className="bg-amber-100 text-amber-800 border-none font-semibold">{isFr ? "À payer" : "Payment due"}</Badge>;
        }
        return <Badge className="bg-blue-100 text-blue-700 border-none">{isFr ? "En cours" : "In progress"}</Badge>;
      case "completed": return <Badge className="bg-green-100 text-green-700 border-none">{isFr ? "Terminé" : "Completed"}</Badge>;
      case "pending": return <Badge className="bg-gray-100 text-gray-700 border-none">{isFr ? "En attente de devis" : "Awaiting quote"}</Badge>;
      case "quoted": return <Badge className="bg-orange-100 text-orange-700 border-none">{isFr ? "Devis reçu — à valider" : "Quote received"}</Badge>;
      case "cancelled": return <Badge className="bg-red-100 text-red-700 border-none">{isFr ? "Annulé" : "Cancelled"}</Badge>;
      default: return null;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 75) return "bg-blue-500";
    return "bg-[#601B28]";
  };

  const getStepLabel = (step: typeof FABRICATION_STEPS[0]) => isFr ? step.label : step.labelEn;

  const getCurrentStepLabel = (stepKey: string | null) => {
    const step = FABRICATION_STEPS.find(s => s.key === stepKey);
    if (!step) return isFr ? "Prise de mesures" : "Measurements";
    return getStepLabel(step);
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <Link href="/dashboard-client">
            <Button variant="ghost" size="sm" className="mb-4 text-gray-500 -ml-2">
              <ArrowLeft className="h-4 w-4 mr-1" />
              {isFr ? "Retour" : "Back"}
            </Button>
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <FolderKanban className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">
              {isFr ? "Mes projets" : "My projects"}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {isFr ? "Suivez l'avancement de vos créations sur mesure" : "Track the progress of your custom creations"}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        {isLoading ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <Loader2 className="h-8 w-8 animate-spin text-[#601B28] mx-auto mb-2" />
              <p className="text-gray-500">{t('common.loading')}</p>
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-12 bg-white text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Scissors className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="font-serif text-xl text-[#601B28] mb-2">
                {isFr ? "Aucun projet en cours" : "No projects yet"}
              </h3>
              <p className="text-gray-500 mb-4">
                {isFr ? "Vos projets avec des artisans apparaîtront ici" : "Your projects with tailors will appear here"}
              </p>
              <Link href="/recherche">
                <Button className="bg-[#601B28] hover:bg-[#4E1522] text-white" data-testid="button-find-tailor">
                  {isFr ? "Trouver un artisan" : "Find a tailor"}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
          {/* ── Section titre si les deux sections coexistent ── */}
          {activeProjects.length > 0 && doneProjects.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {isFr ? `Projets en cours (${activeProjects.length})` : `Active (${activeProjects.length})`}
            </p>
          )}
          {activeProjects.length === 0 && doneProjects.length > 0 && (
            <Card className="border border-gray-100 bg-white shadow-sm mb-6">
              <CardContent className="p-8 bg-white text-center">
                <CheckCircle className="h-10 w-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-500">{isFr ? "Aucun projet actif en ce moment." : "No active projects at the moment."}</p>
              </CardContent>
            </Card>
          )}
          {activeProjects.map((project) => {
            const currentStepIndex = FABRICATION_STEPS.findIndex(s => s.key === (project.currentStep || "prise_mesures"));
            const tailorName = `${project.tailorUser?.firstName || ""} ${project.tailorUser?.lastName || ""}`.trim();
            const isQuoted = project.status === "quoted";
            const isInProgress = project.status === "in_progress";
            const isCompleted = project.status === "completed";
            const paymentStatus = (project as any).paymentStatus ?? "";
            const isPaid = ["paid", "client_confirmed", "transferred"].includes(paymentStatus);
            const needsPayment = isInProgress && project.amount && project.amount > 0 && !isPaid;

            return (
              <Card
                key={project.id}
                className="border border-gray-100 bg-white shadow-sm mb-6"
                data-testid={`card-client-project-${project.id}`}
              >
                <CardContent className="p-5 bg-white">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[#601B28]">{project.title}</h3>
                        {getStatusBadge(project)}
                      </div>
                      {tailorName && (
                        <p className="text-sm text-gray-500">
                          {isFr ? "Artisan : " : "Tailor: "}{tailorName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Devis à valider par le client */}
                  {isQuoted && (
                    <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm font-semibold text-orange-800 mb-1">
                        {isFr ? "Devis proposé par l'artisan" : "Quote from tailor"}
                      </p>
                      {project.amount && (
                        <p className="text-2xl font-bold text-orange-700 mb-2">{project.amount}€</p>
                      )}
                      <p className="text-xs text-orange-700 mb-3">
                        {isFr ? "Validez pour lancer la confection, ou refusez si le prix ne convient pas." : "Accept to start production, or decline if the price doesn't suit you."}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={acceptQuoteMutation.isPending}
                          onClick={() => acceptQuoteMutation.mutate(project.id)}
                          data-testid={`button-accept-quote-${project.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {isFr ? "Accepter" : "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                          disabled={rejectQuoteMutation.isPending}
                          onClick={() => rejectQuoteMutation.mutate(project.id)}
                          data-testid={`button-reject-quote-${project.id}`}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {isFr ? "Refuser" : "Decline"}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Section paiement prioritaire */}
                  {needsPayment && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        {isFr ? "Devis accepté — règlement en attente" : "Quote accepted — payment pending"}
                      </p>
                      <p className="text-2xl font-bold text-amber-700 mb-3">{project.amount}€</p>
                      <PaymentButton
                        projectId={project.id}
                        prixConfection={project.amount!}
                        planArtisan={project.tailor?.subscriptionPlan ?? "starter"}
                        label={isFr ? "Payer maintenant" : "Pay now"}
                      />
                    </div>
                  )}

                  {/* Timeline fabrication */}
                  {project.status !== "pending" && project.status !== "cancelled" && (
                    <>
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 font-medium">{getCurrentStepLabel(project.currentStep)}</span>
                          <span className="font-bold text-[#601B28]">{project.progress || 0}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(project.progress || 0)} rounded-full transition-all duration-500`}
                            style={{ width: `${project.progress || 0}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-0">
                        {FABRICATION_STEPS.map((step, index) => {
                          const isStepCompleted = index < currentStepIndex;
                          const isStepCurrent = index === currentStepIndex;

                          return (
                            <div key={step.key} className="flex items-center gap-3 py-2">
                              <div className="flex-shrink-0 relative">
                                {isStepCompleted ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : isStepCurrent ? (
                                  <div className="h-5 w-5 rounded-full border-2 border-[#601B28] bg-[#601B28] flex items-center justify-center">
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                  </div>
                                ) : (
                                  <Circle className="h-5 w-5 text-gray-200" />
                                )}
                                {index < FABRICATION_STEPS.length - 1 && (
                                  <div className={`absolute left-[9px] top-[22px] w-[2px] h-4 ${isStepCompleted ? "bg-green-300" : "bg-gray-100"}`} />
                                )}
                              </div>
                              <span className={`text-sm ${isStepCurrent ? "font-semibold text-[#601B28]" : isStepCompleted ? "text-green-700" : "text-gray-300"}`}>
                                {getStepLabel(step)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <div className="flex flex-wrap gap-4 text-sm mt-4 pt-3 border-t border-gray-100">
                    {project.amount && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Euro className="h-4 w-4 text-[#601B28]" />
                        <span>{project.amount}€</span>
                      </div>
                    )}
                    {project.deadline && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="h-4 w-4 text-[#601B28]" />
                        <span>{new Date(project.deadline).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions client */}
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-[#601B28] border-[#601B28]/30 hover:bg-[#601B28] hover:text-white"
                      onClick={() => navigate(`/suivi-projet/${project.id}`)}
                      data-testid={`button-suivi-${project.id}`}
                    >
                      <Eye className="h-4 w-4" />
                      {isFr ? "Suivre" : "Track"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-gray-600"
                      onClick={() => navigate(`/messages?tailor=${project.tailorId}`)}
                      data-testid={`button-message-tailor-${project.id}`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      {isFr ? "Message" : "Message"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-1.5 text-gray-600"
                      onClick={() => { setBookingProject(project); setBookingDate(""); setBookingTime(""); setBookingType("consultation"); }}
                      data-testid={`button-book-${project.id}`}
                    >
                      <Calendar className="h-4 w-4" />
                      {isFr ? "RDV" : "Book"}
                    </Button>
                    {/* Payment button shown in the prominent section above when needsPayment */}
                    {isCompleted && (() => {
                      const isPaid = ["paid", "client_confirmed", "transferred"].includes((project as any).paymentStatus ?? "");
                      if (!isPaid) return (
                        <div className="flex-1 space-y-1.5">
                          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 text-center">
                            {isFr ? "Veuillez régler le devis avant de confirmer la réception" : "Please pay the quote before confirming receipt"}
                          </p>
                          {project.amount && project.amount > 0 && (
                            <PaymentButton
                              projectId={project.id}
                              prixConfection={project.amount}
                              planArtisan={(project as any).tailor?.subscriptionPlan ?? "starter"}
                              label={isFr ? "Payer le devis" : "Pay quote"}
                            />
                          )}
                        </div>
                      );
                      if (!(project as any).clientConfirmed) return (
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => { setConfirmProject(project); setDeadlineRespected(null); setArticleReceived(null); }}
                          data-testid={`button-confirm-receipt-${project.id}`}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {isFr ? "Confirmer la réception" : "Confirm receipt"}
                        </Button>
                      );
                      return (
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-[#601B28] hover:bg-[#4E1522] text-white"
                          onClick={() => { setReviewProject(project); setReviewRating(5); setReviewComment(""); }}
                          data-testid={`button-review-${project.id}`}
                        >
                          <Star className="h-4 w-4" />
                          {isFr ? "Laisser un avis" : "Review"}
                        </Button>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* ── Section Projets terminés (repliable) ── */}
          {doneProjects.length > 0 && (
            <div className="mt-6">
              <button
                className="flex items-center gap-2 w-full text-left mb-3"
                onClick={() => setShowDone(v => !v)}
                data-testid="button-toggle-done"
              >
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex-1">
                  {isFr ? `Projets terminés (${doneProjects.length})` : `Completed (${doneProjects.length})`}
                </span>
                {showDone
                  ? <ChevronUp className="h-4 w-4 text-gray-400" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />}
              </button>
              {showDone && doneProjects.map((project) => {
                const tailorName = `${project.tailorUser?.firstName || ""} ${project.tailorUser?.lastName || ""}`.trim();
                return (
                  <Card
                    key={project.id}
                    className="border border-gray-200 bg-gray-50 shadow-none mb-4 opacity-60"
                    data-testid={`card-done-project-${project.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4 mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-500">{project.title}</h3>
                            <Badge className="bg-green-100 text-green-700 border-none text-xs">
                              {isFr ? "Terminé" : "Completed"}
                            </Badge>
                          </div>
                          {tailorName && (
                            <p className="text-sm text-gray-400">
                              {isFr ? "Artisan : " : "Tailor: "}{tailorName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                        {project.amount && (
                          <span className="flex items-center gap-1">
                            <Euro className="h-3.5 w-3.5" />{project.amount}€
                          </span>
                        )}
                        {project.deadline && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(project.deadline).toLocaleDateString(isFr ? "fr-FR" : "en-US")}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </>
        )}
      </div>

      {/* Dialog Confirmation Réception */}
      <Dialog open={!!confirmProject} onOpenChange={(open) => !open && setConfirmProject(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isFr ? "Confirmer la réception" : "Confirm receipt"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isFr ? "Avez-vous bien récupéré votre article ?" : "Did you receive your item?"}</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={articleReceived === true ? "default" : "outline"} onClick={() => setArticleReceived(true)} className={articleReceived === true ? "bg-green-600 text-white flex-1" : "flex-1"} data-testid="button-article-yes">
                  {isFr ? "Oui ✓" : "Yes ✓"}
                </Button>
                <Button size="sm" variant={articleReceived === false ? "default" : "outline"} onClick={() => setArticleReceived(false)} className={articleReceived === false ? "bg-red-500 text-white flex-1" : "flex-1"} data-testid="button-article-no">
                  {isFr ? "Non" : "No"}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isFr ? "La date de livraison a-t-elle été respectée ?" : "Was the deadline respected?"}</Label>
              <div className="flex gap-2">
                <Button size="sm" variant={deadlineRespected === true ? "default" : "outline"} onClick={() => setDeadlineRespected(true)} className={deadlineRespected === true ? "bg-green-600 text-white flex-1" : "flex-1"} data-testid="button-deadline-yes">
                  {isFr ? "Oui ✓" : "Yes ✓"}
                </Button>
                <Button size="sm" variant={deadlineRespected === false ? "default" : "outline"} onClick={() => setDeadlineRespected(false)} className={deadlineRespected === false ? "bg-orange-500 text-white flex-1" : "flex-1"} data-testid="button-deadline-no">
                  {isFr ? "Non" : "No"}
                </Button>
              </div>
            </div>
            {articleReceived === false && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                {isFr ? "⚠️ Si vous n'avez pas reçu votre article, contactez le support avant de confirmer." : "⚠️ If you haven't received your item, contact support before confirming."}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmProject(null)}>{isFr ? "Annuler" : "Cancel"}</Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              disabled={articleReceived === null || confirmMutation.isPending}
              onClick={() => confirmMutation.mutate()}
              data-testid="button-submit-confirm"
            >
              {confirmMutation.isPending ? (isFr ? "Envoi…" : "Sending…") : (isFr ? "Confirmer la réception" : "Confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog RDV */}
      <Dialog open={!!bookingProject} onOpenChange={(open) => !open && setBookingProject(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isFr ? "Prendre rendez-vous" : "Book an appointment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm mb-1 block">{isFr ? "Type de rendez-vous" : "Appointment type"}</Label>
              <Select value={bookingType} onValueChange={setBookingType}>
                <SelectTrigger data-testid="select-booking-type-client">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">{isFr ? "Consultation" : "Consultation"}</SelectItem>
                  <SelectItem value="measurements">{isFr ? "Prise de mesures" : "Measurements"}</SelectItem>
                  <SelectItem value="fitting">{isFr ? "Essayage" : "Fitting"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm mb-1 block">{isFr ? "Date" : "Date"}</Label>
                <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} data-testid="input-client-booking-date" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">{isFr ? "Heure" : "Time"}</Label>
                <Input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} data-testid="input-client-booking-time" />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setBookingProject(null)}>{isFr ? "Annuler" : "Cancel"}</Button>
            <Button
              className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
              disabled={!bookingDate || !bookingTime || bookingMutation.isPending}
              onClick={() => bookingMutation.mutate()}
              data-testid="button-confirm-client-booking"
            >
              {bookingMutation.isPending ? (isFr ? "Envoi…" : "Sending…") : (isFr ? "Confirmer" : "Confirm")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Avis */}
      <Dialog open={!!reviewProject} onOpenChange={(open) => !open && setReviewProject(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{isFr ? "Laisser un avis" : "Leave a review"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-sm mb-2 block">{isFr ? "Note" : "Rating"}</Label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setReviewRating(n)} className="p-1" data-testid={`star-${n}`}>
                    <Star className={`h-7 w-7 ${n <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="review-comment" className="text-sm mb-1 block">{isFr ? "Commentaire" : "Comment"} *</Label>
              <Textarea
                id="review-comment"
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                rows={3}
                placeholder={isFr ? "Partagez votre expérience..." : "Share your experience..."}
                data-testid="input-review-comment"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setReviewProject(null)}>{isFr ? "Annuler" : "Cancel"}</Button>
            <Button
              className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
              disabled={!reviewComment || reviewMutation.isPending}
              onClick={() => reviewMutation.mutate()}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending ? (isFr ? "Envoi…" : "Sending…") : (isFr ? "Publier l'avis" : "Publish")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
