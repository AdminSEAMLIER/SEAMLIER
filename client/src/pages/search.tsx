import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import { FilterChip } from "@/components/filter-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Search, MapPin, Star, Clock, Scissors, SlidersHorizontal } from "lucide-react";
import type { TailorWithUser } from "@shared/schema";

const specialties = [
  "Haute Couture",
  "Retouches",
  "Mariage",
  "Costumes",
  "Robes",
  "Vêtements Africains",
  "Streetwear",
  "Mode Enfant",
];

const locations = ["Paris", "Lyon", "Marseille", "Bordeaux", "Lille", "Toulouse"];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 200]);

  const { data: tailors, isLoading } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const filteredTailors = useMemo(() => {
    if (!tailors) return [];
    
    return tailors.filter((tailor) => {
      const matchesSearch = !searchQuery || 
        [tailor.user.firstName, tailor.user.lastName].filter(Boolean).join(' ').toLowerCase().includes(searchQuery.toLowerCase()) ||
        tailor.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSpecialties = selectedSpecialties.length === 0 || 
        selectedSpecialties.some(s => tailor.specialties?.includes(s));
      
      const matchesLocation = !selectedLocation || 
        tailor.user.location === selectedLocation;
      
      const matchesRating = (tailor.rating || 0) >= minRating;
      
      const matchesPrice = true;
      
      return matchesSearch && matchesSpecialties && matchesLocation && matchesRating && matchesPrice;
    });
  }, [tailors, searchQuery, selectedSpecialties, selectedLocation, minRating, priceRange]);

  const toggleSpecialty = (specialty: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const activeFiltersCount = selectedSpecialties.length + (selectedLocation ? 1 : 0) + (minRating > 0 ? 1 : 0);

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28] mb-2">
            Recherche avancée
          </h1>
          <p className="text-muted-foreground mb-6">
            Trouvez le couturier idéal selon vos critères
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom, spécialité..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white border-gray-200"
              data-testid="input-search-advanced"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="lg:flex lg:gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-6 bg-muted/50 p-4 rounded-lg">
              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#601B28]" />
                  Spécialités
                </h3>
                <div className="flex flex-wrap gap-2">
                  {specialties.map((specialty) => (
                    <FilterChip
                      key={specialty}
                      label={specialty}
                      isActive={selectedSpecialties.includes(specialty)}
                      onClick={() => toggleSpecialty(specialty)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[#601B28]" />
                  Localisation
                </h3>
                <div className="flex flex-wrap gap-2">
                  {locations.map((location) => (
                    <FilterChip
                      key={location}
                      label={location}
                      isActive={selectedLocation === location}
                      onClick={() => setSelectedLocation(selectedLocation === location ? null : location)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-[#601B28]" />
                  Note minimum
                </h3>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={minRating === rating ? "default" : "outline"}
                      size="sm"
                      className={minRating === rating ? "bg-[#601B28] hover:bg-[#4E1522]" : ""}
                      onClick={() => setMinRating(rating)}
                      data-testid={`filter-rating-${rating}`}
                    >
                      {rating === 0 ? "Tous" : `${rating}+`}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#601B28]" />
                  Tarif horaire
                </h3>
                <div className="px-2">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    min={0}
                    max={200}
                    step={10}
                    data-testid="slider-price"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{priceRange[0]}€</span>
                    <span>{priceRange[1]}€+</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1">
            <div className="lg:hidden mb-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="w-full justify-between" data-testid="button-filters-mobile">
                    <span className="flex items-center gap-2">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filtres
                    </span>
                    {activeFiltersCount > 0 && (
                      <span className="bg-[#601B28] text-white text-xs px-2 py-0.5 rounded-full">
                        {activeFiltersCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle className="text-[#601B28]">Filtres</SheetTitle>
                  </SheetHeader>
                  <div className="py-6 space-y-6 overflow-y-auto">
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Spécialités</h3>
                      <div className="flex flex-wrap gap-2">
                        {specialties.map((specialty) => (
                          <FilterChip
                            key={specialty}
                            label={specialty}
                            isActive={selectedSpecialties.includes(specialty)}
                            onClick={() => toggleSpecialty(specialty)}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Localisation</h3>
                      <div className="flex flex-wrap gap-2">
                        {locations.map((location) => (
                          <FilterChip
                            key={location}
                            label={location}
                            isActive={selectedLocation === location}
                            onClick={() => setSelectedLocation(selectedLocation === location ? null : location)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl text-[#601B28]">
                Résultats
              </h2>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Chargement..." : `${filteredTailors.length} couturiers`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TailorCardSkeleton key={i} />
                ))
              ) : filteredTailors.length > 0 ? (
                filteredTailors.map((tailor) => (
                  <TailorCard key={tailor.id} tailor={tailor} />
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Scissors className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun couturier ne correspond à vos critères
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">Essayez de modifier vos filtres</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
