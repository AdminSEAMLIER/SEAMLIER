import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { Search, MapPin, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import type { TailorWithUser } from "@shared/schema";

const cities = [
  "Paris",
  "Lyon",
  "Marseille",
  "Bordeaux",
  "Toulouse",
  "Nice",
  "Nantes",
  "Lille",
];

export default function Recherche() {
  const { t } = useTranslation();
  const searchString = useSearch();
  const urlParams = new URLSearchParams(searchString);
  const villeParam = urlParams.get("ville") || "";
  
  const [searchQuery, setSearchQuery] = useState(villeParam);
  
  useEffect(() => {
    if (villeParam) {
      setSearchQuery(villeParam);
    }
  }, [villeParam]);

  const { data: tailors, isLoading: tailorsLoading } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const filteredTailors = tailors?.filter((tailor) => {
    const fullName = `${tailor.user.firstName || ''} ${tailor.user.lastName || ''}`.trim();
    const matchesSearch = !searchQuery || 
      fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tailor.user.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="w-full px-4 md:px-8 py-3 md:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-[#722F37]">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <Logo className="text-[#722F37] shrink-0" textClassName="text-base lg:text-lg text-[#722F37]" />
          </div>
          <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
            <LanguageToggle />
            <Link href="/connexion">
              <Button variant="ghost" size="sm" className="text-[#722F37] px-1.5 md:px-3 lg:px-4 text-xs md:text-sm lg:text-base h-7 md:h-8 lg:h-9" data-testid="button-connexion-header">
                {t('landing.login')}
              </Button>
            </Link>
            <Link href="/inscription">
              <Button size="sm" className="bg-[#722F37] hover:bg-[#5a252c] text-white px-1.5 md:px-3 lg:px-4 text-xs md:text-sm lg:text-base h-7 md:h-8 lg:h-9" data-testid="button-inscription-header">
                {t('landing.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <h1 className="font-serif text-2xl lg:text-4xl text-[#722F37] mb-2">
            {t('recherche.title')}
          </h1>
          <p className="text-gray-600 mb-6">
            {t('recherche.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('landing.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base border-gray-200 bg-white"
                data-testid="input-search-city"
              />
            </div>
            <Button 
              className="h-12 px-6 bg-[#722F37] hover:bg-[#5a252c] text-white"
              data-testid="button-search"
            >
              <Search className="h-5 w-5 mr-2" />
              {t('landing.searchButton')}
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {cities.map((city) => (
              <Button
                key={city}
                variant={searchQuery.toLowerCase() === city.toLowerCase() ? "default" : "outline"}
                size="sm"
                className={searchQuery.toLowerCase() === city.toLowerCase() 
                  ? "bg-[#722F37] hover:bg-[#5a252c] text-white" 
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"}
                onClick={() => setSearchQuery(city)}
                data-testid={`button-city-${city.toLowerCase()}`}
              >
                {city}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-lg text-gray-900">
            {searchQuery 
              ? t('recherche.resultsFor', { city: searchQuery })
              : t('recherche.allTailors')}
          </h2>
          <p className="text-gray-500 text-sm">
            {filteredTailors?.length || 0} {t('recherche.tailorsFound')}
          </p>
        </div>

        {tailorsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {[...Array(6)].map((_, i) => (
              <TailorCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTailors && filteredTailors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            {filteredTailors.map((tailor) => (
              <TailorCard key={tailor.id} tailor={tailor} linkPrefix="/couturier" />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-gray-500 text-xl mb-2">{t('recherche.noResults')}</p>
            <p className="text-gray-400 mb-8">{t('recherche.tryAnotherCity')}</p>
            
            <div className="max-w-md mx-auto p-6 bg-[#f8f5f5] rounded-lg">
              <h3 className="font-serif text-lg text-[#722F37] mb-2">
                {t('recherche.beFirstPro')}
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                {t('recherche.beFirstProDesc')}
              </p>
              <Link href="/professionnel">
                <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white">
                  {t('recherche.joinAsPro')}
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="mt-12 p-6 bg-[#f8f5f5] rounded-lg text-center">
          <h3 className="font-serif text-xl text-[#722F37] mb-2">
            {t('recherche.wantFullAccess')}
          </h3>
          <p className="text-gray-600 mb-4">
            {t('recherche.createAccountMessage')}
          </p>
          <Link href="/inscription">
            <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white">
              {t('recherche.signupAsClient')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
