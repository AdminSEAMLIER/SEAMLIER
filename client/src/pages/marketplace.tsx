import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchBar } from "@/components/search-bar";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterChip } from "@/components/filter-chip";
import { ShoppingBag } from "lucide-react";
import type { ProductWithTailor } from "@shared/schema";

const categories = [
  "Robes",
  "Costumes",
  "Accessoires",
  "Vêtements Enfants",
  "Tenues Africaines",
  "Mariage",
  "Prêt-à-porter",
];

export default function Marketplace() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const { data: products, isLoading } = useQuery<ProductWithTailor[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product) => {
      const matchesSearch = !searchQuery || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategories.length === 0 || 
        (product.category && selectedCategories.includes(product.category));
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategories]);

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="min-h-screen pb-20 lg:pb-8">
      <div className="sticky top-0 lg:top-16 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="px-4 lg:px-6 py-4 max-w-7xl mx-auto">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Rechercher un produit..."
          />
        </div>
      </div>

      <div className="px-4 lg:px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-serif text-section-mobile lg:text-section-desktop">
            Boutique
          </h1>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {categories.map((category) => (
            <FilterChip
              key={category}
              label={category}
              isActive={selectedCategories.includes(category)}
              onClick={() => toggleCategory(category)}
              onRemove={() => toggleCategory(category)}
            />
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          ) : filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun produit disponible</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
