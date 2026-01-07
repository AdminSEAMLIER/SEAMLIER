import { useQuery } from "@tanstack/react-query";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import { PortfolioCard, PortfolioCardSkeleton } from "@/components/portfolio-card";
import { FilterChip } from "@/components/filter-chip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Search, Scissors, MapPin, Star, SlidersHorizontal } from "lucide-react";
import type { TailorWithUser, PortfolioWithTailor } from "@shared/schema";

const specialties = [
  "Tous",
  "Haute Couture",
  "Retouches",
  "Mariage",
  "Costumes",
  "Robes",
  "Vêtements Africains",
  "Streetwear",
];

const cities = [
  "Toutes les villes",
  "Paris",
  "Lyon",
  "Marseille",
  "Bordeaux",
  "Toulouse",
  "Nice",
  "Nantes",
  "Lille",
];

export default function Discovery() {
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [selectedCity, setSelectedCity] = useState("Toutes les villes");

  const { data: tailors, isLoading: tailorsLoading } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<PortfolioWithTailor[]>({
    queryKey: ["/api/portfolio"],
  });

  const filteredTailors = tailors?.filter((tailor) => {
    const matchesFilter = selectedFilter === "Tous" || tailor.specialties?.includes(selectedFilter);
    const matchesSearch = !searchQuery || 
      tailor.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tailor.user.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "Toutes les villes" || 
      tailor.user.location?.toLowerCase().includes(selectedCity.toLowerCase());
    return matchesFilter && matchesSearch && matchesCity;
  }).sort((a, b) => {
    if (sortBy === "rating") {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === "reviews") {
      return (b.reviewCount || 0) - (a.reviewCount || 0);
    }
    return 0;
  });

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-2">
            Trouvez votre couturier
          </h1>
          <p className="text-gray-600 mb-6">
            Parcourez les profils de nos artisans couturiers vérifiés
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white border-gray-200"
              data-testid="input-search-discovery"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#722F37]" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[160px] border-gray-200" data-testid="select-city">
                  <SelectValue placeholder="Ville" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#722F37]" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] border-gray-200" data-testid="select-sort">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Par défaut</SelectItem>
                  <SelectItem value="rating">Mieux notés</SelectItem>
                  <SelectItem value="reviews">Plus d'avis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {specialties.map((specialty) => (
              <FilterChip
                key={specialty}
                label={specialty}
                isActive={selectedFilter === specialty}
                onClick={() => setSelectedFilter(specialty)}
              />
            ))}
          </div>
        </div>
      </div>

      <section className="px-4 lg:px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-[#722F37]">
            Couturiers disponibles
          </h2>
          <p className="text-gray-500 text-sm">
            {filteredTailors?.length || 0} résultats
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tailorsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <TailorCardSkeleton key={i} />
            ))
          ) : filteredTailors && filteredTailors.length > 0 ? (
            filteredTailors.map((tailor) => (
              <TailorCard key={tailor.id} tailor={tailor} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun couturier trouvé</p>
              <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
            </div>
          )}
        </div>
      </section>

      <section className="px-4 lg:px-6 py-12 max-w-7xl mx-auto">
        <h2 className="font-serif text-2xl text-[#722F37] mb-6">
          Dernières réalisations
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <p className="text-gray-500">Aucune réalisation disponible</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
