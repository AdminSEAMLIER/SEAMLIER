import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Users, Copy, CheckCircle, Loader2, PartyPopper } from "lucide-react";
import type { TailorWithUser } from "@shared/schema";

export default function EvenementCreer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tailorId, setTailorId] = useState("");
  const [description, setDescription] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [created, setCreated] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const { data: tailors = [] } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name || !eventDate || !tailorId) throw new Error("Tous les champs obligatoires sont requis");
      const res = await apiRequest("POST", "/api/events", {
        name, eventDate, tailorId, description,
        registrationDeadline: registrationDeadline || undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCreated(data);
      queryClient.invalidateQueries({ queryKey: ["/api/client/events"] });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible de créer l'événement.", variant: "destructive" });
    },
  });

  const inviteLink = created ? `https://seamlier.fr/evenement/rejoindre/${created.invite_code}` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Lien copié !", description: "Partagez-le avec vos invités." });
  };

  const today = new Date().toISOString().slice(0, 10);

  if (created) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <div className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/dashboard-client">
              <Button variant="ghost" size="icon" className="text-gray-500">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="font-serif text-[#722F37] text-lg">Événement créé !</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="font-serif text-2xl text-gray-900 mb-2">{created.name}</h2>
            <p className="text-gray-500 text-sm">
              {new Date(created.event_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <Card className="border border-[#722F37]/20">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#722F37]" />
                Lien d'invitation à partager
              </p>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={inviteLink}
                  className="text-xs text-gray-600 bg-gray-50"
                />
                <Button
                  onClick={handleCopy}
                  className="shrink-0 bg-[#722F37] hover:bg-[#5a252c] text-white"
                  data-testid="button-copy-invite"
                >
                  {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Code : <strong className="text-[#722F37] font-mono">{created.invite_code}</strong>
              </p>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <Button
              className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white"
              onClick={() => setLocation(`/evenement/${created.id}`)}
            >
              Voir les détails de l'événement
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/dashboard-client")}
            >
              Retour au tableau de bord
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/dashboard-client">
            <Button variant="ghost" size="icon" className="text-gray-500">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="font-serif text-[#722F37] text-lg">Créer un événement collectif</h1>
            <p className="text-xs text-gray-400">Mariage, EVJF, groupe d'amies…</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-[#722F37]/5 border border-[#722F37]/20 rounded-xl p-4">
          <p className="text-sm text-[#722F37] font-medium">🎉 Commande groupée</p>
          <p className="text-xs text-gray-600 mt-1">
            Créez un événement et invitez vos amies à rejoindre la commande collective chez le même artisan.
            Chaque participante aura son propre projet personnalisé.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-name">Nom de l'événement *</Label>
          <Input
            id="event-name"
            placeholder="Ex: Mariage Sarah, EVJF de Lucie, Soirée costumée…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            data-testid="input-event-name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-date">Date de l'événement *</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="event-date"
              type="date"
              min={today}
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="pl-9"
              data-testid="input-event-date"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Artisan choisi *</Label>
          <Select value={tailorId} onValueChange={setTailorId}>
            <SelectTrigger data-testid="select-tailor">
              <SelectValue placeholder="Sélectionner un artisan" />
            </SelectTrigger>
            <SelectContent>
              {tailors.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.user.firstName} {t.user.lastName}
                  {t.user.location ? ` · ${t.user.location}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-desc">Description (optionnel)</Label>
          <Textarea
            id="event-desc"
            placeholder="Thème, couleurs, style souhaité, informations utiles pour l'artisan…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            data-testid="input-event-description"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="event-deadline">Date limite d'inscription (optionnel)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="event-deadline"
              type="date"
              min={today}
              max={eventDate || undefined}
              value={registrationDeadline}
              onChange={(e) => setRegistrationDeadline(e.target.value)}
              className="pl-9"
              data-testid="input-registration-deadline"
            />
          </div>
          <p className="text-xs text-gray-400">Les inscriptions se fermeront automatiquement après cette date.</p>
        </div>

        <Button
          className="w-full bg-[#722F37] hover:bg-[#5a252c] text-white h-12 text-base font-semibold"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !name || !eventDate || !tailorId}
          data-testid="button-create-event"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
          ) : (
            <PartyPopper className="h-5 w-5 mr-2" />
          )}
          Créer l'événement
        </Button>
      </div>
    </div>
  );
}
