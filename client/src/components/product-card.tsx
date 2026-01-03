import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ProductWithTailor } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithTailor;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/particulier/product/${product.id}`}>
      <Card 
        className="overflow-hidden cursor-pointer border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
        data-testid={`card-product-${product.id}`}
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <CardContent className="p-3">
          <h3 className="font-medium text-gray-900 line-clamp-1 text-sm">
            {product.title}
          </h3>
          <p className="font-semibold text-[#722F37] mt-1">
            {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
            <Avatar className="h-5 w-5">
              <AvatarImage src={product.tailor.user.avatarUrl || undefined} />
              <AvatarFallback className="text-xs bg-[#722F37] text-white">
                {product.tailor.user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-gray-500 truncate">
              {product.tailor.user.fullName}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-100">
      <div className="aspect-square skeleton-shimmer" />
      <CardContent className="p-3">
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
        <div className="h-5 w-1/3 rounded skeleton-shimmer mt-1" />
        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
          <div className="h-5 w-5 rounded-full skeleton-shimmer" />
          <div className="h-3 w-20 rounded skeleton-shimmer" />
        </div>
      </CardContent>
    </Card>
  );
}
