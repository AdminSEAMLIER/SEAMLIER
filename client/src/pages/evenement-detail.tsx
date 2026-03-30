import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, Calendar, Users, Copy, Check, Clock, Megaphone,
  Loader2, Edit2, Save, X, MessageSquare, Share2, CheckCircle, XCircle, AlertCircle, Euro, Lock
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function EvenementDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState("");
  const [broadcastMsg, setBroadcastMsg] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);

  const { data: event, isLoading } = useQuery<any>({
    queryKey: ["/api/events", id],
    queryFn: async () => {
      const res = await fetch(`/api/events/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Événement introuvable");
      const d = await res.json();
      setDeadlineValue(d.registration_deadline ? d.registration_deadline.slice(0, 10) : "");
      return d;
    },
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", id] });
      setEditingDeadline(false);
      toast({ title: isFr ? "Mis à jour" : "Updated" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/events/${id}/broadcast`, { content });
      return res.json();
    },
    onSuccess: (data) => {
      setBroadcastMsg("");
      setShowBroadcast(false);
      toast({
        title: isFr ? "Message envoyé" : "Message sent",
        description: isFr ? `Envoyé à ${data.sent} participant(s)` : `Sent to ${data.sent} participant(s)`,
      });
    },
    onError: () => {
      toast({ title: "Erreur lors de l'envoi", variant: "destructive" });
    },
  });

  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const approveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/events/${id}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/events"] });
      toast({ title: isFr ? "Commande acceptée !" : "Order accepted!", description: isFr ? "Le client a été notifié avec le lien d'invitation." : "The client was notified with the invite link." });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/events/${id}/reject`, { reason: rejectReason || undefined });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/events"] });
      setShowRejectForm(false);
      toast({ title: isFr ? "Commande refusée" : "Order rejected" });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const handleCopyLink = async () => {
    if (!event) return;
    const link = `https://seamlier.fr/evenement/rejoindre/${event.invite_code}`;
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast({ title: isFr ? "Lien copié !" : "Link copied!", description: isFr ? "Partagez-le avec vos invités." : "Share it with guests." });
  };

  const handleCopyCode = async () => {
    if (!event) return;
    await navigator.clipboard.writeText(event.invite_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast({ title: isFr ? "Code copié !" : "Code copied!" });
  };

  const isTailorUser = event && user && event.tailor_user_id === user.id;
  const isOrganizer = event && user && event.organizer_id === user.id;
  const canEdit = isTailorUser || isOrganizer;

  const eventDateStr = event?.event_date
    ? new Date(event.event_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";
  const deadlineDateStr = event?.registration_deadline
    ? new Date(event.registration_deadline).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const today = new Date().toISOString().slice(0, 10);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#601B28]" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">{isFr ? "Événement introuvable." : "Event not found."}</p>
        <Button variant="outline" onClick={() => setLocation("/dashboard-client")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-800" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900 text-lg leading-tight">{event.name}</h1>
            <p className="text-xs text-gray-500">{isFr ? "Détail de l'événement" : "Event details"}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Status banner */}
        {event.status === "pending_tailor_approval" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="font-semibold text-amber-800 text-sm">
                {isTailorUser
                  ? (isFr ? "Demande en attente de votre validation" : "Request pending your approval")
                  : (isFr ? "En attente de validation par l'artisan" : "Pending tailor approval")}
              </span>
            </div>
            <p className="text-xs text-amber-700">
              {isTailorUser
                ? (isFr ? "Un client a soumis cette commande groupée. Consultez les détails et acceptez ou refusez." : "A client submitted this group order. Review the details and accept or decline.")
                : (isFr ? "L'artisan est en train de valider votre demande. Le lien d'invitation sera partagé dès acceptation." : "The artisan is reviewing your request. The invite link will be shared once accepted.")}
            </p>
          </div>
        )}
        {event.status === "rejected" && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-700 font-medium">
              {isFr ? "Cette commande groupée a été refusée par l'artisan." : "This group order was declined by the artisan."}
            </span>
          </div>
        )}
        {event.status === "active" && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800 font-medium">
              {isFr ? "Commande acceptée — les inscriptions sont ouvertes." : "Order accepted — registrations are open."}
            </span>
          </div>
        )}

        {/* Tailor approval card */}
        {isTailorUser && event.status === "pending_tailor_approval" && (
          <div className="bg-white rounded-2xl border border-[#601B28]/20 p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm">
              {isFr ? "Détails de la commande groupée" : "Group order details"}
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {event.max_participants && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Users className="h-4 w-4 text-[#601B28]" />
                  <span>{event.max_participants} {isFr ? "personnes" : "people"}</span>
                </div>
              )}
              {event.price_per_person && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Euro className="h-4 w-4 text-[#601B28]" />
                  <span>{event.price_per_person} € / {isFr ? "personne" : "person"}</span>
                </div>
              )}
              {event.price_group && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Euro className="h-4 w-4 text-[#601B28]" />
                  <span>{event.price_group} € {isFr ? "total groupe" : "group total"}</span>
                </div>
              )}
              {event.delivery_date && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-[#601B28]" />
                  <span>{isFr ? "Livraison : " : "Delivery: "}{new Date(event.delivery_date).toLocaleDateString("fr-FR")}</span>
                </div>
              )}
            </div>

            {!showRejectForm ? (
              <div className="flex gap-3">
                <Button
                  className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
                  onClick={() => approveMutation.mutate()}
                  disabled={approveMutation.isPending}
                  data-testid="button-approve-event"
                >
                  {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  {isFr ? "Accepter" : "Accept"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setShowRejectForm(true)}
                  data-testid="button-show-reject"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isFr ? "Refuser" : "Decline"}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Textarea
                  placeholder={isFr ? "Motif du refus (optionnel)…" : "Reason for declining (optional)…"}
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  rows={2}
                  data-testid="input-reject-reason"
                />
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                    onClick={() => rejectMutation.mutate()}
                    disabled={rejectMutation.isPending}
                    data-testid="button-confirm-reject"
                  >
                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFr ? "Confirmer le refus" : "Confirm decline")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)} data-testid="button-cancel-reject">
                    {isFr ? "Annuler" : "Cancel"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Date + info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-[#601B28]/10 rounded-xl p-3 shrink-0">
              <Calendar className="h-6 w-6 text-[#601B28]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 text-lg capitalize">{eventDateStr}</h2>
              {event.description && (
                <p className="text-sm text-gray-600 mt-1">{event.description}</p>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {event.participantCount ?? 0} {isFr ? "participant(s)" : "participant(s)"}
                </Badge>
                {event.tailor_first_name && (
                  <Badge variant="outline" className="text-xs">
                    ✂️ {event.tailor_first_name} {event.tailor_last_name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Deadline inscription */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#601B28]" />
              <span className="font-semibold text-gray-900 text-sm">
                {isFr ? "Date limite d'inscription" : "Registration deadline"}
              </span>
            </div>
            {canEdit && !editingDeadline && (
              <button
                onClick={() => setEditingDeadline(true)}
                className="text-gray-400 hover:text-[#601B28] transition-colors"
                data-testid="button-edit-deadline"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {editingDeadline ? (
            <div className="space-y-3">
              <Input
                type="date"
                value={deadlineValue}
                min={today}
                max={event.event_date?.slice(0, 10)}
                onChange={(e) => setDeadlineValue(e.target.value)}
                data-testid="input-deadline"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-[#601B28] hover:bg-[#4E1522] text-white"
                  onClick={() => updateMutation.mutate({ registrationDeadline: deadlineValue || null })}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-deadline"
                >
                  {updateMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
                  {isFr ? "Enregistrer" : "Save"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingDeadline(false)} data-testid="button-cancel-deadline">
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : deadlineDateStr ? (
            <p className="text-sm font-medium text-gray-800">{deadlineDateStr}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              {isFr ? "Aucune date limite définie" : "No deadline set"}
              {canEdit && (
                <button
                  onClick={() => setEditingDeadline(true)}
                  className="ml-2 text-[#601B28] underline text-xs"
                  data-testid="button-add-deadline"
                >
                  {isFr ? "Ajouter" : "Add"}
                </button>
              )}
            </p>
          )}
        </div>

        {/* Lien d'invitation — visible seulement si approuvé */}
        {(!event.status || event.status === "active") && <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Share2 className="h-4 w-4 text-[#601B28]" />
            <span className="font-semibold text-gray-900 text-sm">
              {isFr ? "Lien & code d'invitation" : "Invite link & code"}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600 font-mono truncate">
                https://seamlier.fr/evenement/rejoindre/{event.invite_code}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
                data-testid="button-copy-link"
              >
                {copiedLink ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{isFr ? "Code seul :" : "Code only:"}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-[#601B28] tracking-widest text-lg">{event.invite_code}</span>
                <button
                  onClick={handleCopyCode}
                  className="text-gray-400 hover:text-[#601B28] transition-colors"
                  data-testid="button-copy-code"
                >
                  {copiedCode ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Validation code — visible to organizer only */}
            {isOrganizer && event.validation_code && (
              <div className="mt-3 bg-[#601B28]/5 border border-[#601B28]/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="h-4 w-4 text-[#601B28]" />
                  <span className="text-sm font-semibold text-[#601B28]">
                    {isFr ? "Code de validation (privé)" : "Validation code (private)"}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  {isFr
                    ? "Communiquez ce code uniquement aux personnes que vous souhaitez intégrer à l'événement. Elles en auront besoin pour rejoindre."
                    : "Share this code only with people you want to join the event. They will need it to register."}
                </p>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-3xl tracking-[0.3em] text-[#601B28]">
                    {event.validation_code}
                  </span>
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(event.validation_code);
                      toast({ title: isFr ? "Code copié !" : "Code copied!" });
                    }}
                    className="text-gray-400 hover:text-[#601B28] transition-colors"
                    data-testid="button-copy-validation-code"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>}

        {/* Participants */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-4 w-4 text-[#601B28]" />
            <span className="font-semibold text-gray-900 text-sm">
              {isFr ? "Participants" : "Participants"} ({event.participants?.length ?? 0})
            </span>
          </div>
          {event.participants && event.participants.length > 0 ? (
            <div className="space-y-3">
              {event.participants.map((p: any) => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#601B28]/10 text-[#601B28] text-xs font-semibold">
                      {(p.first_name?.[0] || "?").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {p.first_name} {p.last_name}
                      {p.user_id === event.organizer_id && (
                        <span className="ml-2 text-xs text-[#601B28] font-normal">(organisateur)</span>
                      )}
                    </p>
                    {p.joined_at && (
                      <p className="text-xs text-gray-400">
                        {isFr ? "Inscrit le " : "Joined "}{new Date(p.joined_at).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                  {p.project_id && (
                    <Link
                      href={`/suivi-projet/${p.project_id}`}
                      className="ml-auto text-xs text-[#601B28] hover:underline flex items-center gap-1"
                      data-testid={`link-project-${p.user_id}`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      {isFr ? "Projet" : "Project"}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">{isFr ? "Aucun participant pour l'instant." : "No participants yet."}</p>
          )}
        </div>

        {/* Message groupé (tailor only) */}
        {isTailorUser && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-[#601B28]" />
                <span className="font-semibold text-gray-900 text-sm">
                  {isFr ? "Message groupé" : "Broadcast message"}
                </span>
              </div>
              <button
                onClick={() => setShowBroadcast(!showBroadcast)}
                className="text-xs text-[#601B28] hover:underline"
                data-testid="button-toggle-broadcast"
              >
                {showBroadcast ? (isFr ? "Annuler" : "Cancel") : (isFr ? "Rédiger" : "Compose")}
              </button>
            </div>
            {showBroadcast ? (
              <div className="space-y-3">
                <p className="text-xs text-gray-500">
                  {isFr
                    ? `Ce message sera envoyé en privé à chacun des ${(event.participants?.length ?? 1) - 1} participant(s).`
                    : `This message will be sent privately to each of the ${(event.participants?.length ?? 1) - 1} participant(s).`}
                </p>
                <Textarea
                  placeholder={isFr ? "Écrivez votre message pour tous les participants…" : "Write your message to all participants…"}
                  value={broadcastMsg}
                  onChange={(e) => setBroadcastMsg(e.target.value)}
                  rows={3}
                  data-testid="input-broadcast-message"
                />
                <Button
                  className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white"
                  onClick={() => broadcastMutation.mutate(broadcastMsg)}
                  disabled={!broadcastMsg.trim() || broadcastMutation.isPending}
                  data-testid="button-send-broadcast"
                >
                  {broadcastMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isFr ? "Envoi…" : "Sending…"}</>
                  ) : (
                    <><Megaphone className="h-4 w-4 mr-2" />{isFr ? "Envoyer à tous" : "Send to all"}</>
                  )}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {isFr
                  ? "Envoyez un message simultanément à tous les participants de cet événement."
                  : "Send a message to all event participants at once."}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.history.back()}
            data-testid="button-back-bottom"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isFr ? "Retour" : "Back"}
          </Button>
          {!isTailorUser && event.userHasJoined && event.participants?.find((p: any) => p.user_id === user?.id)?.project_id && (
            <Link
              href={`/suivi-projet/${event.participants.find((p: any) => p.user_id === user?.id)?.project_id}`}
              className="flex-1"
              data-testid="link-my-project"
            >
              <Button className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white">
                <MessageSquare className="h-4 w-4 mr-2" />
                {isFr ? "Mon projet" : "My project"}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
