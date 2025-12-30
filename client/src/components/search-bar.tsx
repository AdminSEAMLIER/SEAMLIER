import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onFilterClick, placeholder = "Rechercher un couturier..." }: SearchBarProps) {
  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-12 pl-12 pr-4 rounded-full bg-card border-card-border shadow-md focus-visible:ring-primary"
          data-testid="input-search"
        />
      </div>
      
      {onFilterClick && (
        <Button
          size="icon"
          variant="secondary"
          className="h-12 w-12 rounded-full shadow-md"
          onClick={onFilterClick}
          data-testid="button-filter"
        >
          <SlidersHorizontal className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
