import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ReviewWithUser } from "@shared/schema";

interface ReviewCardProps {
  review: ReviewWithUser;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const formattedDate = new Date(review.createdAt).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div 
      className="flex gap-4 py-4 border-b border-border last:border-b-0"
      data-testid={`card-review-${review.id}`}
    >
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={review.user.avatarUrl || undefined} />
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {review.user.fullName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-medium text-sm">{review.user.fullName}</h4>
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        
        <div className="flex items-center gap-0.5 mb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < review.rating 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "fill-muted text-muted"
              }`}
            />
          ))}
        </div>
        
        {review.comment && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {review.comment}
          </p>
        )}
      </div>
    </div>
  );
}

export function ReviewCardSkeleton() {
  return (
    <div className="flex gap-4 py-4 border-b border-border">
      <div className="h-10 w-10 rounded-full skeleton-shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <div className="h-4 w-24 rounded skeleton-shimmer" />
          <div className="h-4 w-16 rounded skeleton-shimmer" />
        </div>
        <div className="h-3 w-20 rounded skeleton-shimmer" />
        <div className="h-4 w-full rounded skeleton-shimmer" />
        <div className="h-4 w-3/4 rounded skeleton-shimmer" />
      </div>
    </div>
  );
}
