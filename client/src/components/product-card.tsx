import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductWithTailor } from "@shared/schema";

interface ProductCardProps {
  product: ProductWithTailor;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card 
        className="overflow-hidden cursor-pointer border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
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
        
        <CardContent className="p-3 bg-white">
          <p className="font-medium text-[#601B28] text-sm line-clamp-1">{product.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {product.price.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
          </p>
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
        <div className="h-3 w-1/2 rounded skeleton-shimmer mt-1" />
      </CardContent>
    </Card>
  );
}
