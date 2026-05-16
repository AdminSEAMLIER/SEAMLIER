import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PortfolioCard, PortfolioCardSkeleton } from "@/components/portfolio-card";
import { ReviewCard, ReviewCardSkeleton } from "@/components/review-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { 
  Star, 
  MapPin, 
  BadgeCheck, 
  MessageCircle, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Share2,
  Heart,
  Camera,
  Euro,
  X
} from "lucide-react";
import type { TailorWithUser, PortfolioWithTailor, ReviewWithUser } from "@shared/schema";

// Helper function to get full name from firstName + lastName
const getFullName = (user: { firstName?: string | null; lastName?: string | null }) => {
  return `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Couturier';
};

// Helper function to get initials
const getInitials = (user: { firstName?: string | null; lastName?: string | null }) => {
  return `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'C';
};

export default function TailorProfile() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, params] = useRoute("/tailor/:id");
  const tailorId = params?.id;
  
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingType, setBookingType] = useState("consultation");

  const [devisOpen, setDevisOpen] = useState(false);
  const [devisDescription, setDevisDescription] = useState("");
  const [devisGarment, setDevisGarment] = useState("");
  const [devisPhoto, setDevisPhoto] = useState<string | null>(null);
  const [devisRequestedPrice, setDevisRequestedPrice] = useState("");
  const [devisClientDeadline, setDevisClientDeadline] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handleDevisPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX_W = 900;
      const scale = Math.min(1, MAX_W / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      setDevisPhoto(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.src = objectUrl;
  };

  const resetDevisForm = () => {
    setDevisDescription("");
    setDevisGarment("");
    setDevisPhoto(null);
    setDevisRequestedPrice("");
    setDevisClientDeadline("");
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  const bookingMutation = useMutation({
    mutationFn: () => {
      if (!bookingDate || !bookingTime) throw new Error("Champs requis");
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`).toISOString();
      return apiRequest("POST", "/api/appointments", {
        tailorId: tailorId,
        type: bookingType,
        scheduledAt,
        duration: 60,
        notes: bookingMessage || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Rendez-vous demandé", description: `Votre demande pour le ${bookingDate} à ${bookingTime} a été envoyée.` });
      queryClient.invalidateQueries({ queryKey: ["/api/client/appointments"] });
      setBookingOpen(false);
      setBookingDate("");
      setBookingTime("");
      setBookingMessage("");
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible d'envoyer la demande.", variant: "destructive" });
    },
  });

  const devisMutation = useMutation({
    mutationFn: () => {
      if (!devisDescription) throw new Error("Description requise");
      return apiRequest("POST", "/api/projects", {
        tailorId: tailorId,
        title: devisGarment || "Demande de devis",
        description: devisDescription,
        clothingType: devisGarment || null,
        requestedPrice: devisRequestedPrice ? parseFloat(devisRequestedPrice) : null,
        modelPhotoUrl: devisPhoto || null,
        clientDeadline: devisClientDeadline || null,
        status: "pending",
      });
    },
    onSuccess: () => {
      toast({ title: "Devis demandé", description: "Votre demande de devis a été envoyée au couturier." });
      queryClient.invalidateQueries({ queryKey: ["/api/client/projects"] });
      setDevisOpen(false);
      resetDevisForm();
    },
    onError: (err: any) => {
      toast({ title: "Erreur", description: err?.message || "Impossible d'envoyer la demande.", variant: "destructive" });
    },
  });

  const handleBooking = () => {
    if (!bookingDate || !bookingTime) {
      toast({ title: "Champs requis", description: "Veuillez sélectionner une date et une heure.", variant: "destructive" });
      return;
    }
    bookingMutation.mutate();
  };

  const { data: tailor, isLoading: tailorLoading } = useQuery<TailorWithUser>({
    queryKey: ["/api/tailors", tailorId],
    enabled: !!tailorId,
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<PortfolioWithTailor[]>({
    queryKey: ["/api/tailors", tailorId, "portfolio"],
    enabled: !!tailorId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/tailors", tailorId, "reviews"],
    enabled: !!tailorId,
  });

  if (tailorLoading) {
    return (
      <div className="min-h-screen pb-20 lg:pb-8 bg-white">
        <div className="h-64 skeleton-shimmer" />
        <div className="px-4 lg:px-6 -mt-16 max-w-4xl mx-auto">
          <div className="h-24 w-24 rounded-full skeleton-shimmer border-4 border-white" />
          <div className="mt-4 space-y-3">
            <div className="h-8 w-48 rounded skeleton-shimmer" />
            <div className="h-4 w-32 rounded skeleton-shimmer" />
            <div className="h-20 w-full rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (!tailor) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20 lg:pb-8 bg-white">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t('tailorProfile.notFound')}</p>
          <Link href="/dashboard-client">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.backToHome')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="relative h-64">
        <img
          src={tailor.coverImageUrl || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=400&fit=crop`}
          alt={getFullName(tailor.user)}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link href="/dashboard-client">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/90 hover:bg-white text-gray-700"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/90 hover:bg-white text-gray-700"
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/90 hover:bg-white text-gray-700"
              data-testid="button-favorite"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 -mt-12 max-w-4xl mx-auto relative z-10">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage src={tailor.user.profileImageUrl || undefined} />
          <AvatarFallback className="bg-[#601B28] text-white text-3xl">
            {getInitials(tailor.user)}
          </AvatarFallback>
        </Avatar>

        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-2xl lg:text-3xl text-[#601B28]">
              {getFullName(tailor.user)}
            </h1>
            {tailor.isVerified && (
              <BadgeCheck className="h-5 w-5 text-[#601B28]" fill="currentColor" />
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 flex-wrap">
            {tailor.user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{tailor.user.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-gray-900">
                {tailor.rating?.toFixed(1) || t('tailorProfile.new')}
              </span>
              {tailor.reviewCount && tailor.reviewCount > 0 && (
                <span>({tailor.reviewCount} {t('tailorProfile.reviews')})</span>
              )}
            </div>
            {tailor.experience && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{tailor.experience} {t('tailorProfile.yearsExperience')}</span>
              </div>
            )}
          </div>

          {tailor.specialties && tailor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tailor.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary" className="bg-gray-100 text-gray-700 border-none">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}

          {tailor.bio && (
            <p className="mt-4 text-gray-600 leading-relaxed">
              {tailor.bio}
            </p>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <div className="flex gap-3">
              <Link href={`/messages?tailor=${tailorId}`} className="flex-1">
                <Button className="w-full h-12 bg-[#601B28] hover:bg-[#4E1522] text-white" data-testid="button-contact">
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Envoyer un message
                </Button>
              </Link>
              <Button
                variant="outline"
                className="flex-1 h-12 border-[#601B28] text-[#601B28]"
                data-testid="button-book"
                onClick={() => setBookingOpen(true)}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Prendre rendez-vous
              </Button>
            </div>
            <Button
              className="w-full h-12 bg-white border border-[#601B28] text-[#601B28] hover:bg-[#601B28]/5"
              data-testid="button-request-quote"
              onClick={() => setDevisOpen(true)}
            >
              Demander un devis
            </Button>
          </div>
        </div>

        <Tabs defaultValue="portfolio" className="mt-8">
          <TabsList className="w-full grid grid-cols-2 bg-transparent border-b border-gray-200 rounded-none h-auto p-0">
            <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#601B28] data-[state=active]:bg-transparent data-[state=active]:text-[#601B28] data-[state=active]:shadow-none bg-transparent py-3" data-testid="tab-portfolio">
              {t('tailorProfile.portfolio')} ({portfolio?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#601B28] data-[state=active]:bg-transparent data-[state=active]:text-[#601B28] data-[state=active]:shadow-none bg-transparent py-3" data-testid="tab-reviews">
              {t('tailorProfile.reviewsTab')} ({reviews?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {portfolioLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <PortfolioCardSkeleton key={i} />
                ))
              ) : portfolio && portfolio.length > 0 ? (
                portfolio.map((item) => (
                  <PortfolioCard key={item.id} item={item} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">{t('tailorProfile.noRealisations')}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <div>
              {reviewsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <ReviewCardSkeleton key={i} />
                ))
              ) : reviews && reviews.length > 0 ? (
                reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">{t('tailorProfile.noReviews')}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prendre rendez-vous</DialogTitle>
            <DialogDescription>
              Choisissez une date et une heure pour votre rendez-vous avec {tailor ? getFullName(tailor.user) : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de rendez-vous</Label>
              <Select value={bookingType} onValueChange={setBookingType}>
                <SelectTrigger data-testid="select-booking-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="measurements">Prise de mesures</SelectItem>
                  <SelectItem value="fitting">Essayage</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-date">Date</Label>
              <Input
                id="booking-date"
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                data-testid="input-booking-date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-time">Heure</Label>
              <Select value={bookingTime} onValueChange={setBookingTime}>
                <SelectTrigger data-testid="select-booking-time">
                  <SelectValue placeholder="Sélectionnez une heure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="09:00">09:00</SelectItem>
                  <SelectItem value="10:00">10:00</SelectItem>
                  <SelectItem value="11:00">11:00</SelectItem>
                  <SelectItem value="14:00">14:00</SelectItem>
                  <SelectItem value="15:00">15:00</SelectItem>
                  <SelectItem value="16:00">16:00</SelectItem>
                  <SelectItem value="17:00">17:00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-message">Message (optionnel)</Label>
              <Input
                id="booking-message"
                placeholder="Décrivez brièvement votre besoin..."
                value={bookingMessage}
                onChange={(e) => setBookingMessage(e.target.value)}
                data-testid="input-booking-message"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setBookingOpen(false)}
              disabled={bookingMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
              onClick={handleBooking}
              disabled={bookingMutation.isPending || !bookingDate || !bookingTime}
              data-testid="button-confirm-booking"
            >
              {bookingMutation.isPending ? "Envoi…" : "Confirmer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={devisOpen} onOpenChange={(open) => { setDevisOpen(open); if (!open) resetDevisForm(); }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Demander un devis</DialogTitle>
            <DialogDescription>
              Décrivez votre projet à {tailor ? getFullName(tailor.user) : 'ce couturier'} pour recevoir un devis personnalisé.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="devis-garment">Type de vêtement / projet</Label>
              <Input
                id="devis-garment"
                placeholder="Ex: Robe de mariée, costume, retouche..."
                value={devisGarment}
                onChange={(e) => setDevisGarment(e.target.value)}
                data-testid="input-devis-garment"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-description">Description du projet *</Label>
              <Textarea
                id="devis-description"
                placeholder="Décrivez vos besoins, matières souhaitées, délais, inspirations..."
                value={devisDescription}
                onChange={(e) => setDevisDescription(e.target.value)}
                rows={3}
                data-testid="input-devis-description"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-deadline">Date limite souhaitée (optionnel)</Label>
              <Input
                id="devis-deadline"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={devisClientDeadline}
                onChange={(e) => setDevisClientDeadline(e.target.value)}
                data-testid="input-devis-deadline"
              />
              {devisClientDeadline && (() => {
                const days = Math.ceil((new Date(devisClientDeadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return days <= 7 ? (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    ⚡ Délai urgent — une majoration de 20% sera appliquée
                  </p>
                ) : null;
              })()}
            </div>
            <div className="space-y-2">
              <Label>Photo d'inspiration (optionnel)</Label>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleDevisPhoto}
                data-testid="input-devis-photo"
              />
              {devisPhoto ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={devisPhoto} alt="Inspiration" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setDevisPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                    data-testid="button-remove-photo"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#601B28]/40 hover:text-[#601B28] transition-colors"
                  data-testid="button-add-photo"
                >
                  <Camera className="h-6 w-6" />
                  <span className="text-xs">Ajouter une photo d'inspiration</span>
                </button>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="devis-price">Budget estimé (optionnel)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="devis-price"
                  type="number"
                  placeholder="Votre budget approximatif"
                  value={devisRequestedPrice}
                  onChange={(e) => setDevisRequestedPrice(e.target.value)}
                  className="pl-9"
                  min="0"
                  data-testid="input-devis-price"
                />
              </div>
              <p className="text-xs text-gray-400">Le professionnel pourra ajuster ce montant dans son devis.</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => { setDevisOpen(false); resetDevisForm(); }}
              disabled={devisMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              className="flex-1 bg-[#601B28] hover:bg-[#4E1522] text-white"
              onClick={() => devisMutation.mutate()}
              disabled={devisMutation.isPending || !devisDescription}
              data-testid="button-confirm-devis"
            >
              {devisMutation.isPending ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
