import { useTranslation } from "react-i18next";
import {
  MessageSquare, Search, Send, Users, Headset, ArrowLeft,
  User, FolderKanban, Calendar, Ruler, Mail, Phone,
  MapPin, Clock, CheckCircle2, Circle, AlertCircle, AlertTriangle,
  StickyNote, ChevronDown, Tag,
} from "lucide-react";
import { renderMessageContent } from "@/lib/message-renderer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import type { ConversationWithParticipant, MessageWithSender } from "@shared/schema";

// ── Types CRM ───────────────────────────────────────────────────────────────
interface ClientSummary {
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    location: string | null;
    profileImageUrl: string | null;
    createdAt: string | null;
  };
  projects: Array<{
    id: string;
    title: string;
    status: string;
    clothingType: string | null;
    amount: number | null;
    amountArtisan: number | null;
    createdAt: string | null;
    deadline: string | null;
  }>;
  appointments: Array<{
    id: string;
    type: string;
    scheduledAt: string;
    duration: number | null;
    status: string;
    location: string | null;
    notes: string | null;
  }>;
  measurements: {
    neck: number | null;
    bust: number | null;
    waist: number | null;
    hips: number | null;
    shoulders: number | null;
    armLength: number | null;
    backLength: number | null;
    inseam: number | null;
    height: number | null;
    weight: number | null;
    updatedAt: string | null;
  } | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    pending:     { label: "En attente", variant: "secondary" },
    new:         { label: "Nouveau", variant: "secondary" },
    in_progress: { label: "En cours", variant: "default" },
    completed:   { label: "Terminé", variant: "outline" },
    cancelled:   { label: "Annulé", variant: "destructive" },
    scheduled:   { label: "Planifié", variant: "default" },
    done:        { label: "Fait", variant: "outline" },
  };
  const s = map[status] ?? { label: status, variant: "secondary" as const };
  return <Badge variant={s.variant} className="text-xs">{s.label}</Badge>;
}

function measureRow(label: string, value: number | null, unit = "cm") {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value} {unit}</span>
    </div>
  );
}

// ── Statut client ────────────────────────────────────────────────────────────
const CLIENT_STATUSES = [
  { value: "nouveau",  label: "Nouveau",  color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "fidele",   label: "Fidèle",   color: "bg-green-100 text-green-700 border-green-200" },
  { value: "vip",      label: "VIP",      color: "bg-amber-100 text-amber-700 border-amber-200" },
  { value: "inactif",  label: "Inactif",  color: "bg-gray-100 text-gray-600 border-gray-200" },
];

function clientStatusStyle(status: string) {
  return CLIENT_STATUSES.find(s => s.value === status) ?? CLIENT_STATUSES[0];
}

// ── Panneau Fiche Client ─────────────────────────────────────────────────────
function ClientFichePanel({ clientId, open, onClose }: { clientId: string; open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [noteText, setNoteText] = useState("");
  const [clientStatus, setClientStatus] = useState("nouveau");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const { data, isLoading } = useQuery<ClientSummary>({
    queryKey: ["/api/tailors/clients", clientId, "summary"],
    queryFn: async () => {
      const res = await fetch(`/api/tailors/clients/${clientId}/summary`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur lors du chargement de la fiche client");
      return res.json();
    },
    enabled: open && !!clientId,
  });

  const { data: noteData } = useQuery<{ note: string; clientStatus: string }>({
    queryKey: ["/api/tailors/client", clientId, "notes"],
    queryFn: async () => {
      const res = await fetch(`/api/tailors/client/${clientId}/notes`, { credentials: "include" });
      if (!res.ok) return { note: "", clientStatus: "nouveau" };
      return res.json();
    },
    enabled: open && !!clientId,
  });

  useEffect(() => {
    if (noteData) {
      setNoteText(noteData.note ?? "");
      setClientStatus(noteData.clientStatus ?? "nouveau");
    }
  }, [noteData]);

  const saveNotesMutation = useMutation({
    mutationFn: async (payload: { note: string; clientStatus: string }) => {
      const res = await fetch(`/api/tailors/client/${clientId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailors/client", clientId, "notes"] });
      toast({ title: "Note enregistrée", description: "La note a été sauvegardée." });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de sauvegarder.", variant: "destructive" }),
  });

  const saveStatus = (newStatus: string) => {
    setClientStatus(newStatus);
    setShowStatusMenu(false);
    saveNotesMutation.mutate({ note: noteText, clientStatus: newStatus });
  };

  // Calcul inactivité
  const lastProjectDate = data?.projects?.length
    ? new Date(Math.max(...data.projects.map(p => new Date(p.createdAt ?? 0).getTime())))
    : null;
  const monthsInactive = lastProjectDate
    ? Math.floor((Date.now() - lastProjectDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
    : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col overflow-hidden">
        {isLoading || !data ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">{isLoading ? "Chargement..." : "Aucune donnée"}</p>
          </div>
        ) : (
          <>
            {/* En-tête client */}
            <SheetHeader className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                  <AvatarImage src={data.client.profileImageUrl || undefined} />
                  <AvatarFallback className="bg-[#601B28]/10 text-[#601B28] text-lg font-semibold">
                    {(data.client.firstName || "?").charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <SheetTitle className="text-lg font-semibold text-gray-900">
                    {data.client.firstName} {data.client.lastName}
                  </SheetTitle>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                    {data.client.email && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Mail className="h-3 w-3" /> {data.client.email}
                      </span>
                    )}
                    {data.client.phone && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Phone className="h-3 w-3" /> {data.client.phone}
                      </span>
                    )}
                    {data.client.location && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="h-3 w-3" /> {data.client.location}
                      </span>
                    )}
                  </div>
                  {data.client.createdAt && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Client depuis {new Date(data.client.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                    </p>
                  )}
                  {/* Statut client avec menu */}
                  <div className="relative mt-1.5">
                    <button
                      onClick={() => setShowStatusMenu(v => !v)}
                      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer ${clientStatusStyle(clientStatus).color}`}
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {clientStatusStyle(clientStatus).label}
                      <ChevronDown className="h-2.5 w-2.5" />
                    </button>
                    {showStatusMenu && (
                      <div className="absolute left-0 top-7 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px] py-1">
                        {CLIENT_STATUSES.map(s => (
                          <button
                            key={s.value}
                            onClick={() => saveStatus(s.value)}
                            className={`w-full text-left text-xs px-3 py-1.5 hover:bg-gray-50 font-medium ${s.value === clientStatus ? "opacity-60" : ""}`}
                          >
                            <span className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full border text-[10px] ${s.color}`}>
                              {s.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Métriques rapides */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: "Projets", value: data.projects.length, icon: FolderKanban },
                  { label: "RDV", value: data.appointments.length, icon: Calendar },
                  { label: "Mesures", value: data.measurements ? "✓" : "–", icon: Ruler },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-white rounded-lg px-3 py-2 text-center border border-gray-100">
                    <Icon className="h-4 w-4 text-[#601B28] mx-auto mb-1" />
                    <p className="text-lg font-bold text-gray-900 leading-none">{value}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </SheetHeader>

            {/* Onglets */}
            <Tabs defaultValue="projects" className="flex flex-col flex-1 overflow-hidden">
              <TabsList className="flex w-full rounded-none border-b border-gray-100 bg-white px-2 h-10 flex-shrink-0">
                <TabsTrigger value="projects" className="flex-1 text-[11px] data-[state=active]:text-[#601B28] data-[state=active]:border-b-2 data-[state=active]:border-[#601B28] rounded-none">
                  Projets
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex-1 text-[11px] data-[state=active]:text-[#601B28] data-[state=active]:border-b-2 data-[state=active]:border-[#601B28] rounded-none">
                  RDV
                </TabsTrigger>
                <TabsTrigger value="measurements" className="flex-1 text-[11px] data-[state=active]:text-[#601B28] data-[state=active]:border-b-2 data-[state=active]:border-[#601B28] rounded-none">
                  Mesures
                </TabsTrigger>
                <TabsTrigger value="notes" className="flex-1 text-[11px] data-[state=active]:text-[#601B28] data-[state=active]:border-b-2 data-[state=active]:border-[#601B28] rounded-none">
                  Notes
                </TabsTrigger>
              </TabsList>

              {/* Projets */}
              <TabsContent value="projects" className="flex-1 overflow-y-auto p-4 space-y-3 mt-0">
                {monthsInactive !== null && monthsInactive >= 3 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
                    <p className="text-xs text-orange-700 font-medium">
                      Inactif depuis {monthsInactive} mois — pensez à recontacter ce client
                    </p>
                  </div>
                )}
                {data.projects.length === 0 ? (
                  <div className="text-center py-10">
                    <FolderKanban className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun projet avec ce client</p>
                  </div>
                ) : data.projects.map((p) => (
                  <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="font-medium text-gray-900 text-sm leading-tight">{p.title}</p>
                      {statusBadge(p.status)}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {p.clothingType && <span>{p.clothingType}</span>}
                      {p.amountArtisan != null && (
                        <span className="font-medium text-[#601B28]">{p.amountArtisan}€ perçus</span>
                      )}
                      {p.amount != null && p.amountArtisan == null && (
                        <span>{p.amount}€</span>
                      )}
                      {p.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(p.deadline).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      {p.createdAt && (
                        <span>Créé le {new Date(p.createdAt).toLocaleDateString("fr-FR")}</span>
                      )}
                    </div>
                  </div>
                ))}
              </TabsContent>

              {/* Rendez-vous */}
              <TabsContent value="appointments" className="flex-1 overflow-y-auto p-4 space-y-3 mt-0">
                {data.appointments.length === 0 ? (
                  <div className="text-center py-10">
                    <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucun rendez-vous avec ce client</p>
                  </div>
                ) : [...data.appointments]
                  .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
                  .map((appt) => {
                    const date = new Date(appt.scheduledAt);
                    const isPast = date < new Date();
                    return (
                      <div key={appt.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{appt.type}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                              {" · "}{date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              {appt.duration ? ` · ${appt.duration} min` : ""}
                            </p>
                          </div>
                          {statusBadge(appt.status)}
                        </div>
                        {appt.location && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" /> {appt.location}
                          </p>
                        )}
                        {appt.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">"{appt.notes}"</p>
                        )}
                      </div>
                    );
                  })}
              </TabsContent>

              {/* Mesures */}
              <TabsContent value="measurements" className="flex-1 overflow-y-auto p-4 mt-0">
                {!data.measurements ? (
                  <div className="text-center py-10">
                    <Ruler className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">Aucune mensuration enregistrée</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                    {data.measurements.updatedAt && (() => {
                      const sixMonthsAgo = new Date();
                      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                      const isOutdated = new Date(data.measurements!.updatedAt!) < sixMonthsAgo;
                      return (
                        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                          <p className="text-xs text-gray-400">
                            Mis à jour le {new Date(data.measurements!.updatedAt!).toLocaleDateString("fr-FR")}
                          </p>
                          {isOutdated && (
                            <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-orange-200">
                              <AlertTriangle className="h-3 w-3" />
                              Mesures à mettre à jour
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    {!data.measurements.updatedAt && null}
                    <div className="space-y-0">
                      {measureRow("Tour de cou", data.measurements.neck)}
                      {measureRow("Tour de poitrine", data.measurements.bust)}
                      {measureRow("Tour de taille", data.measurements.waist)}
                      {measureRow("Tour de hanches", data.measurements.hips)}
                      {measureRow("Largeur épaules", data.measurements.shoulders)}
                      {measureRow("Longueur bras", data.measurements.armLength)}
                      {measureRow("Longueur dos", data.measurements.backLength)}
                      {measureRow("Entrejambe", data.measurements.inseam)}
                      {measureRow("Taille", data.measurements.height)}
                      {measureRow("Poids", data.measurements.weight, "kg")}
                    </div>
                    {Object.entries(data.measurements)
                      .filter(([k, v]) => k !== "updatedAt" && v !== null)
                      .length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-4">Toutes les mesures sont vides</p>
                    )}
                  </div>
                )}
              </TabsContent>

              {/* Notes privées */}
              <TabsContent value="notes" className="flex-1 overflow-y-auto p-4 mt-0">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-[#601B28]" />
                    <p className="text-sm font-semibold text-gray-900">Notes privées</p>
                    <span className="text-[10px] text-gray-400 ml-1">(visibles uniquement par vous)</span>
                  </div>
                  <Textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Vos notes sur ce client (préférences, historique, remarques…)"
                    className="min-h-[180px] text-sm resize-none border-gray-200 focus:border-[#601B28]"
                  />
                  <Button
                    className="w-full bg-[#601B28] hover:bg-[#5e2530] text-white"
                    onClick={() => saveNotesMutation.mutate({ note: noteText, clientStatus })}
                    disabled={saveNotesMutation.isPending}
                  >
                    {saveNotesMutation.isPending ? "Enregistrement…" : "Enregistrer la note"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Page principale ──────────────────────────────────────────────────────────
export default function ProMessagerie() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const search = useSearch();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showClientFiche, setShowClientFiche] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], isLoading } = useQuery<ConversationWithParticipant[]>({
    queryKey: ["/api/conversations"],
  });

  useEffect(() => {
    if (!search) return;
    const params = new URLSearchParams(search);
    const convId = params.get("conv");
    if (convId) setSelectedConversationId(convId);
  }, [search]);

  const { data: messages = [], isLoading: messagesLoading } = useQuery<MessageWithSender[]>({
    queryKey: ["/api/messages", selectedConversationId],
    enabled: !!selectedConversationId,
    queryFn: async () => {
      const res = await fetch(`/api/messages/${selectedConversationId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    refetchInterval: 4000,
  });

  const selectedConversation = conversations.find(c => c.id === selectedConversationId);

  useEffect(() => {
    if (!user?.id) return;
    apiRequest("PATCH", "/api/messages/all/read", {})
      .then(() => queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] }))
      .catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    if (selectedConversationId && user?.id) {
      apiRequest("PATCH", `/api/messages/${selectedConversationId}/read`, {})
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        })
        .catch(() => {});
    }
  }, [messages, selectedConversationId]);

  const contactSupportMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/support/conversation", {});
      return res.json();
    },
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setSelectedConversationId(data.id);
      toast({ title: "Support", description: "Conversation avec le support ouverte." });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error?.message || "Impossible de contacter le support", variant: "destructive" });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/messages", {
        conversationId: selectedConversationId,
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages", selectedConversationId] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'envoyer le message", variant: "destructive" });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversationId) return;
    sendMessageMutation.mutate(newMessage.trim());
    setNewMessage("");
  };

  const handleOpenConversation = (convId: string) => {
    setSelectedConversationId(convId);
    setShowClientFiche(false);
    apiRequest("PATCH", `/api/messages/${convId}/read`, {})
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations/unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      })
      .catch(() => {});
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-[#601B28]" />
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">
                {t('nav.messaging')}
              </h1>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1.5 border-[#601B28]/30 text-[#601B28] hover:bg-[#601B28]/5"
              onClick={() => contactSupportMutation.mutate()}
              disabled={contactSupportMutation.isPending}
              data-testid="button-contact-support"
            >
              <Headset className="h-3.5 w-3.5" />
              Support
            </Button>
          </div>
          <p className="text-gray-600 mt-2">
            {t('pro.searchConversations')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        {!selectedConversationId ? (
          <>
            {isLoading ? (
              <Card className="border border-gray-100 bg-white shadow-sm">
                <CardContent className="p-8 bg-white text-center">
                  <p className="text-gray-500">{t('common.loading')}</p>
                </CardContent>
              </Card>
            ) : conversations.length === 0 ? (
              <Card className="border border-gray-100 bg-white shadow-sm">
                <CardContent className="p-12 bg-white text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-serif text-xl text-[#601B28] mb-2">
                    {t('pro.noMessagesTitle')}
                  </h3>
                  <p className="text-gray-500 mb-2">{t('pro.noMessagesDesc')}</p>
                  <p className="text-gray-400 text-sm">{t('pro.noMessagesHint')}</p>
                </CardContent>
              </Card>
            ) : (
              conversations.map((conv) => (
                <Card
                  key={conv.id}
                  className="border border-gray-100 bg-white shadow-sm mb-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOpenConversation(conv.id)}
                  data-testid={`conversation-${conv.id}`}
                >
                  <CardContent className="p-4 bg-white">
                    <div className="flex gap-3">
                      <Avatar className="h-12 w-12 border border-gray-100 flex-shrink-0">
                        <AvatarImage src={conv.otherParticipant.profileImageUrl || undefined} />
                        <AvatarFallback className="bg-[#601B28]/10 text-[#601B28]">
                          {(conv.otherParticipant.firstName || "?").charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 truncate">
                            {[conv.otherParticipant.firstName, conv.otherParticipant.lastName].filter(Boolean).join(" ")}
                          </span>
                          {conv.lastMessageAt && (
                            <span className="text-xs text-gray-400 flex-shrink-0">
                              {new Date(conv.lastMessageAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">{conv.lastMessagePreview || "Aucun message"}</p>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-[#601B28] text-white text-xs flex items-center justify-center flex-shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </>
        ) : !selectedConversation ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <Button variant="ghost" onClick={() => setSelectedConversationId(null)} className="mb-4 text-gray-500" data-testid="button-back-loading">
                <ArrowLeft className="h-4 w-4 mr-2" /> Retour
              </Button>
              <p className="text-gray-400">Chargement de la conversation...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="border border-gray-100 bg-white shadow-sm">
              <CardHeader className="border-b border-gray-100 py-3 px-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedConversationId(null)}
                    className="text-gray-500"
                    data-testid="button-back-messages"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar className="h-10 w-10 border border-gray-100">
                    <AvatarImage src={selectedConversation.otherParticipant.profileImageUrl || undefined} />
                    <AvatarFallback className="bg-[#601B28]/10 text-[#601B28]">
                      {(selectedConversation.otherParticipant.firstName || "?").charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {[selectedConversation.otherParticipant.firstName, selectedConversation.otherParticipant.lastName].filter(Boolean).join(" ")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {selectedConversation.otherParticipant.location || "Client"}
                    </p>
                  </div>
                  {/* Bouton Fiche client */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs border-[#601B28]/30 text-[#601B28] hover:bg-[#601B28]/5 flex-shrink-0"
                    onClick={() => setShowClientFiche(true)}
                    data-testid="button-open-client-fiche"
                  >
                    <User className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Fiche client</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {messagesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 text-sm">Chargement...</p>
                    </div>
                  ) : messages.length > 0 ? (
                    <>
                      {messages.map((msg) => {
                        const isSent = msg.senderId !== selectedConversation.otherParticipant.id;
                        return (
                          <div key={msg.id} className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                isSent
                                  ? 'bg-[#601B28] text-white rounded-br-sm'
                                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                              }`}
                              data-testid={`message-${msg.id}`}
                            >
                              <div className="text-sm">{renderMessageContent(msg.content, isSent)}</div>
                              <p className={`text-[10px] mt-1 ${isSent ? 'text-white/70' : 'text-gray-400'}`}>
                                {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ""}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-400 text-sm">Envoyez votre premier message</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      placeholder="Écrivez votre message..."
                      className="flex-1 border-gray-200"
                      data-testid="input-message"
                    />
                    <Button
                      className="bg-[#601B28] hover:bg-[#4E1522]"
                      size="icon"
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      data-testid="button-send"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Panneau CRM */}
            <ClientFichePanel
              clientId={selectedConversation.otherParticipant.id}
              open={showClientFiche}
              onClose={() => setShowClientFiche(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
