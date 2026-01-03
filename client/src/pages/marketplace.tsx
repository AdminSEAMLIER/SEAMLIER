import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterChip } from "@/components/filter-chip";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag } from "lucide-react";
import type { ProductWithTailor } from "@shared/schema";

const categories = [
  "Tous",
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
  const [selectedCategory, setSelectedCategory] = useState("Tous");

  const { data: products, isLoading } = useQuery<ProductWithTailor[]>({
    queryKey: ["/api/products"],
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    return products.filter((product) => {
      const matchesSearch = !searchQuery || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "Tous" || 
        product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-2">
            Boutique
          </h1>
          <p className="text-gray-600 mb-6">
            Découvrez les créations uniques de nos couturiers
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-white border-gray-200"
              data-testid="input-search-marketplace"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {categories.map((category) => (
            <FilterChip
              key={category}
              label={category}
              isActive={selectedCategory === category}
              onClick={() => setSelectedCategory(category)}
            />
          ))}
        </div>
      </div>

      <section className="px-4 lg:px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl text-[#722F37]">
            Produits disponibles
          </h2>
          <p className="text-gray-500 text-sm">
            {filteredProducts.length} résultats
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
              <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun produit disponible</p>
              <p className="text-gray-400 text-sm mt-1">Essayez de modifier vos filtres</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
