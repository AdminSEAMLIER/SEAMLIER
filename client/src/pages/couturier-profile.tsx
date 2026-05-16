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
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  X,
  Briefcase,
  Languages,
  FolderOpen,
} from "lucide-react";
import type { TailorWithUser, PortfolioWithTailor, ReviewWithUser } from "@shared/schema";

export default function CouturierProfile() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [, params] = useRoute("/profil-pro/:id");
  const tailorId = params?.id;
  const [showLoginHint, setShowLoginHint] = useState(false);

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
        tailorId,
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
        tailorId,
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

  const { data: workingHours } = useQuery<any[]>({
    queryKey: ["/api/tailors", tailorId, "working-hours"],
    queryFn: async () => {
      const res = await fetch(`/api/tailors/${tailorId}/working-hours`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!tailorId,
  });

  const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const openDays = (workingHours || []).filter((h: any) => !h.is_closed && h.start_time);

  if (tailorLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-64 skeleton-shimmer" />
        <div className="px-4 lg:px-6 -mt-16 max-w-4xl mx-auto">
          <div className="h-24 w-24 rounded-full skeleton-shimmer border-4 border-background" />
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t('tailorProfile.notFound')}</p>
          <Link href="/recherche">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('recherche.backToSearch')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const tailorName = `${tailor.user.firstName || ''} ${tailor.user.lastName || ''}`.trim() || 'Couturier';

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border sticky top-0 z-50 bg-white">
        <div className="w-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/recherche">
              <Button variant="ghost" size="icon" className="text-primary">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Logo className="text-primary shrink-0" textClassName="text-base lg:text-lg text-primary" />
          </div>
          <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
            <LanguageToggle />
            <Link href="/connexion">
              <Button variant="ghost" size="sm" className="text-primary px-1.5 md:px-3 lg:px-4 text-xs md:text-sm lg:text-base h-7 md:h-8 lg:h-9">
                {t('landing.login')}
              </Button>
            </Link>
            <Link href="/inscription">
              <Button size="sm" className="bg-[#601B28] hover:bg-[#4E1522] text-white px-1.5 md:px-3 lg:px-4 text-xs md:text-sm lg:text-base h-7 md:h-8 lg:h-9">
                {t('landing.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative h-48 md:h-64">
        <img
          src={tailor.coverImageUrl || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=400&fit=crop`}
          alt={tailorName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="px-4 lg:px-6 -mt-16 relative z-10 max-w-4xl mx-auto">
        <div className="flex items-end gap-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={tailor.user.profileImageUrl || undefined} alt={tailorName} />
            <AvatarFallback className="bg-[#601B28] text-white text-2xl">
              {`${tailor.user.firstName?.[0] || ''}${tailor.user.lastName?.[0] || ''}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0 pt-4">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl lg:text-3xl text-foreground break-words min-w-0">
                {tailorName}
              </h1>
              {tailor.isVerified && (
                <BadgeCheck className="h-6 w-6 text-primary shrink-0" fill="currentColor" />
              )}
            </div>
          </div>
        </div>

        <Card className="mt-4 p-4 lg:p-6 border border-border shadow-sm">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            {tailor.user.location && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{tailor.user.location}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{tailor.rating?.toFixed(1) || "Nouveau"}</span>
              {tailor.reviewCount && tailor.reviewCount > 0 && (
                <span className="text-muted-foreground">({tailor.reviewCount} Avis)</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Disponible</span>
            </div>
          </div>

          {tailor.specialties && tailor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tailor.specialties.map((specialty) => (
                <Badge
                  key={specialty}
                  variant="secondary"
                  className="bg-[#f8f5f5] text-[#601B28] border border-[#601B28]/20"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          )}

          {tailor.bio && (
            <p className="text-muted-foreground leading-relaxed mb-4">
              {tailor.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-muted-foreground">
            {(tailor as any).experience != null && (
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 shrink-0" />
                <span>{(tailor as any).experience} an{(tailor as any).experience > 1 ? "s" : ""} d'expérience</span>
              </div>
            )}
            {tailor.portfolioCount != null && tailor.portfolioCount > 0 && (
              <div className="flex items-center gap-1.5">
                <FolderOpen className="h-4 w-4 shrink-0" />
                <span>{tailor.portfolioCount} réalisation{tailor.portfolioCount > 1 ? "s" : ""}</span>
              </div>
            )}
            {Array.isArray((tailor as any).languages) && (tailor as any).languages.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Languages className="h-4 w-4 shrink-0" />
                <span>{(tailor as any).languages.join(", ")}</span>
              </div>
            )}
            {((tailor as any).priceMin != null || (tailor as any).priceMax != null) && (
              <div className="flex items-center gap-1.5">
                <Euro className="h-4 w-4 shrink-0" />
                <span>
                  {(tailor as any).priceMin != null && (tailor as any).priceMax != null
                    ? `${(tailor as any).priceMin} € – ${(tailor as any).priceMax} €`
                    : (tailor as any).priceMin != null
                    ? `À partir de ${(tailor as any).priceMin} €`
                    : `Jusqu'à ${(tailor as any).priceMax} €`}
                </span>
              </div>
            )}
          </div>

          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row gap-2">
                {isAuthenticated ? (
                  <Link href={`/messages?tailor=${tailorId}`} className="flex-1">
                    <Button className="bg-[#601B28] hover:bg-[#4E1522] text-white w-full" data-testid="button-contact-tailor">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Envoyer un message
                    </Button>
                  </Link>
                ) : (
                  <Button
                    className="bg-[#601B28] hover:bg-[#4E1522] text-white flex-1"
                    data-testid="button-contact-tailor"
                    onClick={() => setShowLoginHint(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Envoyer un message
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 border-primary text-primary"
                  data-testid="button-book-appointment"
                  onClick={() => isAuthenticated ? setBookingOpen(true) : setShowLoginHint(true)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Prendre rendez-vous
                </Button>
              </div>
              <Button
                className="w-full bg-white border border-[#601B28] text-[#601B28] hover:bg-[#601B28]/5"
                data-testid="button-request-quote"
                onClick={() => isAuthenticated ? setDevisOpen(true) : setShowLoginHint(true)}
              >
                Demander un devis
              </Button>
              {showLoginHint && (
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Connectez-vous pour contacter cet artisan.{" "}
                  <Link href={`/connexion?redirect=/profil-pro/${tailorId}`} className="text-[#601B28] underline">
                    Se connecter
                  </Link>
                </p>
              )}
            </div>
          </div>
        </Card>

        <Tabs defaultValue="portfolio" className="mt-6">
          <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-border rounded-none h-auto p-0">
            <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent py-3 text-sm">
              {t('tailorProfile.portfolio')}
            </TabsTrigger>
            <TabsTrigger value="avis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent py-3 text-sm">
              {t('tailorProfile.reviewsTab')}
            </TabsTrigger>
            <TabsTrigger value="apropos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent py-3 text-sm">
              À propos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="mt-4">
            {portfolioLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => (
                  <PortfolioCardSkeleton key={i} />
                ))}
              </div>
            ) : portfolio && portfolio.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {portfolio.map((item) => (
                  <PortfolioCard key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('tailorProfile.noPortfolio')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="avis" className="mt-4">
            {reviewsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <ReviewCardSkeleton key={i} />
                ))}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('tailorProfile.noReviews')}
              </div>
            )}
          </TabsContent>

          <TabsContent value="apropos" className="mt-4 space-y-5">
            {(tailor as any).bio && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">Bio</h3>
                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">{(tailor as any).bio}</p>
              </div>
            )}

            {(tailor as any).experience != null && (
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">{(tailor as any).experience} an{(tailor as any).experience > 1 ? "s" : ""} d'expérience</span>
              </div>
            )}

            {Array.isArray((tailor as any).languages) && (tailor as any).languages.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                  <Languages className="h-4 w-4" /> Langues parlées
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(tailor as any).languages.map((lang: string) => (
                    <Badge key={lang} variant="secondary" className="bg-[#f8f5f5] text-[#601B28] border border-[#601B28]/20">{lang}</Badge>
                  ))}
                </div>
              </div>
            )}

            {tailor.specialties && tailor.specialties.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2">Spécialités</h3>
                <div className="flex flex-wrap gap-2">
                  {tailor.specialties.map((s) => (
                    <Badge key={s} variant="secondary" className="bg-[#f8f5f5] text-[#601B28] border border-[#601B28]/20">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {((tailor as any).priceMin != null || (tailor as any).priceMax != null) && (
              <div className="flex items-center gap-3">
                <Euro className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm">
                  Tarif indicatif :{" "}
                  {(tailor as any).priceMin != null && (tailor as any).priceMax != null
                    ? `${(tailor as any).priceMin} € – ${(tailor as any).priceMax} €`
                    : (tailor as any).priceMin != null
                    ? `À partir de ${(tailor as any).priceMin} €`
                    : `Jusqu'à ${(tailor as any).priceMax} €`}
                </span>
              </div>
            )}

            {openDays.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Disponibilités
                </h3>
                <div className="space-y-1.5">
                  {openDays.map((h: any) => (
                    <div key={h.day_of_week} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground w-12">{DAY_LABELS[h.day_of_week]}</span>
                      <span className="font-medium">{h.start_time} – {h.end_time}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!(tailor as any).bio && (tailor as any).experience == null && !(Array.isArray((tailor as any).languages) && (tailor as any).languages.length) && !tailor.specialties?.length && openDays.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Aucune information supplémentaire disponible.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <div className="h-8" />

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Prendre rendez-vous</DialogTitle>
            <DialogDescription>
              Choisissez une date et une heure pour rencontrer {tailorName}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Type de rendez-vous</Label>
              <Select value={bookingType} onValueChange={setBookingType}>
                <SelectTrigger>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking-time">Heure</Label>
              <Select value={bookingTime} onValueChange={setBookingTime}>
                <SelectTrigger>
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
              onClick={() => bookingMutation.mutate()}
              disabled={bookingMutation.isPending || !bookingDate || !bookingTime}
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
              Décrivez votre projet à {tailorName} pour recevoir un devis personnalisé.
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
              />
              {devisPhoto ? (
                <div className="relative rounded-lg overflow-hidden border border-gray-200">
                  <img src={devisPhoto} alt="Inspiration" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setDevisPhoto(null); if (photoInputRef.current) photoInputRef.current.value = ""; }}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
                  >
                    <X className="h-4 w-4 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-24 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#601B28]/40 hover:text-[#601B28] transition-colors"
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
            >
              {devisMutation.isPending ? "Envoi…" : "Envoyer la demande"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
