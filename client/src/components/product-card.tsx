import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProductWithTailor } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithTailor;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/particulier/product/${product.id}`}>
      <div 
        className="group cursor-pointer"
        data-testid={`card-product-${product.id}`}
      >
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          
          <div className="absolute bottom-2 right-2">
            <Avatar className="h-8 w-8 border-2 border-white shadow-md">
              <AvatarImage src={product.tailor.user.avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                {product.tailor.user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
        
        <div className="space-y-1">
          <h3 className="font-medium text-card-title line-clamp-2 group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className="font-semibold text-lg">
            {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
          <p className="text-sm text-muted-foreground">
            par {product.tailor.user.fullName}
          </p>
        </div>
      </div>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[3/4] rounded-xl overflow-hidden skeleton-shimmer mb-3" />
      <div className="space-y-2">
        <div className="h-5 w-3/4 rounded skeleton-shimmer" />
        <div className="h-6 w-1/3 rounded skeleton-shimmer" />
        <div className="h-4 w-1/2 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
