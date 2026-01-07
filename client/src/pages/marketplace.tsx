import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { FilterChip } from "@/components/filter-chip";
import { Input } from "@/components/ui/input";
import { Search, ShoppingBag } from "lucide-react";
import type { ProductWithTailor } from "@shared/schema";

const categoryMappings = [
  { key: "all", dbValue: "all" },
  { key: "dresses", dbValue: "Robes" },
  { key: "suits", dbValue: "Costumes" },
  { key: "accessories", dbValue: "Accessoires" },
  { key: "children", dbValue: "Mode Enfant" },
  { key: "african", dbValue: "Vêtements Africains" },
  { key: "wedding", dbValue: "Mariage" },
  { key: "readyToWear", dbValue: "Prêt-à-porter" },
  { key: "hauteCouture", dbValue: "Haute Couture" },
  { key: "alterations", dbValue: "Retouches" },
];

export default function Marketplace() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: products, isLoading } = useQuery<ProductWithTailor[]>({
    queryKey: ["/api/products"],
  });

  const getDbValueForCategory = (categoryKey: string) => {
    const found = categoryMappings.find(c => c.key === categoryKey);
    return found?.dbValue || categoryKey;
  };

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    const dbValue = getDbValueForCategory(selectedCategory);
    
    return products.filter((product) => {
      const matchesSearch = !searchQuery || 
        product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "all" || product.category === dbValue;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const displayCategories = ["all", "dresses", "suits", "accessories", "children", "african", "wedding", "readyToWear"];

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-background">
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-2">
            {t('marketplace.title')}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t('marketplace.subtitle')}
          </p>
          
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder={t('marketplace.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 bg-card border-border"
              data-testid="input-search-marketplace"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {displayCategories.map((key) => (
            <FilterChip
              key={key}
              label={t(`marketplace.categories.${key}`)}
              isActive={selectedCategory === key}
              onClick={() => setSelectedCategory(key)}
            />
          ))}
        </div>
      </div>

      <section className="px-4 lg:px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h2 className="font-serif text-2xl text-[#722F37]">
            {t('marketplace.availableProducts')}
          </h2>
          <p className="text-muted-foreground text-sm">
            {filteredProducts.length} {t('marketplace.results')}
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
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">{t('marketplace.noProducts')}</p>
              <p className="text-muted-foreground/70 text-sm mt-1">{t('marketplace.adjustFilters')}</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
