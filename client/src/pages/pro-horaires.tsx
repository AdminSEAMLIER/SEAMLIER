import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Clock, CheckCircle, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface DayHour {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isClosed: boolean;
}

const DEFAULT_HOURS: DayHour[] = [0, 1, 2, 3, 4, 5, 6].map(d => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "18:00",
  isClosed: d === 0, // Sunday closed by default
}));

export default function ProHoraires() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { i18n } = useTranslation();
  const isFr = i18n.language === "fr";
  const DAYS = isFr ? DAYS_FR : DAYS_EN;

  const [hours, setHours] = useState<DayHour[]>(DEFAULT_HOURS);
  const [saved, setSaved] = useState(false);

  const { data: tailor } = useQuery<any>({
    queryKey: ["/api/pro/profile"],
    enabled: !!user,
  });

  const { data: workingHours, isLoading } = useQuery<any[]>({
    queryKey: ["/api/tailors", tailor?.id, "working-hours"],
    queryFn: async () => {
      if (!tailor?.id) return [];
      const res = await fetch(`/api/tailors/${tailor.id}/working-hours`, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!tailor?.id,
  });

  useEffect(() => {
    if (workingHours && workingHours.length > 0) {
      const merged = DEFAULT_HOURS.map(def => {
        const db = workingHours.find((h: any) => h.day_of_week === def.dayOfWeek);
        if (!db) return def;
        return {
          dayOfWeek: def.dayOfWeek,
          startTime: db.start_time || "09:00",
          endTime: db.end_time || "18:00",
          isClosed: !!db.is_closed,
        };
      });
      setHours(merged);
    }
  }, [workingHours]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", "/api/pro/working-hours", { hours });
      return res.json();
    },
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      if (tailor?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/tailors", tailor.id, "working-hours"] });
      }
      toast({ title: isFr ? "Horaires enregistrés !" : "Working hours saved!" });
    },
    onError: () => {
      toast({ title: isFr ? "Erreur" : "Error", variant: "destructive" });
    },
  });

  const update = (dayOfWeek: number, field: keyof DayHour, value: any) => {
    setSaved(false);
    setHours(prev => prev.map(h => h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#722F37]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">
          {isFr ? "Horaires de travail" : "Working hours"}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {isFr
            ? "Ces horaires seront affichés aux clients lors de la prise de rendez-vous."
            : "These hours will be shown to clients when booking an appointment."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {hours.map((day, idx) => (
          <div
            key={day.dayOfWeek}
            className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 ${idx < hours.length - 1 ? "border-b border-gray-50" : ""}`}
          >
            <div className="flex items-center justify-between sm:w-32">
              <span className={`font-medium text-sm ${day.isClosed ? "text-gray-400" : "text-gray-900"}`}>
                {DAYS[day.dayOfWeek]}
              </span>
              <Switch
                checked={!day.isClosed}
                onCheckedChange={v => update(day.dayOfWeek, "isClosed", !v)}
                data-testid={`switch-day-${day.dayOfWeek}`}
              />
            </div>

            {day.isClosed ? (
              <div className="sm:flex-1 flex items-center">
                <Badge variant="outline" className="text-xs text-gray-400 border-gray-200">
                  {isFr ? "Fermé" : "Closed"}
                </Badge>
              </div>
            ) : (
              <div className="sm:flex-1 flex items-center gap-3">
                <Clock className="h-4 w-4 text-gray-400 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-500 sr-only">{isFr ? "Début" : "Start"}</Label>
                  <Input
                    type="time"
                    value={day.startTime}
                    onChange={e => update(day.dayOfWeek, "startTime", e.target.value)}
                    className="w-28 text-sm h-9"
                    data-testid={`input-start-${day.dayOfWeek}`}
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <Input
                    type="time"
                    value={day.endTime}
                    onChange={e => update(day.dayOfWeek, "endTime", e.target.value)}
                    className="w-28 text-sm h-9"
                    data-testid={`input-end-${day.dayOfWeek}`}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button
        className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white h-11"
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        data-testid="button-save-hours"
      >
        {saveMutation.isPending ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" />{isFr ? "Enregistrement…" : "Saving…"}</>
        ) : saved ? (
          <><CheckCircle className="h-4 w-4 mr-2" />{isFr ? "Enregistré !" : "Saved!"}</>
        ) : (
          <><Save className="h-4 w-4 mr-2" />{isFr ? "Enregistrer les horaires" : "Save working hours"}</>
        )}
      </Button>
    </div>
  );
}
