import { useTranslation } from "react-i18next";
import { Calendar, MapPin, Clock, CheckCircle2, XCircle, AlertCircle, ChevronLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AppointmentWithTailor {
  id: string;
  type: string;
  scheduled_at: string;
  duration: number | null;
  status: string;
  location: string | null;
  notes: string | null;
  tailor_first_name: string | null;
  tailor_last_name: string | null;
  tailor_image: string | null;
  tailor_user_id: string;
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    fitting: "Essayage",
    measurements: "Prise de mesures",
    consultation: "Consultation",
  };
  return map[type] ?? type;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "confirmed") return <Badge className="bg-green-100 text-green-700 border-none text-xs">Confirmé</Badge>;
  if (status === "cancelled") return <Badge className="bg-gray-100 text-gray-500 border-none text-xs">Annulé</Badge>;
  return <Badge className="bg-orange-100 text-orange-700 border-none text-xs">En attente</Badge>;
}

export default function MesRendezVous() {
  const { toast } = useToast();

  const { data: appointments = [], isLoading } = useQuery<AppointmentWithTailor[]>({
    queryKey: ["/api/client/appointments-with-tailor"],
    queryFn: async () => {
      const res = await fetch("/api/client/appointments-with-tailor", { credentials: "include" });
      if (!res.ok) throw new Error("Erreur");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const now = new Date();
  const upcoming = appointments
    .filter(a => new Date(a.scheduled_at) >= now && a.status !== "cancelled")
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  const past = appointments
    .filter(a => new Date(a.scheduled_at) < now || a.status === "cancelled")
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime());

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/appointments/${id}`, { status }).then(r => r.json()),
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/client/appointments-with-tailor"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      toast({
        title: status === "confirmed" ? "Rendez-vous confirmé ✅" : "Rendez-vous annulé",
        description: status === "confirmed"
          ? "Votre artisan a été notifié."
          : "L'artisan a été informé de l'annulation.",
      });
    },
    onError: () => toast({ title: "Erreur", variant: "destructive" }),
  });

  return (
    <div className="min-h-screen pb-24 bg-[#faf9f8]">
      {/* En-tête */}
      <div className="bg-[#722F37] text-white px-4 lg:px-8 pt-6 pb-10">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard">
            <button className="flex items-center gap-1.5 text-white/70 text-sm mb-4 hover:text-white transition-colors">
              <ChevronLeft className="h-4 w-4" /> Tableau de bord
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-2xl lg:text-3xl font-medium">Mes rendez-vous</h1>
              <p className="text-white/70 text-sm mt-0.5">
                {upcoming.length} à venir · {past.length} passé{past.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 lg:px-8 -mt-4 space-y-6">

        {/* ── À venir ── */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            À venir
          </h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 h-24 animate-pulse" />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 py-10 text-center">
              <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Aucun rendez-vous à venir</p>
              <p className="text-gray-400 text-xs mt-1">Contactez un artisan pour planifier une consultation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(appt => (
                <AppointmentCard
                  key={appt.id}
                  appt={appt}
                  showActions
                  onConfirm={() => statusMutation.mutate({ id: appt.id, status: "confirmed" })}
                  onCancel={() => statusMutation.mutate({ id: appt.id, status: "cancelled" })}
                  isPending={statusMutation.isPending}
                />
              ))}
            </div>
          )}
        </section>

        {/* ── Passés / annulés ── */}
        {past.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
              Historique
            </h2>
            <div className="space-y-3 opacity-70">
              {past.slice(0, 5).map(appt => (
                <AppointmentCard key={appt.id} appt={appt} showActions={false} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ── Carte RDV ─────────────────────────────────────────────────────────────────
function AppointmentCard({
  appt,
  showActions,
  onConfirm,
  onCancel,
  isPending,
}: {
  appt: AppointmentWithTailor;
  showActions: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  isPending?: boolean;
}) {
  const dt = new Date(appt.scheduled_at);
  const tailorName = [appt.tailor_first_name, appt.tailor_last_name].filter(Boolean).join(" ") || "Artisan";

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Bande colorée selon statut */}
      <div className={`h-1 w-full ${appt.status === "confirmed" ? "bg-green-500" : appt.status === "cancelled" ? "bg-gray-300" : "bg-orange-400"}`} />

      <div className="p-4">
        {/* En-tête : date + statut */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Clock className="h-3 w-3" />
              {dt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {appt.duration ? ` · ${appt.duration} min` : ""}
            </p>
          </div>
          <StatusBadge status={appt.status} />
        </div>

        {/* Infos artisan + type */}
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-9 w-9 border border-gray-100 flex-shrink-0">
            <AvatarImage src={appt.tailor_image || undefined} />
            <AvatarFallback className="bg-[#722F37]/10 text-[#722F37] text-sm">
              {(appt.tailor_first_name || "A").charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-gray-900">{tailorName}</p>
            <p className="text-xs text-gray-400">{getTypeLabel(appt.type)}</p>
          </div>
        </div>

        {appt.location && (
          <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
            <MapPin className="h-3 w-3" /> {appt.location}
          </p>
        )}

        {appt.notes && (
          <p className="text-xs text-gray-400 italic mb-3">"{appt.notes}"</p>
        )}

        {/* Actions : confirmer / annuler */}
        {showActions && appt.status === "scheduled" && (
          <div className="border-t border-gray-50 pt-3 flex gap-2">
            <div className="flex items-center gap-1.5 text-orange-600 text-xs flex-1">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>En attente de votre confirmation</span>
            </div>
            <div className="flex gap-1.5 flex-shrink-0">
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white h-8 px-3 text-xs gap-1"
                disabled={isPending}
                onClick={onConfirm}
                data-testid={`button-confirm-rdv-${appt.id}`}
              >
                <CheckCircle2 className="h-3 w-3" /> Confirmer
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-200 text-red-500 hover:bg-red-50 h-8 px-3 text-xs gap-1"
                disabled={isPending}
                onClick={onCancel}
                data-testid={`button-cancel-rdv-${appt.id}`}
              >
                <XCircle className="h-3 w-3" /> Annuler
              </Button>
            </div>
          </div>
        )}

        {showActions && appt.status === "confirmed" && (
          <div className="border-t border-gray-50 pt-3">
            <Button
              size="sm"
              variant="outline"
              className="border-red-200 text-red-500 hover:bg-red-50 h-8 px-3 text-xs gap-1 w-full"
              disabled={isPending}
              onClick={onCancel}
              data-testid={`button-cancel-rdv-${appt.id}`}
            >
              <XCircle className="h-3 w-3" /> Annuler ce rendez-vous
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
