import { useState } from "react";
import { useSearch, useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calendar, MapPin, Clock, CheckCircle, Loader2, ArrowLeft, Scissors, ChevronLeft, ChevronRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { addDays, format, startOfWeek, isSameDay, isBefore, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

const APPOINTMENT_TYPES = [
  { value: "consultation", labelFr: "Consultation initiale", labelEn: "Initial consultation" },
  { value: "measurements", labelFr: "Prise de mesures", labelEn: "Measurements session" },
  { value: "fitting", labelFr: "Essayage", labelEn: "Fitting session" },
];

function WeekCalendar({ selectedDate, onSelectDate }: { selectedDate: Date | null; onSelectDate: (d: Date) => void }) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const today = startOfDay(new Date());
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(d => addDays(d, -7))}
          disabled={isBefore(addDays(weekStart, 6), today)}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-30"
          data-testid="button-prev-week"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
          {format(weekStart, "MMMM yyyy", { locale: fr })}
        </span>
        <button
          onClick={() => setWeekStart(d => addDays(d, 7))}
          className="p-1 rounded hover:bg-gray-100"
          data-testid="button-next-week"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const isPast = isBefore(startOfDay(day), today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onSelectDate(day)}
              disabled={isPast}
              className={`flex flex-col items-center py-2 rounded-xl text-xs transition-all
                ${isPast ? "opacity-30 cursor-not-allowed" : "hover:bg-[#722F37]/5 cursor-pointer"}
                ${isSelected ? "bg-[#722F37] text-white hover:bg-[#722F37]" : "text-gray-700"}`}
              data-testid={`button-day-${format(day, "yyyy-MM-dd")}`}
            >
              <span className={`font-medium text-xs ${isSelected ? "text-white/80" : "text-gray-400"}`}>
                {format(day, "EEE", { locale: fr }).slice(0, 3)}
              </span>
              <span className={`font-bold text-sm mt-0.5 ${isSelected ? "text-white" : ""}`}>
                {format(day, "d")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeSlots({ tailorId, date, selectedTime, onSelectTime }: {
  tailorId: string;
  date: Date;
  selectedTime: string | null;
  onSelectTime: (t: string) => void;
}) {
  const dateStr = format(date, "yyyy-MM-dd");
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/tailors", tailorId, "available-slots", dateStr],
    queryFn: async () => {
      const res = await fetch(`/api/tailors/${tailorId}/available-slots?date=${dateStr}`, { credentials: "include" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-[#722F37]" />
      </div>
    );
  }

  if (!data || !data.available) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">Fermé ce jour</p>
      </div>
    );
  }

  if (!data.slots || data.slots.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-gray-400">Aucun créneau disponible</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {data.slots.map((slot: { time: string; available: boolean }) => (
        <button
          key={slot.time}
          onClick={() => slot.available && onSelectTime(slot.time)}
          disabled={!slot.available}
          className={`py-2 px-1 rounded-xl text-sm font-medium border transition-all
            ${!slot.available
              ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
              : selectedTime === slot.time
                ? "bg-[#722F37] text-white border-[#722F37]"
                : "bg-white text-gray-700 border-gray-200 hover:border-[#722F37] hover:text-[#722F37]"
            }`}
          data-testid={`button-slot-${slot.time}`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}

export default function PrendreRdv() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const tailorUserId = params.get("tailor") || "";
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";

  const [type, setType] = useState("consultation");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  const { data: tailor, isLoading: tailorLoading } = useQuery<any>({
    queryKey: ["/api/tailor-by-user", tailorUserId],
    queryFn: async () => {
      const res = await fetch(`/api/tailor-by-user/${tailorUserId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Artisan introuvable");
      return res.json();
    },
    enabled: !!tailorUserId,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!selectedDate || !selectedTime) throw new Error("Créneau requis");
      const scheduledAt = new Date(`${format(selectedDate, "yyyy-MM-dd")}T${selectedTime}:00`).toISOString();
      const res = await apiRequest("POST", "/api/appointments", {
        tailorId: tailor.id,
        scheduledAt,
        type,
        notes: notes || undefined,
        duration: 60,
      });
      return res.json();
    },
    onSuccess: () => setDone(true),
    onError: (err: any) => {
      toast({
        title: isFr ? "Erreur" : "Error",
        description: err?.message || (isFr ? "Impossible de créer le rendez-vous." : "Could not create the appointment."),
        variant: "destructive",
      });
    },
  });

  if (!tailorUserId) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 p-6">
        <Scissors className="h-10 w-10 text-gray-300" />
        <p className="text-gray-500 text-center">
          {isFr ? "Lien invalide. Aucun artisan spécifié." : "Invalid link. No artisan specified."}
        </p>
        <Link href="/">
          <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" />{isFr ? "Accueil" : "Home"}</Button>
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 p-6">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-serif text-gray-900 mb-2">
            {isFr ? "Demande envoyée !" : "Request sent!"}
          </h2>
          <p className="text-gray-500 text-sm max-w-xs">
            {isFr
              ? `Votre demande de rendez-vous avec ${tailor?.user?.firstName || "l'artisan"} le ${selectedDate ? format(selectedDate, "d MMMM", { locale: fr }) : ""} à ${selectedTime} a été transmise.`
              : `Your appointment request with ${tailor?.user?.firstName || "the artisan"} has been sent.`}
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button
            className="bg-[#722F37] hover:bg-[#5a252c] text-white"
            onClick={() => setLocation("/mes-rendez-vous")}
            data-testid="button-go-to-appointments"
          >
            {isFr ? "Voir mes rendez-vous" : "View my appointments"}
          </Button>
          <Button variant="outline" onClick={() => setLocation("/")} data-testid="button-go-home">
            {isFr ? "Retour à l'accueil" : "Back to home"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => window.history.back()} className="text-gray-500 hover:text-gray-800" data-testid="button-back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-serif text-[#722F37] text-lg">
            {isFr ? "Prendre un rendez-vous" : "Book an appointment"}
          </h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Tailor card */}
        {tailorLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-gray-100 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        ) : tailor ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            <Avatar className="h-14 w-14">
              {tailor.user?.profileImageUrl && (
                <AvatarImage src={tailor.user.profileImageUrl} alt={tailor.user?.firstName} />
              )}
              <AvatarFallback className="bg-[#722F37]/10 text-[#722F37] text-xl font-bold">
                {(tailor.user?.firstName?.[0] || "A").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-gray-900">
                {tailor.user?.firstName} {tailor.user?.lastName}
              </p>
              {tailor.user?.location && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="h-3 w-3" />{tailor.user.location}
                </p>
              )}
              {tailor.rating > 0 && (
                <Badge variant="outline" className="text-xs mt-1">
                  ⭐ {Number(tailor.rating).toFixed(1)} · {tailor.reviewCount || 0} avis
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {isFr ? "Artisan introuvable." : "Artisan not found."}
          </div>
        )}

        {!user ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center space-y-3">
            <p className="text-sm text-gray-600">
              {isFr ? "Connectez-vous pour prendre un rendez-vous." : "Log in to book an appointment."}
            </p>
            <Link href={`/auth?redirect=/prendre-rdv?tailor=${tailorUserId}`}>
              <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white" data-testid="button-login">
                {isFr ? "Se connecter" : "Log in"}
              </Button>
            </Link>
          </div>
        ) : tailor ? (
          <>
            {/* Type */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Scissors className="h-4 w-4 text-[#722F37]" />
                {isFr ? "Type de rendez-vous" : "Appointment type"}
              </h2>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger data-testid="select-appointment-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {APPOINTMENT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>
                      {isFr ? t.labelFr : t.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calendar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#722F37]" />
                {isFr ? "Choisissez une date" : "Choose a date"}
              </h2>
              <WeekCalendar
                selectedDate={selectedDate}
                onSelectDate={d => { setSelectedDate(d); setSelectedTime(null); }}
              />
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#722F37]" />
                  {isFr
                    ? `Créneaux disponibles — ${format(selectedDate, "EEEE d MMMM", { locale: fr })}`
                    : `Available slots — ${format(selectedDate, "MMMM d, yyyy")}`}
                </h2>
                <TimeSlots
                  tailorId={tailor.id}
                  date={selectedDate}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                />
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isFr ? "Durée : 1 heure par créneau" : "Duration: 1 hour per slot"}
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
              <label className="text-sm font-semibold text-gray-900">
                {isFr ? "Message (optionnel)" : "Message (optional)"}
              </label>
              <Textarea
                placeholder={isFr
                  ? "Décrivez votre projet, vos disponibilités ou toute information utile…"
                  : "Describe your project, availability, or any useful info…"}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                data-testid="input-rdv-notes"
              />
            </div>

            {/* Submit */}
            <Button
              className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white h-12 text-base font-semibold"
              onClick={() => bookMutation.mutate()}
              disabled={!selectedDate || !selectedTime || bookMutation.isPending}
              data-testid="button-submit-rdv"
            >
              {bookMutation.isPending ? (
                <><Loader2 className="h-5 w-5 animate-spin mr-2" />{isFr ? "Envoi en cours…" : "Sending…"}</>
              ) : (
                <><Calendar className="h-5 w-5 mr-2" />{isFr ? "Envoyer la demande" : "Send request"}</>
              )}
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}
