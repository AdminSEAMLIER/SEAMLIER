import { Card, CardContent } from "@/components/ui/card";
import type { PortfolioWithTailor } from "@shared/schema";

interface PortfolioCardProps {
  item: PortfolioWithTailor;
}

export function PortfolioCard({ item }: PortfolioCardProps) {
  return (
    <Card 
      className="overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      data-testid={`card-portfolio-${item.id}`}
    >
      <div className="relative aspect-square overflow-hidden">
        <img
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      <CardContent className="p-3">
        <p className="font-medium text-gray-900 text-sm line-clamp-1">{item.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">par {item.tailor.user.fullName}</p>
      </CardContent>
    </Card>
  );
}

export function PortfolioCardSkeleton() {
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
