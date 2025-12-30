import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
  onRemove?: () => void;
}

export function FilterChip({ label, isActive, onClick, onRemove }: FilterChipProps) {
  return (
    <Badge
      variant={isActive ? "default" : "secondary"}
      className={cn(
        "cursor-pointer px-3 py-1.5 text-sm gap-1.5 whitespace-nowrap",
        isActive && "pr-2"
      )}
      onClick={onClick}
      data-testid={`filter-chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {label}
      {isActive && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:bg-primary-foreground/20 rounded-full p-0.5"
          data-testid={`filter-remove-${label.toLowerCase().replace(/\s+/g, '-')}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  );
}
