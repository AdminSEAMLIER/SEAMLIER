import { useTranslation } from "react-i18next";
import { Calendar, MapPin, User, ChevronLeft, ChevronRight, Clock, Trash2, MessageSquare, Plus } from "lucide-react";
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
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import type { AppointmentWithClient } from "@shared/schema";

interface DisplayAppointment {
  id: string;
  client: string;
  typeKey: string;
  time: string;
  durationMin: number;
  location: string | null;
  date: string;
  notes: string | null;
  status: string;
  isLocal: boolean;
  isPast: boolean;
}

function localDate(d: Date): string {
  return d.toLocaleDateString("en-CA");
}

function toDisplay(apt: AppointmentWithClient): DisplayAppointment {
  const dt = new Date(apt.scheduledAt);
  const date = localDate(dt);
  const time = dt.toTimeString().slice(0, 5);
  const clientName = `${apt.client.firstName || ""} ${apt.client.lastName || ""}`.trim() || apt.client.email || "Client";
  return {
    id: apt.id,
    client: clientName,
    typeKey: apt.type,
    time,
    durationMin: apt.duration ?? 60,
    location: apt.location || null,
    date,
    notes: apt.notes || null,
    status: apt.status,
    isLocal: false,
    isPast: dt < new Date(),
  };
}

export default function ProPlanning() {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<DisplayAppointment | null>(null);
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newType, setNewType] = useState("consultation");
  const [newNotes, setNewNotes] = useState("");
  const [newLocation, setNewLocation] = useState("");

  const weekDaysFr = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weekDaysEn = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekDays = i18n.language === "fr" ? weekDaysFr : weekDaysEn;

  const { data: rawAppointments = [], isLoading } = useQuery<AppointmentWithClient[]>({
    queryKey: ["/api/tailor/appointments"],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/appointments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/appointments"] });
      setIsDetailOpen(false);
      setSelectedAppointment(null);
      toast({ title: t("pro.appointmentDeleted"), description: t("pro.appointmentDeletedDesc") });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de supprimer le rendez-vous.", variant: "destructive" });
    },
  });

  const { data: tailorClients = [] } = useQuery<Array<{ id: string; firstName?: string; lastName?: string; email?: string }>>({
    queryKey: ["/api/tailor/clients"],
  });

  const [newClientId, setNewClientId] = useState("");

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
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/appointments"] });
      setIsNewOpen(false);
      setNewClientId(""); setNewDate(""); setNewTime(""); setNewNotes(""); setNewLocation("");
      toast({ title: i18n.language === "fr" ? "Rendez-vous ajouté" : "Appointment added" });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible d'ajouter le rendez-vous.", variant: "destructive" });
    },
  });

  const confirmAppointmentMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return res.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tailor/appointments"] });
      setIsDetailOpen(false);
      toast({
        title: i18n.language === "fr"
          ? status === "confirmed" ? "Rendez-vous confirmé" : "Rendez-vous refusé"
          : status === "confirmed" ? "Appointment confirmed" : "Appointment declined"
      });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  const getTypeColor = (typeKey: string) => {
    switch (typeKey) {
      case "pro.fitting":
      case "fitting":
        return "bg-blue-100 text-blue-700";
      case "pro.measurements":
      case "measurements":
        return "bg-green-100 text-green-700";
      case "pro.consultation":
      case "consultation":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatDate = (date: Date) => {
    const locale = i18n.language === "fr" ? "fr-FR" : "en-US";
    return date.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  };

  const formatDuration = (min: number) => {
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${m}` : `${h}h`;
  };

  const getTypeLabel = (typeKey: string) => {
    const map: Record<string, string> = {
      fitting: i18n.language === "fr" ? "Essayage" : "Fitting",
      measurements: i18n.language === "fr" ? "Prise de mesures" : "Measurements",
      consultation: i18n.language === "fr" ? "Consultation" : "Consultation",
    };
    if (map[typeKey]) return map[typeKey];
    try { return t(typeKey); } catch { return typeKey; }
  };

  const displayAppointments: DisplayAppointment[] = rawAppointments.map(toDisplay);

  const selectedDateStr = localDate(selectedDate);
  const filteredAppointments = displayAppointments
    .filter((apt) => apt.date === selectedDateStr)
    .sort((a, b) => a.time.localeCompare(b.time));

  const goToPreviousDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const goToNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const datesWithAppointments = new Set(displayAppointments.map((a) => a.date));

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t("nav.planning")}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-6 py-6">
        <Card className="border border-gray-100 bg-white shadow-sm mb-6">
          <CardContent className="p-4 bg-white">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600"
                onClick={goToPreviousDay}
                data-testid="button-previous-day"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-medium text-[#722F37] capitalize text-sm">
                {formatDate(selectedDate)}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-600"
                onClick={goToNextDay}
                data-testid="button-next-day"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => {
                const ref = new Date(selectedDate);
                const dow = ref.getDay();
                const mondayOffset = dow === 0 ? -6 : 1 - dow;
                const date = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + mondayOffset + index);
                const isToday = date.toDateString() === new Date().toDateString();
                const isSelected = date.toDateString() === selectedDate.toDateString();
                const dateStr = localDate(date);
                const hasAppointments = datesWithAppointments.has(dateStr);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`p-2 rounded-lg text-center transition-colors relative ${
                      isSelected
                        ? "bg-[#722F37] text-white"
                        : isToday
                        ? "bg-[#722F37]/10 text-[#722F37]"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                    data-testid={`button-day-${index}`}
                  >
                    <p className="text-[10px] opacity-70">{day}</p>
                    <p className="text-sm font-medium">{date.getDate()}</p>
                    {hasAppointments && (
                      <span className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isSelected ? "bg-white" : "bg-[#722F37]"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium text-gray-900">{t("pro.todaysAppointments")}</h3>
            {isLoading ? (
              <p className="text-sm text-gray-400">Chargement…</p>
            ) : (
              <p className="text-sm text-gray-500">
                {filteredAppointments.length} {t("pro.appointments")}
              </p>
            )}
          </div>
          <Button
            size="sm"
            className="bg-[#722F37] hover:bg-[#5a252c] text-white gap-1"
            onClick={() => { setIsNewOpen(true); setNewDate(localDate(selectedDate)); }}
            data-testid="button-new-appointment"
          >
            <Plus className="h-4 w-4" />
            {i18n.language === "fr" ? "Nouveau RDV" : "New appointment"}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="border border-gray-100 shadow-sm animate-pulse">
                <CardContent className="p-4 bg-white h-20" />
              </Card>
            ))}
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8 bg-white text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t("pro.noAppointments")}</p>
              <p className="text-xs text-gray-400 mt-2">
                {i18n.language === "fr"
                  ? "Les clients peuvent prendre rendez-vous depuis votre profil."
                  : "Clients can book appointments from your profile page."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAppointments.map((apt) => (
            <Card
              key={apt.id}
              className={`border shadow-sm mb-3 cursor-pointer transition-colors ${apt.isPast ? "border-gray-100 bg-gray-50 opacity-60" : "border-gray-100 bg-white hover:border-[#722F37]/30"}`}
              data-testid={`card-appointment-${apt.id}`}
              onClick={() => { setSelectedAppointment(apt); setIsDetailOpen(true); }}
            >
              <CardContent className={`p-4 ${apt.isPast ? "bg-gray-50" : "bg-white"}`}>
                <div className="flex gap-4">
                  <div className="text-center min-w-[50px]">
                    <p className={`text-lg font-bold ${apt.isPast ? "text-gray-400" : "text-[#722F37]"}`}>{apt.time}</p>
                    <p className="text-xs text-gray-500">{formatDuration(apt.durationMin)}</p>
                  </div>
                  <div className="flex-1 border-l border-gray-100 pl-4">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={`${apt.isPast ? "bg-gray-100 text-gray-400" : getTypeColor(apt.typeKey)} border-none`}>
                        {getTypeLabel(apt.typeKey)}
                      </Badge>
                      {apt.isPast && (
                        <Badge className="bg-gray-100 text-gray-400 border-none text-xs">
                          {i18n.language === "fr" ? "Passé" : "Past"}
                        </Badge>
                      )}
                      {!apt.isPast && apt.status === "pending" && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-none text-xs">
                          {i18n.language === "fr" ? "En attente" : "Pending"}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {apt.client}
                      </span>
                      {apt.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {apt.location}
                        </span>
                      )}
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-gray-400 mt-1 italic">{apt.notes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-[#722F37]">{t("pro.appointmentDetails")}</DialogTitle>
          </DialogHeader>

          {selectedAppointment && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-center min-w-[60px]">
                  <p className="text-2xl font-bold text-[#722F37]">{selectedAppointment.time}</p>
                  <p className="text-xs text-gray-500">{formatDuration(selectedAppointment.durationMin)}</p>
                </div>
                <div className="flex-1 border-l border-gray-200 pl-4">
                  <Badge className={`${getTypeColor(selectedAppointment.typeKey)} border-none mb-2`}>
                    {getTypeLabel(selectedAppointment.typeKey)}
                  </Badge>
                  <p className="text-sm text-gray-500">{selectedAppointment.status}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-700">
                  <User className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t("pro.clientName")}</p>
                    <p className="font-medium">{selectedAppointment.client}</p>
                  </div>
                </div>

                {selectedAppointment.location && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500">{t("pro.location")}</p>
                      <p className="font-medium">{selectedAppointment.location}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-700">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t("pro.duration")}</p>
                    <p className="font-medium">{formatDuration(selectedAppointment.durationMin)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-gray-700">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">{t("pro.date")}</p>
                    <p className="font-medium">
                      {new Date(selectedAppointment.date).toLocaleDateString(
                        i18n.language === "fr" ? "fr-FR" : "en-US",
                        { weekday: "long", day: "numeric", month: "long" }
                      )}
                    </p>
                  </div>
                </div>

                {selectedAppointment.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      {i18n.language === "fr" ? "Note" : "Notes"}
                    </p>
                    <p className="text-sm text-gray-700 italic">{selectedAppointment.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedAppointment?.status === "scheduled" && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
              <p className="text-xs font-semibold text-yellow-800 mb-2">
                {i18n.language === "fr" ? "Demande de rendez-vous — à confirmer" : "Appointment request — confirm or decline"}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={confirmAppointmentMutation.isPending}
                  onClick={() => selectedAppointment && confirmAppointmentMutation.mutate({ id: selectedAppointment.id, status: "confirmed" })}
                  data-testid="button-confirm-appointment"
                >
                  {i18n.language === "fr" ? "Confirmer" : "Confirm"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                  disabled={confirmAppointmentMutation.isPending}
                  onClick={() => selectedAppointment && confirmAppointmentMutation.mutate({ id: selectedAppointment.id, status: "cancelled" })}
                  data-testid="button-decline-appointment"
                >
                  {i18n.language === "fr" ? "Refuser" : "Decline"}
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Link href="/messagerie" className="flex-1">
              <Button
                variant="outline"
                className="w-full gap-2 text-gray-500"
                data-testid="button-message-client"
              >
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
              {deleteMutation.isPending
                ? i18n.language === "fr" ? "Suppression…" : "Deleting…"
                : t("pro.deleteAppointment")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog nouveau RDV */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{i18n.language === "fr" ? "Nouveau rendez-vous" : "New appointment"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-sm mb-1 block">{i18n.language === "fr" ? "Type" : "Type"}</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger data-testid="select-new-rdv-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">{i18n.language === "fr" ? "Consultation" : "Consultation"}</SelectItem>
                  <SelectItem value="measurements">{i18n.language === "fr" ? "Prise de mesures" : "Measurements"}</SelectItem>
                  <SelectItem value="fitting">{i18n.language === "fr" ? "Essayage" : "Fitting"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-1 block">{i18n.language === "fr" ? "Client *" : "Client *"}</Label>
              <Select value={newClientId} onValueChange={setNewClientId}>
                <SelectTrigger data-testid="select-new-rdv-client">
                  <SelectValue placeholder={i18n.language === "fr" ? "Sélectionner un client…" : "Select a client…"} />
                </SelectTrigger>
                <SelectContent>
                  {tailorClients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {`${c.firstName || ""} ${c.lastName || ""}`.trim() || c.email || c.id}
                    </SelectItem>
                  ))}
                  {tailorClients.length === 0 && (
                    <SelectItem value="_empty" disabled>
                      {i18n.language === "fr" ? "Aucun client dans vos projets" : "No clients in your projects"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm mb-1 block">{i18n.language === "fr" ? "Date" : "Date"}</Label>
                <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} data-testid="input-new-rdv-date" />
              </div>
              <div>
                <Label className="text-sm mb-1 block">{i18n.language === "fr" ? "Heure" : "Time"}</Label>
                <Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} data-testid="input-new-rdv-time" />
              </div>
            </div>
            <div>
              <Label className="text-sm mb-1 block">{i18n.language === "fr" ? "Lieu" : "Location"} ({i18n.language === "fr" ? "optionnel" : "optional"})</Label>
              <Input
                placeholder={i18n.language === "fr" ? "Adresse ou lien visio…" : "Address or video link…"}
                value={newLocation}
                onChange={e => setNewLocation(e.target.value)}
                data-testid="input-new-rdv-location"
              />
            </div>
            <div>
              <Label className="text-sm mb-1 block">{i18n.language === "fr" ? "Notes" : "Notes"} ({i18n.language === "fr" ? "optionnel" : "optional"})</Label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} rows={2} data-testid="input-new-rdv-notes" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setIsNewOpen(false)}>
              {i18n.language === "fr" ? "Annuler" : "Cancel"}
            </Button>
            <Button
              className="flex-1 bg-[#722F37] hover:bg-[#5a252c] text-white"
              disabled={!newDate || !newTime || !newClientId || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              data-testid="button-confirm-new-rdv"
            >
              {createMutation.isPending ? (i18n.language === "fr" ? "Envoi…" : "Saving…") : (i18n.language === "fr" ? "Créer" : "Create")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
