import { useState } from "react";
import { useSearch, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Calendar, MapPin, Clock, CheckCircle, Loader2, ArrowLeft, Scissors
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

const APPOINTMENT_TYPES = [
  { value: "consultation", labelFr: "Consultation initiale", labelEn: "Initial consultation" },
  { value: "measurements", labelFr: "Prise de mesures", labelEn: "Measurements session" },
  { value: "fitting", labelFr: "Essayage", labelEn: "Fitting session" },
];

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
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
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
      if (!date || !time) throw new Error("Date et heure requises");
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      const res = await apiRequest("POST", "/api/appointments", {
        tailorId: tailor.id,
        scheduledAt,
        type,
        notes: notes || undefined,
        duration: 60,
      });
      return res.json();
    },
    onSuccess: () => {
      setDone(true);
    },
    onError: (err: any) => {
      toast({
        title: isFr ? "Erreur" : "Error",
        description: err?.message || (isFr ? "Impossible de créer le rendez-vous." : "Could not create the appointment."),
        variant: "destructive",
      });
    },
  });

  const today = new Date().toISOString().slice(0, 10);

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
          <p className="text-gray-500 text-sm">
            {isFr
              ? `Votre demande de rendez-vous avec ${tailor?.user?.firstName || "l'artisan"} a été transmise. Vous recevrez une confirmation prochainement.`
              : `Your appointment request with ${tailor?.user?.firstName || "the artisan"} has been sent. You'll receive a confirmation soon.`}
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
      {/* Header */}
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

      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {/* Tailor card */}
        {tailorLoading ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3 shadow-sm">
            <div className="w-14 h-14 rounded-xl bg-gray-100 animate-pulse" />
            <div className="space-y-2">
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
                  ⭐ {Number(tailor.rating).toFixed(1)} · {tailor.review_count || 0} avis
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            {isFr ? "Artisan introuvable." : "Artisan not found."}
          </div>
        )}

        {/* Form */}
        {!user ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center space-y-3">
            <p className="text-sm text-gray-600">
              {isFr
                ? "Connectez-vous pour prendre un rendez-vous."
                : "Log in to book an appointment."}
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
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
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

            {/* Date & time */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#722F37]" />
                {isFr ? "Date et heure" : "Date and time"}
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="rdv-date" className="text-xs">{isFr ? "Date" : "Date"}</Label>
                  <Input
                    id="rdv-date"
                    type="date"
                    min={today}
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    data-testid="input-rdv-date"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="rdv-time" className="text-xs">{isFr ? "Heure" : "Time"}</Label>
                  <Input
                    id="rdv-time"
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    data-testid="input-rdv-time"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {isFr ? "Durée estimée : 1 heure" : "Estimated duration: 1 hour"}
              </p>
            </div>

            {/* Notes */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-3">
              <Label className="text-sm font-semibold text-gray-900">
                {isFr ? "Message pour l'artisan (optionnel)" : "Message to the artisan (optional)"}
              </Label>
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
              disabled={!date || !time || bookMutation.isPending}
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
