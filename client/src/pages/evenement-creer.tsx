import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Calendar, Users, CheckCircle, Loader2, PartyPopper, Clock, Euro, Info, ImagePlus, X } from "lucide-react";
import type { TailorWithUser } from "@shared/schema";

export default function EvenementCreer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [tailorId, setTailorId] = useState("");
  const [description, setDescription] = useState("");
  const [registrationDeadline, setRegistrationDeadline] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [pricePerPerson, setPricePerPerson] = useState("");
  const [priceGroup, setPriceGroup] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [inspirationPhotos, setInspirationPhotos] = useState<string[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [created, setCreated] = useState<any>(null);

  const { data: tailors = [] } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name || !eventDate || !tailorId) throw new Error("Tous les champs obligatoires sont requis");
      const res = await apiRequest("POST", "/api/events", {
        name, eventDate, tailorId,
        description: description || undefined,
        registrationDeadline: registrationDeadline || undefined,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : undefined,
        pricePerPerson: pricePerPerson ? parseFloat(pricePerPerson) : undefined,
        priceGroup: priceGroup ? parseFloat(priceGroup) : undefined,
        deliveryDate: deliveryDate || undefined,
        inspirationPhotos: inspirationPhotos.length > 0 ? inspirationPhotos : undefined,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setCreated(data);
      queryClient.invalidateQueries({ queryKey: ["/api/client/events"] });
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible de créer la demande.", variant: "destructive" });
    },
  });

  const today = new Date().toISOString().slice(0, 10);

  function handlePhotoFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setInspirationPhotos(prev => prev.length < 6 ? [...prev, base64] : prev);
      };
      reader.readAsDataURL(file);
    });
    if (e.target) e.target.value = "";
  }

  function removePhoto(idx: number) {
    setInspirationPhotos(prev => prev.filter((_, i) => i !== idx));
  }

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
            <h1 className="font-serif text-[#601B28] text-lg">Demande envoyée !</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="font-serif text-2xl text-gray-900 mb-2">{created.name}</h2>
            <p className="text-sm text-gray-500">
              {new Date(created.event_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="font-semibold text-amber-800 text-sm flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En attente de validation par l'artisan
            </p>
            <p className="text-xs text-amber-700">
              Votre demande a été envoyée à l'artisan via la messagerie. Il pourra consulter tous les détails (nombre de personnes, prix, modèles…) et vous confirmer sa disponibilité. Le lien d'invitation sera partagé une fois accepté.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white"
              onClick={() => setLocation(`/evenement/${created.id}`)}
              data-testid="button-view-event"
            >
              Voir les détails de l'événement
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setLocation("/dashboard-client")}
              data-testid="button-go-dashboard"
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
            <h1 className="font-serif text-[#601B28] text-lg">Commande groupée</h1>
            <p className="text-xs text-gray-400">Mariage, EVJF, groupe d'amies…</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <div className="bg-[#601B28]/5 border border-[#601B28]/20 rounded-xl p-4 flex gap-3">
          <Info className="h-4 w-4 text-[#601B28] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#601B28] font-medium">Comment ça fonctionne ?</p>
            <p className="text-xs text-gray-600 mt-1">
              1. Remplissez les détails de votre commande groupée.<br />
              2. L'artisan reçoit votre demande et valide sa disponibilité.<br />
              3. Une fois acceptée, le lien d'invitation est partagé pour que votre groupe puisse rejoindre.
            </p>
          </div>
        </div>

        {/* Section : Infos de base */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-[#601B28]" />
            Informations générales
          </h2>

          <div className="space-y-2">
            <Label htmlFor="event-name">Nom de l'événement *</Label>
            <Input
              id="event-name"
              placeholder="Ex: Mariage Sarah, EVJF de Lucie, Soirée costumée…"
              value={name}
              onChange={e => setName(e.target.value)}
              data-testid="input-event-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="event-date">Date de l'événement *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="event-date"
                  type="date"
                  min={today}
                  value={eventDate}
                  onChange={e => setEventDate(e.target.value)}
                  className="pl-9"
                  data-testid="input-event-date"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="delivery-date">Date de livraison souhaitée</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="delivery-date"
                  type="date"
                  min={today}
                  max={eventDate || undefined}
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                  className="pl-9"
                  data-testid="input-delivery-date"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Artisan choisi *</Label>
            <Select value={tailorId} onValueChange={setTailorId}>
              <SelectTrigger data-testid="select-tailor">
                <SelectValue placeholder="Sélectionner un artisan" />
              </SelectTrigger>
              <SelectContent>
                {(tailors as TailorWithUser[]).map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.user.firstName} {t.user.lastName}
                    {t.user.location ? ` · ${t.user.location}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Section : Participants & prix */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-[#601B28]" />
            Participants & tarification
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="max-participants">Nb de personnes</Label>
              <Input
                id="max-participants"
                type="number"
                min="1"
                placeholder="10"
                value={maxParticipants}
                onChange={e => setMaxParticipants(e.target.value)}
                data-testid="input-max-participants"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-per-person">Prix / personne (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  id="price-per-person"
                  type="number"
                  step="0.01"
                  placeholder="150"
                  value={pricePerPerson}
                  onChange={e => setPricePerPerson(e.target.value)}
                  className="pl-8"
                  data-testid="input-price-per-person"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price-group">Prix global (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  id="price-group"
                  type="number"
                  step="0.01"
                  placeholder="1200"
                  value={priceGroup}
                  onChange={e => setPriceGroup(e.target.value)}
                  className="pl-8"
                  data-testid="input-price-group"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400">Ces informations sont indicatives et seront discutées avec l'artisan.</p>
        </div>

        {/* Section : Description & détails */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm">Description & modèles</h2>

          <div className="space-y-2">
            <Label htmlFor="event-desc">Décrivez votre commande</Label>
            <Textarea
              id="event-desc"
              placeholder="Thème, couleurs, modèles souhaités pour chaque personne, tissu apporté ou à commander, informations utiles pour l'artisan…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              data-testid="input-event-description"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-deadline">Date limite d'inscription</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="event-deadline"
                type="date"
                min={today}
                max={eventDate || undefined}
                value={registrationDeadline}
                onChange={e => setRegistrationDeadline(e.target.value)}
                className="pl-9"
                data-testid="input-registration-deadline"
              />
            </div>
            <p className="text-xs text-gray-400">Les inscriptions se fermeront automatiquement après cette date.</p>
          </div>
        </div>

        {/* Section : Photos d'inspiration */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-[#601B28]" />
            Photos d'inspiration
            <span className="text-xs font-normal text-gray-400 ml-1">(facultatif, max 6)</span>
          </h2>
          <p className="text-xs text-gray-500">
            Partagez des photos de modèles, coupes, couleurs ou tissus pour aider l'artisan à visualiser votre projet.
          </p>

          <div className="grid grid-cols-3 gap-2">
            {inspirationPhotos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group" data-testid={`img-inspiration-${idx}`}>
                <img src={photo} alt={`Inspiration ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-photo-${idx}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {inspirationPhotos.length < 6 && (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="aspect-square rounded-xl border-2 border-dashed border-[#601B28]/30 flex flex-col items-center justify-center gap-1 text-[#601B28]/50 hover:border-[#601B28] hover:text-[#601B28] transition-colors"
                data-testid="button-add-photo"
              >
                <ImagePlus className="h-5 w-5" />
                <span className="text-xs">Ajouter</span>
              </button>
            )}
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoFiles}
            data-testid="input-inspiration-photos"
          />
        </div>

        <Button
          className="w-full bg-[#601B28] hover:bg-[#4E1522] text-white h-12 text-base font-semibold"
          onClick={() => createMutation.mutate()}
          disabled={createMutation.isPending || !name || !eventDate || !tailorId}
          data-testid="button-create-event"
        >
          {createMutation.isPending ? (
            <><Loader2 className="h-5 w-5 animate-spin mr-2" />Envoi en cours…</>
          ) : (
            <><PartyPopper className="h-5 w-5 mr-2" />Envoyer la demande à l'artisan</>
          )}
        </Button>
      </div>
    </div>
  );
}
