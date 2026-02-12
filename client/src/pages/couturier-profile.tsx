import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioCard, PortfolioCardSkeleton } from "@/components/portfolio-card";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ReviewCard, ReviewCardSkeleton } from "@/components/review-card";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { 
  Star, 
  MapPin, 
  BadgeCheck, 
  MessageCircle, 
  Calendar, 
  Clock, 
  ArrowLeft,
  Share2,
  Heart
} from "lucide-react";
import type { TailorWithUser, PortfolioWithTailor, ProductWithTailor, ReviewWithUser } from "@shared/schema";

export default function CouturierProfile() {
  const { t } = useTranslation();
  const [, params] = useRoute("/couturier/:id");
  const tailorId = params?.id;

  const { data: tailor, isLoading: tailorLoading } = useQuery<TailorWithUser>({
    queryKey: ["/api/tailors", tailorId],
    enabled: !!tailorId,
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<PortfolioWithTailor[]>({
    queryKey: ["/api/tailors", tailorId, "portfolio"],
    enabled: !!tailorId,
  });

  const { data: products, isLoading: productsLoading } = useQuery<ProductWithTailor[]>({
    queryKey: ["/api/tailors", tailorId, "products"],
    enabled: !!tailorId,
  });

  const { data: reviews, isLoading: reviewsLoading } = useQuery<ReviewWithUser[]>({
    queryKey: ["/api/tailors", tailorId, "reviews"],
    enabled: !!tailorId,
  });

  if (tailorLoading) {
    return (
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen flex items-center justify-center bg-background">
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background">
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
              <Button size="sm" className="bg-[#722F37] hover:bg-[#5a252c] text-white px-1.5 md:px-3 lg:px-4 text-xs md:text-sm lg:text-base h-7 md:h-8 lg:h-9">
                {t('landing.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="relative h-48 md:h-64">
        <img
          src={tailor.coverImageUrl || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=400&fit=crop`}
          alt={`${tailor.user.firstName || ''} ${tailor.user.lastName || ''}`.trim()}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      </div>

      <div className="px-4 lg:px-6 -mt-16 relative z-10 max-w-4xl mx-auto">
        <div className="flex items-end gap-4">
          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
            <AvatarImage src={tailor.user.profileImageUrl || undefined} alt={`${tailor.user.firstName || ''} ${tailor.user.lastName || ''}`.trim()} />
            <AvatarFallback className="bg-[#722F37] text-white text-2xl">
              {`${tailor.user.firstName?.[0] || ''}${tailor.user.lastName?.[0] || ''}`.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 pt-4">
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-2xl lg:text-3xl text-foreground">
                {`${tailor.user.firstName || ''} ${tailor.user.lastName || ''}`.trim() || 'Couturier'}
              </h1>
              {tailor.isVerified && (
                <BadgeCheck className="h-6 w-6 text-primary" fill="currentColor" />
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
                  className="bg-[#f8f5f5] text-[#722F37] border border-[#722F37]/20"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          )}

          {tailor.bio && (
            <p className="text-muted-foreground leading-relaxed mb-6">
              {tailor.bio}
            </p>
          )}

          <div className="bg-muted border border-border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href={`/particulier/messages?tailor=${tailorId}`}>
                <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white w-full sm:w-auto" data-testid="button-contact-tailor">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Envoyer un message
                </Button>
              </Link>
              <Button variant="outline" className="border-primary text-primary w-full sm:w-auto" data-testid="button-book-appointment">
                <Calendar className="h-4 w-4 mr-2" />
                Prendre rendez-vous
              </Button>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="portfolio" className="mt-6">
          <TabsList className="w-full grid grid-cols-3 bg-transparent border-b border-border rounded-none h-auto p-0">
            <TabsTrigger value="portfolio" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent py-3 text-sm">
              {t('tailorProfile.portfolio')}
            </TabsTrigger>
            <TabsTrigger value="boutique" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent py-3 text-sm">
              {t('tailorProfile.shop')}
            </TabsTrigger>
            <TabsTrigger value="avis" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none bg-transparent py-3 text-sm">
              Avis
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

          <TabsContent value="boutique" className="mt-4">
            {productsLoading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t('tailorProfile.noProducts')}
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
        </Tabs>
      </div>
      
      <div className="h-8" />
    </div>
  );
}
