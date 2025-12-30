import { Heart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { PortfolioWithTailor } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PortfolioCardProps {
  item: PortfolioWithTailor;
}

export function PortfolioCard({ item }: PortfolioCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <div 
      className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer"
      data-testid={`card-portfolio-${item.id}`}
    >
      <img
        src={item.imageUrl}
        alt={item.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
      />
      
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          "absolute top-2 right-2 bg-black/30 backdrop-blur-sm text-white hover:bg-black/50",
          isLiked && "text-red-500"
        )}
        onClick={(e) => {
          e.preventDefault();
          setIsLiked(!isLiked);
        }}
        data-testid={`button-like-${item.id}`}
      >
        <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
      </Button>
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <p className="font-medium text-sm">{item.title}</p>
          <p className="text-xs text-white/80">par {item.tailor.user.fullName}</p>
        </div>
      </div>
    </div>
  );
}

export function PortfolioCardSkeleton() {
  return (
    <div className="aspect-square rounded-xl overflow-hidden skeleton-shimmer" />
  );
}
