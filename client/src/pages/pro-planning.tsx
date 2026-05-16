import { useTranslation } from "react-i18next";
import {
  Calendar, MapPin, User, ChevronLeft, ChevronRight,
  Clock, Trash2, MessageSquare, Plus, CheckCircle2,
  XCircle, AlertCircle, Bell,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { AppointmentWithClient } from "@shared/schema";

// ── Types ────────────────────────────────────────────────────────────────────
interface DisplayAppointment {
  id: string;
  clientId: string;
  client: string;
  typeKey: string;
  time: string;
  durationMin: number;
  location: string | null;
  date: string; // YYYY-MM-DD
  notes: string | null;
  status: string;
  isPast: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function localDate(d: Date): string {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function toDisplay(apt: AppointmentWithClient): DisplayAppointment {
  const dt = new Date(apt.scheduledAt);
  return {
    id: apt.id,
    clientId: apt.clientId,
    client: `${apt.client.firstName || ""} ${apt.client.lastName || ""}`.trim() || apt.client.email || "Client",
    typeKey: apt.type,
    time: dt.toTimeString().slice(0, 5),
    durationMin: apt.duration ?? 60,
    location: apt.location || null,
    date: localDate(dt),
    notes: apt.notes || null,
    status: apt.status,
    isPast: dt < new Date(),
  };
}

function formatDuration(min: number) {
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60), m = min % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function formatDateFr(dateStr: string, timeStr?: string) {
  const d = new Date(dateStr + "T12:00:00");
  const datePart = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return timeStr ? `${datePart} à ${timeStr}` : datePart;
}

// Couleur point calendrier par statut
function statusDot(status: string, isPast: boolean) {
  if (isPast || status === "cancelled") return "bg-gray-300";
  if (status === "confirmed") return "bg-green-500";
  if (status === "pending") return "bg-orange-400";
  return "bg-blue-400"; // scheduled (artisan-created)
}

// Badge statut
function StatusBadge({ status, isPast }: { status: string; isPast: boolean }) {
  if (isPast) return <Badge className="bg-gray-100 text-gray-400 border-none text-xs">Passé</Badge>;
  if (status === "confirmed") return <Badge className="bg-green-100 text-green-700 border-none text-xs">Confirmé</Badge>;
  if (status === "cancelled") return <Badge className="bg-gray-100 text-gray-500 border-none text-xs">Annulé</Badge>;
  if (status === "pending") return <Badge className="bg-orange-100 text-orange-700 border-none text-xs">En attente</Badge>;
  return <Badge className="bg-blue-100 text-blue-700 border-none text-xs">Planifié</Badge>;
}

function getTypeLabel(typeKey: string, fr: boolean) {
  const map: Record<string, [string, string]> = {
    fitting: ["Essayage", "Fitting"],
    measurements: ["Prise de mesures", "Measurements"],
    consultation: ["Consultation", "Consultation"],
  };
  return map[typeKey]?.[fr ? 0 : 1] ?? typeKey;
}

function getTypeColor(typeKey: string) {
  if (typeKey === "fitting") return "bg-blue-100 text-blue-700";
  if (typeKey === "measurements") return "bg-green-100 text-green-700";
  if (typeKey === "consultation") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function ProPlanning() {
  const { t, i18n } = useTranslation();
  const fr = i18n.language === "fr";
  const { toast } = useToast();

  // État calendrier
  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(localDate(new Date()));

  // Dialogs
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<DisplayAppointment | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState("consultation");
  const [newNotes, setNewNotes] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newClientId, setNewClientId] = useState("");

  // Données
  const { data: rawAppointments = [], isLoading } = useQuery<AppointmentWithClient[]>({
    queryKey: ["/api/tailors/appointments"],
  });
  const { data: tailorClients = [] } = useQuery<Array<{ id: string; firstName?: string; lastName?: string; email?: string }>>({
    queryKey: ["/api/tailors/clients"],
  });

  const displayAppointments: DisplayAppointment[] = rawAppointments.map(toDisplay);

  // RDV en attente de validation (toutes dates, non passés)
  const pendingAppointments = displayAppointments.filter(
    apt => apt.status === "pending" && !apt.isPast
  ).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  // ── Mutations ─────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailors/appointments"] });
      setIsDetailOpen(false);
      toast({ title: fr ? "Rendez-vous supprimé" : "Appointment deleted" });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/appointments/${id}`, { status }).then(r => r.json()),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailors/appointments"] });
      setIsDetailOpen(false);
      const label = status === "confirmed"
        ? (fr ? "Rendez-vous confirmé — le client a été notifié" : "Appointment confirmed")
        : (fr ? "Rendez-vous refusé" : "Appointment declined");
      toast({ title: label });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!newDate || !newTime || !newClientId) throw new Error("Client, date et heure requis");
      const scheduledAt = new Date(`${newDate}T${newTime}`).toISOString();
      const profileRes = await apiRequest("GET", "/api/user/me/tailor");
      const profile = await profileRes.json();
      const res = await apiRequest("POST", "/api/appointments", {
        tailorId: profile.id,
        clientId: newClientId,
        scheduledAt,
        type: newType,
        duration: 60,
        notes: newNotes || null,
        location: newLocation || null,
        status: "scheduled",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailors/appointments"] });
      setIsNewOpen(false);
      setNewClientId(""); setNewDate(""); setNewTime(""); setNewNotes(""); setNewLocation("");
      toast({ title: fr ? "Rendez-vous créé" : "Appointment created" });
    },
    onError: (err: any) => toast({ title: "Erreur", description: err?.message, variant: "destructive" }),
  });

  // ── Calendrier mensuel ────────────────────────────────────────────────────
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

  const aptsByDate = displayAppointments.reduce<Record<string, DisplayAppointment[]>>((acc, apt) => {
    (acc[apt.date] ??= []).push(apt);
    return acc;
  }, {});

  const dayHeaders = fr
    ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const monthLabel = new Date(year, month, 1).toLocaleDateString(fr ? "fr-FR" : "en-US", { month: "long", year: "numeric" });

  const goToPrevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const goToNextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  const filteredAppointments = (aptsByDate[selectedDate] ?? [])
    .sort((a, b) => a.time.localeCompare(b.time));

  const todayStr = localDate(new Date());

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      {/* En-tête */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]">
              {t("nav.planning")}
            </h1>
            {pendingAppointments.length > 0 && (
              <span className="ml-1 flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold">
                {pendingAppointments.length}
              </span>
            )}
          </div>
          {/* Légende statuts */}
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> {fr ? "Confirmé" : "Confirmed"}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> {fr ? "En attente" : "Pending"}</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" /> {fr ? "Annulé / Passé" : "Cancelled / Past"}</span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6 space-y-6">

        {/* ── Section RDV en attente de confirmation ── */}
        {pendingAppointments.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="h-4 w-4 text-orange-600" />
              <h3 className="font-semibold text-orange-800 text-sm">
                {pendingAppointments.length === 1
                  ? "1 rendez-vous en attente de votre confirmation"
                  : `${pendingAppointments.length} rendez-vous en attente de votre confirmation`}
              </h3>
            </div>
            <div className="space-y-3">
              {pendingAppointments.map(apt => (
                <div
                  key={apt.id}
                  className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4"
                  data-testid={`pending-card-${apt.id}`}
                >
                  {/* Infos RDV */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-shrink-0 text-center min-w-[52px] bg-white rounded-lg py-1.5 px-1 border border-orange-200">
                      <p className="text-base font-bold text-[#601B28] leading-none">{apt.time}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDuration(apt.durationMin)}</p>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <Badge className={`${getTypeColor(apt.typeKey)} border-none text-xs`}>
                          {getTypeLabel(apt.typeKey, fr)}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-gray-400" />
                        {apt.client}
                      </p>
                      <p className="text-xs text-orange-700 font-medium mt-0.5">
                        {formatDateFr(apt.date, apt.time)}
                      </p>
                      {apt.notes && (
                        <p className="text-xs text-gray-500 italic mt-0.5">"{apt.notes}"</p>
                      )}
                    </div>
                  </div>
                  {/* Boutons inline */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold gap-1.5 h-9"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: apt.id, status: "confirmed" })}
                      data-testid={`button-confirm-pending-${apt.id}`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmer le RDV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-300 bg-white text-red-600 hover:bg-red-50 font-semibold gap-1.5 h-9"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: apt.id, status: "cancelled" })}
                      data-testid={`button-decline-pending-${apt.id}`}
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Calendrier mensuel ── */}
        <Card className="border border-gray-100 bg-white shadow-sm">
          <CardContent className="p-4 bg-white">
            {/* Navigation mois */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" className="text-gray-600" onClick={goToPrevMonth} data-testid="button-prev-month">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-medium text-[#601B28] capitalize text-sm">{monthLabel}</h3>
              <Button variant="ghost" size="icon" className="text-gray-600" onClick={goToNextMonth} data-testid="button-next-month">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* En-têtes jours */}
            <div className="grid grid-cols-7 mb-1">
              {dayHeaders.map(d => (
                <div key={d} className="text-center text-[10px] font-medium text-gray-400 py-1">{d}</div>
              ))}
            </div>

            {/* Grille jours */}
            <div className="grid grid-cols-7 gap-px">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayApts = aptsByDate[dateStr] ?? [];
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const hasPending = dayApts.some(a => a.status === "pending" && !a.isPast);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative rounded-lg p-1.5 text-center transition-colors min-h-[44px] flex flex-col items-center justify-start ${
                      isSelected
                        ? "bg-[#601B28] text-white"
                        : hasPending
                        ? "bg-orange-50 border border-orange-200 text-gray-800 font-semibold"
                        : isToday
                        ? "bg-[#601B28]/10 text-[#601B28] font-semibold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                    data-testid={`button-day-${dateStr}`}
                  >
                    <span className="text-xs font-medium leading-none mb-1">{day}</span>
                    {dayApts.length > 0 && (
                      <div className="flex gap-px flex-wrap justify-center">
                        {dayApts.slice(0, 3).map((apt) => (
                          <span
                            key={apt.id}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected ? "bg-white/80" : statusDot(apt.status, apt.isPast)
                            }`}
                          />
                        ))}
                        {dayApts.length > 3 && (
                          <span className={`text-[8px] leading-none ${isSelected ? "text-white/70" : "text-gray-400"}`}>
                            +{dayApts.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* ── Liste RDV du jour sélectionné ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-900">
                {new Date(selectedDate + "T12:00:00").toLocaleDateString(fr ? "fr-FR" : "en-US", {
                  weekday: "long", day: "numeric", month: "long"
                })}
              </h3>
              <p className="text-sm text-gray-400">
                {isLoading ? (fr ? "Chargement…" : "Loading…") : `${filteredAppointments.length} ${fr ? "rendez-vous" : "appointment(s)"}`}
              </p>
            </div>
            <Button
              size="sm"
              className="bg-[#601B28] hover:bg-[#4E1522] text-white gap-1"
              onClick={() => { setIsNewOpen(true); setNewDate(selectedDate); }}
              data-testid="button-new-appointment"
            >
              <Plus className="h-4 w-4" />
              {fr ? "Nouveau RDV" : "New"}
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <Card key={i} className="border border-gray-100 animate-pulse">
                  <CardContent className="p-4 bg-white h-20" />
                </Card>
              ))}
            </div>
          ) : filteredAppointments.length === 0 ? (
            <Card className="border border-gray-100 bg-white shadow-sm">
              <CardContent className="p-8 bg-white text-center">
                <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">{fr ? "Aucun rendez-vous ce jour" : "No appointments this day"}</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.map(apt => (
                <Card
                  key={apt.id}
                  className={`border shadow-sm cursor-pointer transition-colors ${
                    apt.status === "pending" && !apt.isPast
                      ? "border-orange-300 bg-orange-50/40 hover:border-orange-400"
                      : apt.isPast || apt.status === "cancelled"
                      ? "border-gray-100 bg-gray-50/60 opacity-70"
                      : "border-gray-100 bg-white hover:border-[#601B28]/30 hover:shadow-md"
                  }`}
                  onClick={() => { setSelectedAppointment(apt); setIsDetailOpen(true); }}
                  data-testid={`card-appointment-${apt.id}`}
                >
                  <CardContent className="p-4 bg-transparent">
                    <div className="flex gap-4 items-center">
                      {/* Indicateur pending */}
                      {apt.status === "pending" && !apt.isPast && (
                        <AlertCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      )}
                      {/* Heure */}
                      <div className={`text-center min-w-[52px] ${apt.status === "pending" && !apt.isPast ? "" : ""}`}>
                        <p className={`text-lg font-bold leading-none ${apt.isPast || apt.status === "cancelled" ? "text-gray-400" : apt.status === "pending" ? "text-orange-600" : "text-[#601B28]"}`}>
                          {apt.time}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatDuration(apt.durationMin)}</p>
                      </div>
                      {/* Détails */}
                      <div className="flex-1 border-l border-gray-100 pl-4">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <Badge className={`${getTypeColor(apt.typeKey)} border-none text-xs`}>
                            {getTypeLabel(apt.typeKey, fr)}
                          </Badge>
                          <StatusBadge status={apt.status} isPast={apt.isPast} />
                        </div>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1"><User className="h-3 w-3" />{apt.client}</span>
                          {apt.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{apt.location}</span>}
                        </div>
                        {apt.notes && <p className="text-xs text-gray-400 mt-1 italic">"{apt.notes}"</p>}
                        {apt.status === "pending" && !apt.isPast && (
                          <p className="text-xs text-orange-600 font-medium mt-1">
                            Cliquez pour confirmer ou refuser
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Dialog détail RDV ── */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#601B28]">{t("pro.appointmentDetails")}</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-2">
              {/* Résumé */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="text-center min-w-[60px]">
                  <p className="text-2xl font-bold text-[#601B28]">{selectedAppointment.time}</p>
                  <p className="text-xs text-gray-500">{formatDuration(selectedAppointment.durationMin)}</p>
                </div>
                <div className="flex-1 border-l border-gray-200 pl-4">
                  <Badge className={`${getTypeColor(selectedAppointment.typeKey)} border-none mb-2`}>
                    {getTypeLabel(selectedAppointment.typeKey, fr)}
                  </Badge>
                  <div className="mt-1">
                    <StatusBadge status={selectedAppointment.status} isPast={selectedAppointment.isPast} />
                  </div>
                </div>
              </div>

              {/* Infos */}
              <div className="space-y-3">
                <InfoRow icon={<User className="h-4 w-4 text-gray-400" />} label={t("pro.clientName")} value={selectedAppointment.client} />
                <InfoRow icon={<Calendar className="h-4 w-4 text-gray-400" />} label={t("pro.date")} value={
                  new Date(selectedAppointment.date + "T12:00:00").toLocaleDateString(fr ? "fr-FR" : "en-US", { weekday: "long", day: "numeric", month: "long" })
                } />
                <InfoRow icon={<Clock className="h-4 w-4 text-gray-400" />} label={t("pro.duration")} value={formatDuration(selectedAppointment.durationMin)} />
                {selectedAppointment.location && (
                  <InfoRow icon={<MapPin className="h-4 w-4 text-gray-400" />} label={t("pro.location")} value={selectedAppointment.location} />
                )}
              </div>

              {selectedAppointment.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-400 mb-1">{fr ? "Note" : "Notes"}</p>
                  <p className="text-sm text-gray-700 italic">"{selectedAppointment.notes}"</p>
                </div>
              )}

              {/* ── Bloc validation PENDING ── */}
              {selectedAppointment.status === "pending" && !selectedAppointment.isPast && (
                <div className="rounded-xl border-2 border-orange-300 bg-orange-50 p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-orange-900">
                        Ce rendez-vous attend votre confirmation
                      </p>
                      <p className="text-xs text-orange-700 mt-0.5">
                        {selectedAppointment.client} a demandé un créneau le{" "}
                        {formatDateFr(selectedAppointment.date, selectedAppointment.time)}.
                        Le client sera notifié de votre réponse.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold gap-2 h-10"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: selectedAppointment.id, status: "confirmed" })}
                      data-testid="button-confirm-appointment"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmer le RDV
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-red-300 bg-white text-red-600 hover:bg-red-50 font-semibold gap-2 h-10"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: selectedAppointment.id, status: "cancelled" })}
                      data-testid="button-decline-appointment"
                    >
                      <XCircle className="h-4 w-4" />
                      Refuser
                    </Button>
                  </div>
                </div>
              )}

              {/* Bloc confirmation pour les RDV scheduled (créés par l'artisan) */}
              {selectedAppointment.status === "scheduled" && !selectedAppointment.isPast && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-semibold text-blue-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {fr ? "En attente de confirmation du client" : "Awaiting client confirmation"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1.5"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: selectedAppointment.id, status: "confirmed" })}
                      data-testid="button-confirm-appointment-scheduled"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {fr ? "Confirmer" : "Confirm"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-red-200 text-red-600 hover:bg-red-50 gap-1.5"
                      disabled={statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: selectedAppointment.id, status: "cancelled" })}
                      data-testid="button-decline-appointment-scheduled"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      {fr ? "Annuler" : "Cancel"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <Link href="/messagerie" className="flex-1">
              <Button variant="outline" className="w-full gap-2 text-gray-500" data-testid="button-message-client">
                <MessageSquare className="h-4 w-4" />
                {t("pro.messageClient")}
              </Button>
            </Link>
            <Button
              variant="outline"
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
              disabled={deleteMutation.isPending}
              onClick={() => selectedAppointment && deleteMutation.mutate(selectedAppointment.id)}
              data-testid="button-delete-appointment"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isPending ? (fr ? "Suppression…" : "Deleting…") : t("pro.deleteAppointment")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Dialog nouveau RDV ── */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{fr ? "Nouveau rendez-vous" : "New appointment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm mb-1 block">{fr ? "Type" : "Type"}</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger data-testid="select-new-rdv-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">{fr ? "Consultation" : "Consultation"}</SelectItem>
                  <SelectItem value="measurements">{fr ? "Prise de mesures" : "Measurements"}</SelectItem>
                  <SelectItem value="fitting">{fr ? "Essayage" : "Fitting"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1 block">{fr ? "Client *" : "Client *"}</Label>
              <Select value={newClientId} onValueChange={setNewClientId}>
                <SelectTrigger data-testid="select-new-rdv-client">
                  <SelectValue placeholder={fr ? "Sélectionner un client…" : "Select a client…"} />
                </SelectTrigger>
                <SelectContent>
                  {tailorClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {`${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || c.id}
                    </SelectItem>
                  ))}
                  {tailorClients.length === 0 && (
                    <SelectItem value="_empty" disabled>
                      {fr ? "Aucun client dans vos projets" : "No clients yet"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm mb-1 block">{fr ? "Date" : "Date"}</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} data-testid="input-new-rdv-date" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">{fr ? "Heure" : "Time"}</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} data-testid="input-new-rdv-time" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1 block">{fr ? "Lieu (optionnel)" : "Location (optional)"}</Label>
              <Input
                placeholder={fr ? "Adresse ou lien visio…" : "Address or video link…"}
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                data-testid="input-new-rdv-location"
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">{fr ? "Notes (optionnel)" : "Notes (optional)"}</Label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} data-testid="input-new-rdv-notes" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsNewOpen(false)}>
              {fr ? "Annuler" : "Cancel"}
            </Button>
            <Button
              className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
              disabled={!newDate || !newTime || !newClientId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              data-testid="button-confirm-new-rdv"
            >
              {createMutation.isPending ? (fr ? "Envoi…" : "Saving…") : (fr ? "Créer" : "Create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Petite ligne d'info réutilisable
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-gray-700">
      {icon}
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium capitalize">{value}</p>
      </div>
    </div>
  );
}
