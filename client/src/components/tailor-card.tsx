import { Star, MapPin, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import type { TailorWithUser } from "@shared/schema";

interface TailorCardProps {
  tailor: TailorWithUser;
}

export function TailorCard({ tailor }: TailorCardProps) {
  return (
    <Link href={`/tailor/${tailor.id}`}>
      <div 
        className="group relative aspect-[3/4] rounded-xl overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
        data-testid={`card-tailor-${tailor.id}`}
      >
        <img
          src={tailor.coverImageUrl || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=533&fit=crop`}
          alt={tailor.user.fullName}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg">{tailor.user.fullName}</h3>
            {tailor.isVerified && (
              <BadgeCheck className="h-4 w-4 text-primary" fill="currentColor" />
            )}
          </div>
          
          {tailor.specialties && tailor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {tailor.specialties.slice(0, 2).map((specialty) => (
                <Badge 
                  key={specialty} 
                  variant="secondary" 
                  className="text-xs bg-white/20 text-white border-none backdrop-blur-sm"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{tailor.rating?.toFixed(1) || "Nouveau"}</span>
              {tailor.reviewCount && tailor.reviewCount > 0 && (
                <span className="text-white/70">({tailor.reviewCount})</span>
              )}
            </div>
            
            {tailor.user.location && (
              <div className="flex items-center gap-1 text-white/80">
                <MapPin className="h-3 w-3" />
                <span className="text-xs">{tailor.user.location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function TailorCardSkeleton() {
  return (
    <div className="aspect-[3/4] rounded-xl overflow-hidden skeleton-shimmer" />
  );
}
