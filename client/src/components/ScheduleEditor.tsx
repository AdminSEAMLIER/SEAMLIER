import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const DAYS = [
  { label: "Lundi",    dayOfWeek: 1 },
  { label: "Mardi",    dayOfWeek: 2 },
  { label: "Mercredi", dayOfWeek: 3 },
  { label: "Jeudi",    dayOfWeek: 4 },
  { label: "Vendredi", dayOfWeek: 5 },
  { label: "Samedi",   dayOfWeek: 6 },
  { label: "Dimanche", dayOfWeek: 0 },
];

function buildSlots() {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}
const SLOTS = buildSlots();

const DEFAULT_SCHEDULE = DAYS.map(d => ({
  dayOfWeek: d.dayOfWeek,
  startTime: "09:00",
  endTime: "18:00",
  isClosed: d.dayOfWeek === 0,
}));

export default function ScheduleEditor({ tailorId }: { tailorId?: string }) {
  const { toast } = useToast();
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);

  const { data: existing } = useQuery({
    queryKey: ["/api/tailor", tailorId, "schedule"],
    queryFn: async () => {
      const res = await fetch("/api/schedule?tailorId=" + tailorId);
      return res.json();
    },
    enabled: !!tailorId,
  });

  useEffect(() => {
    if (existing && existing.length > 0) {
      setSchedule(prev =>
        prev.map(d => {
          const found = existing.find((e: any) => e.day_of_week === d.dayOfWeek);
          if (found) {
            return {
              dayOfWeek: d.dayOfWeek,
              startTime: found.start_time,
              endTime: found.end_time,
              isClosed: !!found.is_closed,
            };
          }
          return d;
        })
      );
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ schedule }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      return res.json();
    },
    onSuccess: () =>
      toast({ title: "Horaires sauvegardés", description: "Vos disponibilités ont été mises à jour." }),
    onError: () =>
      toast({ title: "Erreur", description: "Impossible de sauvegarder les horaires.", variant: "destructive" }),
  });

  const update = (dayOfWeek: number, field: string, value: any) => {
    setSchedule(prev =>
      prev.map(d => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  return (
    <div className="space-y-1">
      {DAYS.map(({ label, dayOfWeek }) => {
        const day = schedule.find(d => d.dayOfWeek === dayOfWeek)!;
        return (
          <div
            key={dayOfWeek}
            className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0"
            data-testid={`row-schedule-${dayOfWeek}`}
          >
            <span className="w-24 text-sm font-medium text-gray-700 shrink-0">{label}</span>

            <label className="flex items-center gap-1.5 cursor-pointer select-none shrink-0">
              <input
                type="checkbox"
                checked={day.isClosed}
                onChange={e => update(dayOfWeek, "isClosed", e.target.checked)}
                className="accent-[#601B28] w-4 h-4 cursor-pointer"
                data-testid={`checkbox-closed-${dayOfWeek}`}
              />
              <span className="text-xs text-gray-500">Fermé</span>
            </label>

            {!day.isClosed ? (
              <div className="flex items-center gap-2 flex-1">
                <select
                  value={day.startTime}
                  onChange={e => update(dayOfWeek, "startTime", e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#601B28]"
                  data-testid={`select-start-${dayOfWeek}`}
                >
                  {SLOTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <span className="text-gray-400 text-sm">—</span>
                <select
                  value={day.endTime}
                  onChange={e => update(dayOfWeek, "endTime", e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#601B28]"
                  data-testid={`select-end-${dayOfWeek}`}
                >
                  {SLOTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            ) : (
              <span className="text-xs text-gray-400 italic">Pas de rendez-vous ce jour</span>
            )}
          </div>
        );
      })}

      <div className="pt-3">
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="bg-[#601B28] hover:bg-[#4E1522] text-white text-sm"
          data-testid="button-save-schedule"
        >
          {saveMutation.isPending ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enregistrement...</>
          ) : (
            "Sauvegarder les horaires"
          )}
        </Button>
      </div>
    </div>
  );
}
