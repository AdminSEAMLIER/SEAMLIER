import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PortfolioCard, PortfolioCardSkeleton } from "@/components/portfolio-card";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { ReviewCard, ReviewCardSkeleton } from "@/components/review-card";
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

export default function TailorProfile() {
  const [, params] = useRoute("/tailor/:id");
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
      <div className="min-h-screen pb-20 lg:pb-8">
        <div className="h-[40vh] skeleton-shimmer" />
        <div className="px-4 lg:px-6 -mt-16 max-w-4xl mx-auto">
          <div className="h-32 w-32 rounded-full skeleton-shimmer border-4 border-background" />
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
      <div className="min-h-screen flex items-center justify-center pb-20 lg:pb-8">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Couturier non trouvé</p>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      <div className="relative h-[40vh]">
        <img
          src={tailor.coverImageUrl || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=600&fit=crop`}
          alt={tailor.user.fullName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-black/30 backdrop-blur-sm text-white hover:bg-black/50"
              data-testid="button-favorite"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 -mt-16 max-w-4xl mx-auto relative z-10">
        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
          <AvatarImage src={tailor.user.avatarUrl || undefined} />
          <AvatarFallback className="bg-primary text-primary-foreground text-4xl">
            {tailor.user.fullName.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-hero-mobile lg:text-hero-desktop">
              {tailor.user.fullName}
            </h1>
            {tailor.isVerified && (
              <BadgeCheck className="h-6 w-6 text-primary" fill="currentColor" />
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
            {tailor.user.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{tailor.user.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">
                {tailor.rating?.toFixed(1) || "Nouveau"}
              </span>
              {tailor.reviewCount && tailor.reviewCount > 0 && (
                <span>({tailor.reviewCount} avis)</span>
              )}
            </div>
            {tailor.experience && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{tailor.experience} ans d'expérience</span>
              </div>
            )}
          </div>

          {tailor.specialties && tailor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {tailor.specialties.map((specialty) => (
                <Badge key={specialty} variant="secondary">
                  {specialty}
                </Badge>
              ))}
            </div>
          )}

          {tailor.bio && (
            <p className="mt-4 text-muted-foreground leading-relaxed">
              {tailor.bio}
            </p>
          )}

          <div className="flex gap-3 mt-6">
            <Button className="flex-1 rounded-full h-12" data-testid="button-contact">
              <MessageCircle className="h-5 w-5 mr-2" />
              Contacter
            </Button>
            <Button variant="outline" className="flex-1 rounded-full h-12" data-testid="button-book">
              <Calendar className="h-5 w-5 mr-2" />
              Réserver
            </Button>
          </div>

          {tailor.hourlyRate && (
            <Card className="p-4 mt-6">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tarif horaire</span>
                <span className="font-semibold text-lg">
                  {tailor.hourlyRate.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}/h
                </span>
              </div>
            </Card>
          )}
        </div>

        <Tabs defaultValue="portfolio" className="mt-8">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="portfolio" data-testid="tab-portfolio">
              Portfolio ({portfolio?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">
              Boutique ({products?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="reviews" data-testid="tab-reviews">
              Avis ({reviews?.length || 0})
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
                  <p className="text-muted-foreground">Aucune réalisation</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="products" className="mt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {productsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))
              ) : products && products.length > 0 ? (
                products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground">Aucun produit en vente</p>
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
                  <p className="text-muted-foreground">Aucun avis pour le moment</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
