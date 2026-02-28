import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import { PortfolioCard, PortfolioCardSkeleton } from "@/components/portfolio-card";
import { FilterChip } from "@/components/filter-chip";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useSearch } from "wouter";
import { Search, Scissors, MapPin, Star } from "lucide-react";
import type { TailorWithUser, PortfolioWithTailor } from "@shared/schema";

const specialtyKeys = [
  { key: "all", dbValue: "all" },
  { key: "hauteCouture", dbValue: "Haute Couture" },
  { key: "alterations", dbValue: "Retouches" },
  { key: "wedding", dbValue: "Mariage" },
  { key: "suits", dbValue: "Costumes" },
  { key: "dresses", dbValue: "Robes" },
  { key: "african", dbValue: "Vêtements Africains" },
  { key: "streetwear", dbValue: "Streetwear" },
];

const cities = [
  "all",
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
  const { t } = useTranslation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const villeParam = urlParams.get("ville") || "";

  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState(villeParam);
  const [sortBy, setSortBy] = useState("default");
  const matchingCity = villeParam && cities.includes(villeParam) ? villeParam : "all";
  const [selectedCity, setSelectedCity] = useState(matchingCity);

  useEffect(() => {
    if (villeParam) {
      setSearchQuery(villeParam);
      if (cities.includes(villeParam)) {
        setSelectedCity(villeParam);
      }
    }
  }, [villeParam]);

  const { data: tailors, isLoading: tailorsLoading } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const { data: portfolio, isLoading: portfolioLoading } = useQuery<PortfolioWithTailor[]>({
    queryKey: ["/api/portfolio"],
  });

  const getDbValueForFilter = (filterKey: string) => {
    const found = specialtyKeys.find(s => s.key === filterKey);
    return found?.dbValue || filterKey;
  };

  const filteredTailors = tailors?.filter((tailor) => {
    const dbValue = getDbValueForFilter(selectedFilter);
    const matchesFilter = selectedFilter === "all" || tailor.specialties?.includes(dbValue);
    const fullName = `${tailor.user.firstName || ''} ${tailor.user.lastName || ''}`.trim();
    const matchesSearch = !searchQuery || 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tailor.user.location?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === "all" || 
      tailor.user.location?.toLowerCase().includes(selectedCity.toLowerCase());
    return matchesFilter && matchesSearch && matchesCity;
  }).sort((a, b) => {
    if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0);
    if (sortBy === "reviews") return (b.reviewCount || 0) - (a.reviewCount || 0);
    return 0;
  });

  const getCityLabel = (city: string) => {
    if (city === "all") return t('discovery.allCities');
    return city;
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <Search className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('discovery.title')}
            </h1>
          </div>
          <p className="text-gray-500 mb-6">
            {t('discovery.adjustFilters')}
          </p>

          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder={t('landing.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white border-gray-200 focus:border-[#722F37] focus:ring-[#722F37]"
              data-testid="input-search-discovery"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#722F37]" />
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-[160px] bg-white border-gray-200" data-testid="select-city">
                  <SelectValue placeholder={t('discovery.filterByCity')} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  {cities.map((city) => (
                    <SelectItem key={city} value={city} className="focus:bg-gray-100">
                      {getCityLabel(city)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-[#722F37]" />
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px] bg-white border-gray-200" data-testid="select-sort">
                  <SelectValue placeholder={t('discovery.sortBy')} />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="default" className="focus:bg-gray-100">{t('discovery.sortBy')}</SelectItem>
                  <SelectItem value="rating" className="focus:bg-gray-100">{t('discovery.bestRating')}</SelectItem>
                  <SelectItem value="reviews" className="focus:bg-gray-100">{t('discovery.mostReviews')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-[#722F37]" />
              <span className="text-sm font-medium text-gray-700">{t('discovery.specialties')}:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {specialtyKeys.map((specialty) => (
                <FilterChip
                  key={specialty.key}
                  label={specialty.key === "all" ? t('discovery.allSpecialties') : t(`specialties.${specialty.key}`)}
                  isActive={selectedFilter === specialty.key}
                  onClick={() => setSelectedFilter(specialty.key)}
                  className={selectedFilter === specialty.key ? "bg-[#722F37] text-white border-[#722F37]" : "bg-white text-gray-600 border-gray-200 hover:border-[#722F37] hover:text-[#722F37]"}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12">
          <h2 className="font-serif text-2xl text-[#722F37] mb-6">
            Nos Artisans
          </h2>

          {tailorsLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <TailorCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredTailors && filteredTailors.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTailors.map((tailor) => (
                <TailorCard key={tailor.id} tailor={tailor} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
              <Scissors className="h-12 w-12 mx-auto mb-4 text-[#722F37]/30" />
              <p className="text-lg font-medium text-[#722F37]">{t('discovery.noResults')}</p>
              <p className="text-sm text-gray-500 mt-1">{t('discovery.adjustFilters')}</p>
            </div>
          )}
        </div>

        {portfolio && portfolio.length > 0 && (
          <div className="mt-20 border-t border-gray-100 pt-12">
            <h2 className="font-serif text-2xl text-[#722F37] mb-6">
              {t('tailor.portfolio')}
            </h2>

            {portfolioLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <PortfolioCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {portfolio.slice(0, 8).map((item) => (
                  <PortfolioCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
