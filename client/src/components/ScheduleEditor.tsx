import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function ScheduleEditor({ tailorId }) {
  const [schedule, setSchedule] = useState(
    DAYS.map((_, i) => ({ dayOfWeek: i, startTime: "09:00", endTime: "18:00", isClosed: i === 0 }))
  );

  const { data: existing } = useQuery({
    queryKey: ["/api/tailor", tailorId, "schedule"],
    queryFn: async () => {
      const res = await fetch("/api/tailor/" + tailorId + "/schedule");
      return res.json();
    },
    enabled: !!tailorId,
  });

  useEffect(() => {
    if (existing && existing.length > 0) {
      setSchedule(prev => prev.map(d => {
        const found = existing.find(e => e.day_of_week === d.dayOfWeek);
        if (found) return { dayOfWeek: d.dayOfWeek, startTime: found.start_time, endTime: found.end_time, isClosed: !!found.is_closed };
        return d;
      }));
    }
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/tailor/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ schedule }),
      });
      return res.json();
    },
    onSuccess: () => alert("Horaires enregistres !"),
  });

  const update = (dayOfWeek, field, value) => {
    setSchedule(prev => prev.map(d => d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d));
  };

  return (
    <div className="space-y-2">
      {schedule.map(day => (
        <div key={day.dayOfWeek} className="flex items-center gap-3 py-2 border-b border-gray-50">
          <span className="w-24 text-sm font-medium text-gray-700">{DAYS[day.dayOfWeek]}</span>
          <input type="checkbox" checked={day.isClosed} onChange={e => update(day.dayOfWeek, "isClosed", e.target.checked)}
            className="mr-1" id={"closed-" + day.dayOfWeek} />
          <label htmlFor={"closed-" + day.dayOfWeek} className="text-xs text-gray-500 mr-3">Ferme</label>
          {!day.isClosed && (
            <>
              <input type="time" value={day.startTime} onChange={e => update(day.dayOfWeek, "startTime", e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-sm w-28" />
              <span className="text-gray-400 text-sm">-</span>
              <input type="time" value={day.endTime} onChange={e => update(day.dayOfWeek, "endTime", e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-sm w-28" />
            </>
          )}
          {day.isClosed && <span className="text-xs text-gray-400 italic">Pas de rendez-vous ce jour</span>}
        </div>
      ))}
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
        className="mt-3 bg-[#722F37] hover:bg-[#5a252c] text-white text-sm">
        {saveMutation.isPending ? "Enregistrement..." : "Sauvegarder les horaires"}
      </Button>
    </div>
  );
}