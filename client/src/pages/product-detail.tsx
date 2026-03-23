import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Heart, 
  Share2, 
  MessageCircle, 
  ShoppingCart,
  Star,
  MapPin,
  BadgeCheck
} from "lucide-react";
import type { ProductWithTailor } from "@shared/schema";

export default function ProductDetail() {
  const [, params] = useRoute("/product/:id");
  const productId = params?.id;

  const { data: product, isLoading } = useQuery<ProductWithTailor>({
    queryKey: ["/api/products", productId],
    enabled: !!productId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen pb-20 lg:pb-8 bg-white">
        <div className="aspect-square max-h-[50vh] skeleton-shimmer" />
        <div className="px-4 lg:px-6 py-6 max-w-2xl mx-auto space-y-4">
          <div className="h-8 w-3/4 rounded skeleton-shimmer" />
          <div className="h-10 w-1/3 rounded skeleton-shimmer" />
          <div className="h-20 w-full rounded skeleton-shimmer" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center pb-20 lg:pb-8 bg-white">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Produit non trouvé</p>
          <Link href="/dashboard-client">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="relative aspect-square max-h-[50vh] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link href="/dashboard-client">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/90 hover:bg-white text-foreground"
              data-testid="button-back"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/90 hover:bg-white text-foreground"
              data-testid="button-share"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-white/90 hover:bg-white text-foreground"
              data-testid="button-favorite"
            >
              <Heart className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-2xl mx-auto">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {product.category && (
              <Badge variant="secondary" className="mb-2 bg-muted/50 text-foreground border-none">
                {product.category}
              </Badge>
            )}
            <h1 className="font-serif text-2xl lg:text-3xl text-[#601B28]">
              {product.title}
            </h1>
          </div>
          <p className="font-bold text-2xl text-[#601B28] flex-shrink-0">
            {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
        </div>

        {product.description && (
          <p className="text-muted-foreground mb-6 leading-relaxed">
            {product.description}
          </p>
        )}

        <Card className="p-4 mb-6 border-border shadow-sm">
          <Link href={`/tailor/${product.tailor.id}`}>
            <div className="flex items-center gap-3 cursor-pointer">
              <Avatar className="h-12 w-12">
                <AvatarImage src={product.tailor.user.profileImageUrl || undefined} />
                <AvatarFallback className="bg-[#601B28] text-white">
                  {product.tailor.user.firstName?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-foreground">{[product.tailor.user.firstName, product.tailor.user.lastName].filter(Boolean).join(' ')}</h3>
                  {product.tailor.isVerified && (
                    <BadgeCheck className="h-4 w-4 text-[#601B28]" fill="currentColor" />
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span>{product.tailor.rating?.toFixed(1) || "Nouveau"}</span>
                  </div>
                  {product.tailor.user.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{product.tailor.user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </Card>

        <div className="flex gap-3">
          <Button className="flex-1 h-12 bg-[#601B28] hover:bg-[#4E1522]" data-testid="button-add-cart">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Ajouter au panier
          </Button>
          <Button variant="outline" className="flex-1 h-12 bg-white border-[#601B28] text-[#601B28] hover:bg-muted/50" data-testid="button-contact-seller">
            <MessageCircle className="h-5 w-5 mr-2" />
            Contacter
          </Button>
        </div>

        {product.inStock === false && (
          <p className="text-center text-red-600 mt-4 font-medium">
            Ce produit n'est plus disponible
          </p>
        )}
      </div>
    </div>
  );
}
