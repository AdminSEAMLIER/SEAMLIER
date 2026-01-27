import { Card, CardContent } from "@/components/ui/card";
import type { PortfolioWithTailor, PortfolioItem } from "@shared/schema";

interface PortfolioCardProps {
  item: PortfolioWithTailor | PortfolioItem;
  showAuthor?: boolean;
}

export function PortfolioCard({ item, showAuthor = true }: PortfolioCardProps) {
  // Check if item has tailor with user info (PortfolioWithTailor type)
  const itemWithTailor = item as PortfolioWithTailor;
  const tailorName = itemWithTailor.tailor?.user 
    ? `${itemWithTailor.tailor.user.firstName || ''} ${itemWithTailor.tailor.user.lastName || ''}`.trim()
    : null;

  return (
    <Card 
      className="overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
      
      <CardContent className="p-3 bg-white">
        <p className="font-medium text-[#722F37] text-sm line-clamp-1">{item.title}</p>
        {showAuthor && tailorName && (
          <p className="text-xs text-gray-500 mt-0.5">par {tailorName}</p>
        )}
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
