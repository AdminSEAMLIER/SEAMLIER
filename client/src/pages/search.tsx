import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import { FilterChip } from "@/components/filter-chip";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { MapPin, Star, Clock, Scissors } from "lucide-react";
import { Logo } from "@/components/logo";
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
        tailor.user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tailor.specialties?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesSpecialties = selectedSpecialties.length === 0 || 
        selectedSpecialties.some(s => tailor.specialties?.includes(s));
      
      const matchesLocation = !selectedLocation || 
        tailor.user.location === selectedLocation;
      
      const matchesRating = (tailor.rating || 0) >= minRating;
      
      const matchesPrice = !tailor.hourlyRate || 
        (tailor.hourlyRate >= priceRange[0] && tailor.hourlyRate <= priceRange[1]);
      
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
    <div className="min-h-screen pb-20 lg:pb-8">
      <div className="sticky top-0 lg:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 lg:px-6 py-4 max-w-7xl mx-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onFilterClick={() => {}}
            placeholder="Rechercher par nom, spécialité..."
          />
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="font-serif text-2xl lg:text-3xl text-[#722F37]">
            Recherche de couturiers
          </h1>
        </div>
        <div className="lg:flex lg:gap-8">
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-36 space-y-6">
              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
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
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
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
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Note minimum
                </h3>
                <div className="flex gap-2">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <Button
                      key={rating}
                      variant={minRating === rating ? "default" : "outline"}
                      size="sm"
                      onClick={() => setMinRating(rating)}
                      data-testid={`filter-rating-${rating}`}
                    >
                      {rating === 0 ? "Tous" : `${rating}+`}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
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
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-shrink-0">
                      Filtres
                      {activeFiltersCount > 0 && (
                        <Badge variant="default" className="ml-2 h-5 w-5 p-0 justify-center">
                          {activeFiltersCount}
                        </Badge>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[80vh]">
                    <SheetHeader>
                      <SheetTitle>Filtres</SheetTitle>
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

                {selectedSpecialties.map((specialty) => (
                  <FilterChip
                    key={specialty}
                    label={specialty}
                    isActive
                    onClick={() => toggleSpecialty(specialty)}
                    onRemove={() => toggleSpecialty(specialty)}
                  />
                ))}
                {selectedLocation && (
                  <FilterChip
                    label={selectedLocation}
                    isActive
                    onClick={() => setSelectedLocation(null)}
                    onRemove={() => setSelectedLocation(null)}
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Chargement..." : `${filteredTailors.length} couturiers trouvés`}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
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
                  <Scissors className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Aucun couturier ne correspond à vos critères
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
