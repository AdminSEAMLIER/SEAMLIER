import { useQuery } from "@tanstack/react-query";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import { PortfolioCard, PortfolioCardSkeleton } from "@/components/portfolio-card";
import { FilterChip } from "@/components/filter-chip";
import { useState } from "react";
import { Scissors } from "lucide-react";
import { Logo } from "@/components/logo";
import heroImage from "@assets/stock_images/beautiful_evening_go_76ac947c.jpg";
import type { TailorWithUser, PortfolioWithTailor } from "@shared/schema";

const specialties = [
  "Haute Couture",
  "Retouches",
  "Mariage",
  "Costumes",
  "Robes",
  "Vêtements Africains",
  "Streetwear",
];

export default function Discovery() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  const { data: tailors, isLoading: tailorsLoading } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<PortfolioWithTailor[]>({
    queryKey: ["/api/portfolio"],
  });

  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      <section className="relative h-[50vh] lg:h-[60vh] overflow-hidden">
        <img
          src={heroImage}
          alt="L'art de la couture"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
        
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <Logo 
            className="text-white drop-shadow-lg mb-4" 
            textClassName="text-xl lg:text-2xl text-white drop-shadow-lg" 
            showText={true}
          />
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-3 max-w-3xl leading-tight">
            Découvrez nos artisans
          </h1>
          <p className="text-white/90 text-base lg:text-lg max-w-xl">
            Les meilleurs couturiers près de chez vous
          </p>
        </div>
      </section>

      <section className="px-4 lg:px-6 py-8 lg:py-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-section-mobile lg:text-section-desktop text-[#722F37]">
            Couturiers vedettes
          </h2>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {specialties.map((specialty) => (
            <FilterChip
              key={specialty}
              label={specialty}
              isActive={selectedFilters.includes(specialty)}
              onClick={() => toggleFilter(specialty)}
              onRemove={() => toggleFilter(specialty)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {tailorsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TailorCardSkeleton key={i} />
            ))
          ) : tailors && tailors.length > 0 ? (
            tailors.map((tailor) => (
              <TailorCard key={tailor.id} tailor={tailor} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun couturier trouvé</p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 lg:px-6 py-8 lg:py-12 max-w-7xl mx-auto">
        <h2 className="font-serif text-section-mobile lg:text-section-desktop mb-6 text-[#722F37]">
          Inspirations & Réalisations
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {portfolioLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <PortfolioCardSkeleton key={i} />
            ))
          ) : portfolio && portfolio.length > 0 ? (
            portfolio.map((item) => (
              <PortfolioCard key={item.id} item={item} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">Aucune réalisation disponible</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
