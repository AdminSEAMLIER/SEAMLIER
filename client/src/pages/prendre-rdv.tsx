import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { fr } from "date-fns/locale";
import { format } from "date-fns";

export default function PrendreRdv() {
  const params = new URLSearchParams(window.location.search);
  const tailorId = params.get("tailor");
  const [selectedDate, setSelectedDate] = useState(undefined);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [, navigate] = useLocation();
  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  const { data: tailor } = useQuery({ queryKey: ["/api/tailors", tailorId], enabled: !!tailorId });

  const { data: availability } = useQuery({
    queryKey: ["/api/tailor", tailorId, "availability", dateStr],
    queryFn: async () => {
      const res = await fetch("/api/tailor/" + tailorId + "/availability?date=" + dateStr);
      return res.json();
    },
    enabled: !!selectedDate && !!tailorId,
  });

  const bookMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tailorId, scheduledAt: new Date(dateStr + "T" + selectedSlot).toISOString(), type: "consultation", duration: 30, status: "scheduled" }),
      });
      if (res.status === 401) { window.location.href = "/connexion?redirect=" + encodeURIComponent(window.location.href); return; }
      return res.json();
    },
    onSuccess: () => { alert("Rendez-vous demande !"); navigate("/mes-rendez-vous"); },
  });

  if (!tailorId) return React.createElement("div", { className: "p-8 text-center" }, "Artisan non trouve");

  return (
    <div className="min-h-screen bg-[#faf9f7] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-serif font-bold text-[#722F37] mb-2">Prendre rendez-vous</h1>
        {tailor && <p className="text-gray-600 mb-6">avec {tailor.firstName} {tailor.lastName}</p>}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h2 className="font-semibold text-gray-800 mb-3">Choisissez une date</h2>
            <Calendar mode="single" selected={selectedDate} onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }} locale={fr} disabled={(date) => date < new Date()} />
          </CardContent>
        </Card>
        {selectedDate && availability && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h2 className="font-semibold text-gray-800 mb-3">Creneaux disponibles</h2>
              {availability.isClosed ? (
                <p className="text-gray-500 text-sm">Ferme ce jour.</p>
              ) : availability.slots?.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucun creneau disponible.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {availability.slots?.map((slot) => (
                    <button key={slot.time} disabled={!slot.available} onClick={() => setSelectedSlot(slot.time)}
                      className={"py-2 px-3 rounded-lg text-sm font-medium " + (!slot.available ? "bg-gray-100 text-gray-300 cursor-not-allowed" : selectedSlot === slot.time ? "bg-[#722F37] text-white" : "bg-white border border-gray-200 hover:border-[#722F37]")}>
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {selectedSlot && (
          <Button className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white" onClick={() => bookMutation.mutate()} disabled={bookMutation.isPending}>
            {bookMutation.isPending ? "Envoi..." : "Confirmer le rendez-vous a " + selectedSlot}
          </Button>
        )}
      </div>
    </div>
  );
}