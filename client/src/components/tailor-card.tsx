import { Star, MapPin, BadgeCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import type { TailorWithUser } from "@shared/schema";

interface TailorCardProps {
  tailor: TailorWithUser;
  linkPrefix?: string;
}

export function TailorCard({ tailor, linkPrefix = "/tailor" }: TailorCardProps) {
  const fullName = `${tailor.user.firstName || ''} ${tailor.user.lastName || ''}`.trim() || 'Couturier';
  const initials = `${tailor.user.firstName?.[0] || ''}${tailor.user.lastName?.[0] || ''}`.toUpperCase() || 'C';
  
  return (
    <Link href={`${linkPrefix}/${tailor.id}`}>
      <Card 
        className="overflow-hidden cursor-pointer border border-border bg-background shadow-sm hover:shadow-md transition-shadow"
        data-testid={`card-tailor-${tailor.id}`}
      >
        <div className="relative h-40 overflow-hidden">
          <img
            src={tailor.coverImageUrl || `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop`}
            alt={fullName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm -mt-8 relative z-10">
              <AvatarImage src={tailor.user.profileImageUrl || undefined} alt={fullName} />
              <AvatarFallback className="bg-[#722F37] text-white text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-[#722F37] truncate">{fullName}</h3>
                {tailor.isVerified && (
                  <BadgeCheck className="h-4 w-4 text-[#722F37] flex-shrink-0" fill="currentColor" />
                )}
              </div>
              
              {tailor.user.location && (
                <div className="flex items-center gap-1 text-muted-foreground text-sm mt-0.5">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{tailor.user.location}</span>
                </div>
              )}
            </div>
          </div>
          
          {tailor.specialties && tailor.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tailor.specialties.slice(0, 3).map((specialty) => (
                <Badge 
                  key={specialty} 
                  variant="secondary" 
                  className="text-xs bg-muted/50 text-muted-foreground border-none"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium text-foreground">{tailor.rating?.toFixed(1) || "Nouveau"}</span>
              {tailor.reviewCount && tailor.reviewCount > 0 && (
                <span className="text-muted-foreground">({tailor.reviewCount} avis)</span>
              )}
            </div>
            
            <span className="text-[#722F37] text-sm font-medium">Voir le profil</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function TailorCardSkeleton() {
  return (
    <Card className="overflow-hidden border border-border">
      <div className="h-40 skeleton-shimmer" />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full skeleton-shimmer -mt-8" />
          <div className="flex-1 pt-1 space-y-2">
            <div className="h-4 w-32 skeleton-shimmer rounded" />
            <div className="h-3 w-24 skeleton-shimmer rounded" />
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          <div className="h-5 w-16 skeleton-shimmer rounded-full" />
          <div className="h-5 w-20 skeleton-shimmer rounded-full" />
        </div>
        <div className="flex justify-between mt-3 pt-3 border-t border-border">
          <div className="h-4 w-20 skeleton-shimmer rounded" />
          <div className="h-4 w-16 skeleton-shimmer rounded" />
        </div>
      </CardContent>
    </Card>
  );
}
