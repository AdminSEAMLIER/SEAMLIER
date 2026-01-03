import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  isActive?: boolean;
  onClick: () => void;
}

export function FilterChip({ label, isActive, onClick }: FilterChipProps) {
  return (
    <button
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
        isActive
          ? "bg-[#722F37] text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )}
      onClick={onClick}
      data-testid={`filter-chip-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {label}
    </button>
  );
}
