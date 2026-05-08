import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar as CalendarIcon, Clock, CheckCircle, ArrowLeft } from "lucide-react";
import { fr } from "date-fns/locale";
import { format, addMonths, startOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function PrendreRdv() {
  const params = new URLSearchParams(window.location.search);
  const tailorUserId = params.get("tailor"); // USER ID from URL
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  const [visibleMonth, setVisibleMonth] = useState(startOfMonth(new Date()));

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  // Resolve userId → tailor object (gives us tailor.id = tailor table ID)
  const { data: tailor } = useQuery<any>({
    queryKey: ["/api/tailor-by-user", tailorUserId],
    queryFn: async () => {
      const r = await fetch(`/api/tailor-by-user/${tailorUserId}`);
      if (!r.ok) return null;
      const d = await r.json();
      return {
        ...d,
        firstName: d.user?.firstName ?? d.first_name,
        lastName: d.user?.lastName ?? d.last_name,
      };
    },
    enabled: !!tailorUserId,
  });

  // tailorTableId is the tailors table PK — used for all availability/booking calls
  const tailorTableId = tailor?.id ?? null;

  // Fetch closed days for current visible month
  const { data: closedDaysData } = useQuery<{ closedDates: string[]; closedWeekdays: number[]; exceptionDates: string[] }>({
    queryKey: ["/api/tailor", tailorTableId, "closed-days", format(visibleMonth, "yyyy-MM")],
    queryFn: async () => {
      const y = visibleMonth.getFullYear();
      const m = visibleMonth.getMonth() + 1;
      const r = await fetch(`/api/tailors/closed-days?tailorId=${tailorTableId}&year=${y}&month=${m}`);
      return r.json();
    },
    enabled: !!tailorTableId,
    staleTime: 60 * 1000,
  });

  // Prefetch next month
  const nextMonth = addMonths(visibleMonth, 1);
  useQuery<any>({
    queryKey: ["/api/tailor", tailorTableId, "closed-days", format(nextMonth, "yyyy-MM")],
    queryFn: async () => {
      const y = nextMonth.getFullYear();
      const m = nextMonth.getMonth() + 1;
      const r = await fetch(`/api/tailors/closed-days?tailorId=${tailorTableId}&year=${y}&month=${m}`);
      return r.json();
    },
    enabled: !!tailorTableId,
    staleTime: 60 * 1000,
  });

  // Fetch available slots for selected date
  const { data: availability, isLoading: loadingSlots } = useQuery<{
    slots: { time: string; available: boolean }[];
    isClosed: boolean;
    isException: boolean;
    reason?: string;
  }>({
    queryKey: ["/api/tailor", tailorTableId, "availability", dateStr],
    queryFn: async () => {
      const r = await fetch(`/api/tailors/availability?tailorId=${tailorTableId}&date=${dateStr}`);
      return r.json();
    },
    enabled: !!tailorTableId && !!dateStr,
  });

  const closedDates = closedDaysData?.closedDates || [];
  const closedWeekdays = closedDaysData?.closedWeekdays || [];

  const isDayDisabled = (date: Date) => {
    if (date < new Date(new Date().setHours(0, 0, 0, 0))) return true;
    const ds = format(date, "yyyy-MM-dd");
    if (closedDates.includes(ds)) return true;
    return false;
  };

  const bookMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) {
        const redirect = encodeURIComponent(window.location.href);
        window.location.href = `/connexion?redirect=${redirect}`;
        return;
      }
      const r = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tailorId: tailorTableId,
          scheduledAt: new Date(`${dateStr}T${selectedSlot}`).toISOString(),
          type: "consultation",
          duration: 30,
          status: "scheduled",
        }),
      });
      if (r.status === 401) {
        const redirect = encodeURIComponent(window.location.href);
        window.location.href = `/connexion?redirect=${redirect}`;
        return;
      }
      if (!r.ok) throw new Error();
      return r.json();
    },
    onSuccess: () => {
      setBooked(true);
      toast({ title: "Demande envoyée !", description: "L'artisan va confirmer votre rendez-vous." });
    },
    onError: () => toast({ title: "Erreur", description: "Impossible de réserver ce créneau.", variant: "destructive" }),
  });

  if (!tailorUserId) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
        <p className="text-gray-500">Artisan non trouvé.</p>
      </div>
    );
  }

  if (booked) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center p-4">
        <Card className="max-w-sm w-full border-none shadow-sm">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-serif font-bold text-gray-900">Demande envoyée !</h2>
            <p className="text-gray-500 text-sm">
              Votre demande de rendez-vous a été transmise à {tailor?.firstName} {tailor?.lastName}.<br />
              L'artisan va confirmer le créneau du <strong>{selectedDate && format(selectedDate, "d MMMM yyyy", { locale: fr })}</strong> à <strong>{selectedSlot}</strong>.
            </p>
            <Button className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white" onClick={() => navigate("/mes-rendez-vous")}>
              Voir mes rendez-vous
            </Button>
            <Button variant="ghost" className="w-full text-gray-500" onClick={() => { setBooked(false); setSelectedDate(undefined); setSelectedSlot(null); }}>
              Prendre un autre RDV
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-16">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 rounded-full hover:bg-gray-50 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-serif font-bold text-gray-900 text-lg">Prendre rendez-vous</h1>
          {tailor && (
            <p className="text-sm text-gray-500">avec {tailor.firstName} {tailor.lastName}</p>
          )}
        </div>
        {tailor && (
          <Badge className="ml-auto bg-[#601B28]/10 text-[#601B28] border-none text-xs">
            {tailor.specialty || "Couturier"}
          </Badge>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Step 1: Calendar */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-[#601B28]" />
              Choisissez une date
            </CardTitle>
            {closedWeekdays.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">Les jours grisés sont indisponibles.</p>
            )}
          </CardHeader>
          <CardContent className="px-2 pb-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
              locale={fr}
              disabled={isDayDisabled}
              month={visibleMonth}
              onMonthChange={setVisibleMonth}
              classNames={{
                day_disabled: "opacity-30 cursor-not-allowed",
                day_selected: "bg-[#601B28] text-white hover:bg-[#601B28] focus:bg-[#601B28]",
                day_today: "border border-[#601B28]/30",
              }}
            />
          </CardContent>
        </Card>

        {/* Step 2: Time slots */}
        {selectedDate && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#601B28]" />
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {loadingSlots ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-[#601B28]" />
                </div>
              ) : availability?.isClosed ? (
                <div className="text-center py-4 space-y-1">
                  <p className="text-gray-500 text-sm font-medium">Artisan indisponible ce jour</p>
                  {availability.isException && availability.reason && (
                    <p className="text-xs text-gray-400">{availability.reason}</p>
                  )}
                </div>
              ) : !availability?.slots?.length ? (
                <p className="text-gray-500 text-sm text-center py-4">Aucun créneau disponible pour cette date.</p>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {availability.slots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={[
                          "py-2.5 px-1 rounded-xl text-sm font-semibold transition-all",
                          !slot.available
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed line-through"
                            : selectedSlot === slot.time
                            ? "bg-[#601B28] text-white shadow-sm"
                            : "bg-white border border-gray-200 text-gray-700 hover:border-[#601B28] hover:text-[#601B28]",
                        ].join(" ")}
                        data-testid={`slot-${slot.time}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  {availability.slots.every(s => !s.available) && (
                    <p className="text-xs text-gray-400 text-center mt-3">Tous les créneaux sont déjà réservés.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Confirm */}
        {selectedSlot && (
          <Card className="border-none shadow-sm bg-[#601B28]/5">
            <CardContent className="p-4 space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600">Rendez-vous avec</p>
                <p className="font-semibold text-gray-900">{tailor?.firstName} {tailor?.lastName}</p>
                <p className="text-[#601B28] font-bold mt-1">
                  {selectedDate && format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })} à {selectedSlot}
                </p>
                <p className="text-xs text-gray-400 mt-1">Durée : 30 min · Consultation</p>
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-center text-amber-600 bg-amber-50 rounded-lg p-2">
                  Vous devrez vous connecter pour confirmer la réservation.
                </p>
              )}
              <Button
                className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white h-11 font-semibold"
                onClick={() => bookMutation.mutate()}
                disabled={bookMutation.isPending}
                data-testid="button-confirm-booking"
              >
                {bookMutation.isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Envoi en cours...</>
                  : isAuthenticated
                  ? "Confirmer le rendez-vous"
                  : "Se connecter pour confirmer"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
