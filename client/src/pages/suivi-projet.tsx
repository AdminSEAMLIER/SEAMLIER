import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, CheckCircle2, Circle, Clock, User, Scissors,
  Calendar, MessageSquare, Star, Package, AlertCircle, Loader2, Euro,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ProjectWithTailor } from "@shared/schema";
import PaymentButton from "@/components/checkout-button";

const FABRICATION_STEPS = [
  { key: "prise_mesures", label: "Prise de mesures", icon: "📏" },
  { key: "choix_tissu",   label: "Choix du tissu",   icon: "🧵" },
  { key: "patronage",     label: "Patronage",         icon: "📐" },
  { key: "coupe",         label: "Coupe",             icon: "✂️" },
  { key: "assemblage",    label: "Assemblage",        icon: "🪡" },
  { key: "essayage",      label: "Essayage",          icon: "👗" },
  { key: "finitions",     label: "Finitions",         icon: "✨" },
  { key: "livraison",     label: "Prêt / Livraison",  icon: "📦" },
];

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:     { label: "En attente de devis", cls: "bg-gray-100 text-gray-700" },
    quoted:      { label: "Devis reçu",          cls: "bg-orange-100 text-orange-700" },
    in_progress: { label: "En confection",       cls: "bg-blue-100 text-blue-700" },
    completed:   { label: "Terminé",             cls: "bg-green-100 text-green-700" },
    cancelled:   { label: "Annulé",              cls: "bg-red-100 text-red-500" },
  };
  const s = map[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

export default function SuiviProjet() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const { data: projects = [], isLoading } = useQuery<ProjectWithTailor[]>({
    queryKey: ["/api/client/projects"],
  });

  const project = projects.find(p => p.id === id);
  const tailorName = project
    ? `${project.tailorUser?.firstName || ""} ${project.tailorUser?.lastName || ""}`.trim()
    : "";

  const { data: myReview } = useQuery<{ exists: boolean }>({
    queryKey: ["/api/reviews/my", id],
    queryFn: async () => {
      const res = await fetch(`/api/reviews/my/${id}`, { credentials: "include" });
      if (!res.ok) return { exists: false };
      return res.json();
    },
    enabled: !!id,
  });

  const confirmMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/projects/${id}/client-confirm`, { deadlineRespected: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      setShowConfirmModal(false);
      toast({ title: "Réception confirmée !", description: "Le paiement est libéré à l'artisan." });
      setTimeout(() => setShowReviewModal(true), 500);
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      if (!reviewComment.trim()) throw new Error("Commentaire requis");
      const res = await apiRequest("POST", "/api/reviews", {
        tailorId: project?.tailorId,
        projectId: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews/my", id] });
      if (project?.tailorId) {
        queryClient.invalidateQueries({ queryKey: ["/api/tailors", project.tailorId] });
      }
      setShowReviewModal(false);
      setReviewComment("");
      toast({ title: "Avis envoyé, merci !", description: "Il sera publié après modération." });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#722F37]" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4 text-center">
        <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
        <h2 className="font-serif text-2xl text-gray-700 mb-2">Projet introuvable</h2>
        <p className="text-gray-400 mb-6">Ce projet n'existe pas ou vous n'y avez pas accès.</p>
        <Link href="/mes-projets">
          <Button className="bg-[#722F37] text-white">Voir mes projets</Button>
        </Link>
      </div>
    );
  }

  const currentStepIndex = FABRICATION_STEPS.findIndex(s => s.key === (project.currentStep || "prise_mesures"));
  const isCompleted = project.status === "completed";
  const isLivraison = project.currentStep === "livraison" && !project.clientConfirmed;
  const canReview = isCompleted && !myReview?.exists;

  return (
    <div className="min-h-screen bg-white pb-20">

      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/mes-projets">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{project.title}</p>
            <p className="text-xs text-gray-500 truncate">avec {tailorName}</p>
          </div>
          {statusBadge(project.status)}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Photo du projet */}
        {project.modelPhotoUrl && (
          <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-[4/3] bg-gray-50">
            <img src={project.modelPhotoUrl} alt={project.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Infos rapides */}
        <div className="grid grid-cols-2 gap-3">
          {project.deadline && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="h-4 w-4 text-[#722F37]" />
                <span className="text-xs text-gray-500 font-medium">Livraison prévue</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(project.deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
              </p>
            </div>
          )}
          {project.amountArtisan != null && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Euro className="h-4 w-4 text-[#722F37]" />
                <span className="text-xs text-gray-500 font-medium">Montant</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{project.amountArtisan}€</p>
            </div>
          )}
          <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-[#722F37]" />
              <span className="text-xs text-gray-500 font-medium">Artisan</span>
            </div>
            <p className="text-sm font-semibold text-gray-900 truncate">{tailorName || "—"}</p>
          </div>
          {project.clothingType && (
            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Scissors className="h-4 w-4 text-[#722F37]" />
                <span className="text-xs text-gray-500 font-medium">Type</span>
              </div>
              <p className="text-sm font-semibold text-gray-900">{project.clothingType}</p>
            </div>
          )}
        </div>

        {/* Notes artisan */}
        {project.notes && (
          <div className="bg-[#722F37]/5 border border-[#722F37]/20 rounded-xl p-4">
            <p className="text-xs text-[#722F37] font-semibold mb-1.5">📝 Note de l'artisan</p>
            <p className="text-sm text-gray-700 leading-relaxed">{project.notes}</p>
          </div>
        )}

        {/* Timeline fabrication */}
        {project.status !== "pending" && project.status !== "quoted" && project.status !== "cancelled" && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Package className="h-4 w-4 text-[#722F37]" />
              Avancement de la confection
            </h2>
            <div className="space-y-4">
              {FABRICATION_STEPS.map((step, idx) => {
                const isDone = isCompleted ? true : idx < currentStepIndex;
                const isCurrent = !isCompleted && idx === currentStepIndex;
                const isUpcoming = !isCompleted && idx > currentStepIndex;
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm
                      ${isDone ? "bg-green-100 text-green-600" : isCurrent ? "bg-[#722F37] text-white" : "bg-gray-100 text-gray-400"}`}>
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <Clock className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${isDone ? "text-green-700" : isCurrent ? "text-[#722F37]" : "text-gray-400"}`}>
                        {step.icon} {step.label}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-[#722F37]/70 mt-0.5">Étape en cours</p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-semibold bg-[#722F37] text-white px-2 py-0.5 rounded-full">En cours</span>
                    )}
                    {isDone && (
                      <span className="text-[10px] font-semibold text-green-600">✓</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {(() => {
            const isPaid = ["paid", "client_confirmed", "transferred"].includes((project as any).paymentStatus ?? "");
            if ((isLivraison || canReview) && !isPaid) return (
              <div className="space-y-2">
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                  Veuillez régler le devis avant de confirmer la réception
                </p>
                {project.amount && project.amount > 0 && (
                  <PaymentButton
                    projectId={project.id}
                    prixConfection={project.amount}
                    planArtisan={(project as any).tailor?.subscriptionPlan ?? "starter"}
                    label="Payer le devis"
                  />
                )}
              </div>
            );
            return (
              <>
                {isLivraison && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12"
                    data-testid="button-confirm-reception"
                    onClick={() => setShowConfirmModal(true)}
                  >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Confirmer la réception
                  </Button>
                )}
                {canReview && (
                  <Button
                    variant="outline"
                    className="w-full border-[#722F37] text-[#722F37] hover:bg-[#722F37] hover:text-white h-12"
                    data-testid="button-leave-review"
                    onClick={() => setShowReviewModal(true)}
                  >
                    <Star className="h-5 w-5 mr-2" />
                    Laisser un avis
                  </Button>
                )}
              </>
            );
          })()}
          <Link href="/messages">
            <Button variant="outline" className="w-full h-11">
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter l'artisan
            </Button>
          </Link>
        </div>

      </div>

      {/* Modal confirmation réception */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-[#722F37]">Confirmer la réception</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600 text-sm leading-relaxed">
            En confirmant, vous attestez avoir bien reçu votre commande. Le paiement sera libéré à l'artisan. <strong>Cette action est irréversible.</strong>
          </p>
          <p className="text-xs text-gray-400">Vous avez 48h pour signaler tout problème à notre support.</p>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirmModal(false)}>Annuler</Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => confirmMutation.mutate()}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal avis */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-[#722F37]">Laisser un avis</DialogTitle>
          </DialogHeader>
          <p className="text-gray-500 text-sm">Votre avis sera publié après validation par l'équipe SEAMLIER.</p>
          <div className="flex gap-2 justify-center my-2">
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setReviewRating(n)}
                className={`text-2xl transition-transform hover:scale-110 ${n <= reviewRating ? "opacity-100" : "opacity-30"}`}
                data-testid={`star-rating-${n}`}
              >
                ⭐
              </button>
            ))}
          </div>
          <Textarea
            value={reviewComment}
            onChange={e => setReviewComment(e.target.value)}
            placeholder="Partagez votre expérience avec cet artisan…"
            className="min-h-[100px] text-sm"
            data-testid="textarea-review"
          />
          <div className="flex gap-3 mt-1">
            <Button variant="outline" className="flex-1" onClick={() => setShowReviewModal(false)}>Annuler</Button>
            <Button
              className="flex-1 bg-[#722F37] hover:bg-[#5e2530] text-white"
              onClick={() => reviewMutation.mutate()}
              disabled={reviewMutation.isPending || !reviewComment.trim()}
              data-testid="button-submit-review"
            >
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer l'avis"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
