import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, ArrowRight, Star, Scissors, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { TailorCard, TailorCardSkeleton } from "@/components/tailor-card";
import { useState } from "react";
import type { TailorWithUser } from "@shared/schema";

const steps = [
  {
    number: "1",
    title: "Décrivez votre projet",
    description: "Dites-nous ce dont vous avez besoin et nous contacterons les couturiers de votre région.",
  },
  {
    number: "2",
    title: "Recevez des devis",
    description: "Comparez les profils, lisez les avis et choisissez le couturier qui vous convient.",
  },
  {
    number: "3",
    title: "Réalisez votre projet",
    description: "Contactez directement les professionnels et réalisez votre projet en toute confiance.",
  },
];

const cities = [
  { name: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop" },
  { name: "Lyon", image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop" },
  { name: "Marseille", image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop" },
  { name: "Bordeaux", image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&h=300&fit=crop" },
  { name: "Toulouse", image: "https://images.unsplash.com/photo-1582974214784-4e2a5ad6c9c4?w=400&h=300&fit=crop" },
  { name: "Nice", image: "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=400&h=300&fit=crop" },
];

export default function Home() {
  const [location, setLocation] = useState("");

  const { data: tailors, isLoading } = useQuery<TailorWithUser[]>({
    queryKey: ["/api/tailors"],
  });

  const featuredTailors = tailors?.slice(0, 3);

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="lg:hidden flex items-center justify-center py-4 bg-white border-b border-gray-100">
        <Link href="/">
          <div className="flex items-center gap-1 text-[#722F37]">
            <Scissors className="h-5 w-5" />
            <span style={{ fontFamily: "'Parisienne', cursive" }} className="text-xl">
              L'Art de Coudre
            </span>
          </div>
        </Link>
      </div>
      
      <section className="relative py-16 lg:py-24 px-4 lg:px-8 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1537274942065-eda9d00a6293?w=1920&h=800&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-white mb-4 leading-tight">
            Trouvez un couturier près de chez vous
          </h1>
          <p className="text-white/90 text-base lg:text-lg mb-8 max-w-2xl mx-auto">
            Comparez les meilleurs couturiers et obtenez des devis gratuits
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Entrez votre ville..."
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-12 text-base border-0 bg-white shadow-lg"
                data-testid="input-location-home"
              />
            </div>
            <Link href="/particulier/decouverte">
              <Button size="lg" className="h-12 px-6 bg-[#722F37] hover:bg-[#5a252c] text-white w-full sm:w-auto shadow-lg" data-testid="button-search-home">
                <Search className="h-5 w-5 mr-2" />
                Rechercher
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 px-4 lg:px-8 border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl lg:text-3xl font-bold text-[#722F37]">100%</p>
              <p className="text-gray-600 text-xs lg:text-sm mt-1">des couturiers vérifiés</p>
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-bold text-[#722F37]">100%</p>
              <p className="text-gray-600 text-xs lg:text-sm mt-1">des délais respectés</p>
            </div>
            <div>
              <p className="text-2xl lg:text-3xl font-bold text-[#722F37]">4.8/5</p>
              <p className="text-gray-600 text-xs lg:text-sm mt-1">Note moyenne</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 px-4 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl lg:text-3xl text-[#722F37] mb-8 text-center">
            Comment ça marche ?
          </h2>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-12 h-12 rounded-full bg-[#722F37] text-white flex items-center justify-center mx-auto mb-4">
                  <span className="text-lg font-bold">{step.number}</span>
                </div>
                <h3 className="font-semibold text-lg text-[#722F37] mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featuredTailors && featuredTailors.length > 0 && (
        <section className="py-12 lg:py-16 px-4 lg:px-8 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-2xl lg:text-3xl text-[#722F37]">
                Couturiers en vedette
              </h2>
              <Link href="/particulier/decouverte">
                <Button variant="ghost" className="text-[#722F37]" data-testid="button-view-all-tailors">
                  Voir tous
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TailorCardSkeleton key={i} />
                ))
              ) : (
                featuredTailors.map((tailor) => (
                  <TailorCard key={tailor.id} tailor={tailor} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <section className="py-12 lg:py-16 px-4 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl lg:text-3xl text-[#722F37] mb-6 text-center">
            Villes populaires
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {cities.map((city) => (
              <Link key={city.name} href="/particulier/decouverte">
                <Card className="overflow-hidden cursor-pointer group border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-24">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-white font-semibold">{city.name}</h3>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16 px-4 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl lg:text-3xl text-[#722F37] mb-8 text-center">
            Pourquoi nous choisir ?
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-[#722F37] flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-[#722F37]" />
                </div>
                <h3 className="font-semibold text-[#722F37] mb-2">Couturiers vérifiés</h3>
                <p className="text-gray-600 text-sm">
                  Tous nos professionnels sont sélectionnés et vérifiés.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-[#722F37] flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-[#722F37]" />
                </div>
                <h3 className="font-semibold text-[#722F37] mb-2">Avis authentiques</h3>
                <p className="text-gray-600 text-sm">
                  Consultez les avis de clients vérifiés.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-12 h-12 rounded-full bg-white border border-[#722F37] flex items-center justify-center mx-auto mb-4">
                  <Scissors className="h-6 w-6 text-[#722F37]" />
                </div>
                <h3 className="font-semibold text-[#722F37] mb-2">Un match 100% gagnant</h3>
                <p className="text-gray-600 text-sm">
                  Le couturier expose son savoir-faire, le particulier trouve le professionnel parfait pour sa confection.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 px-4 lg:px-8 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-1 text-[#722F37] mb-4">
                <Scissors className="h-5 w-5" />
                <span style={{ fontFamily: "'Parisienne', cursive" }} className="text-xl">
                  L'Art de Coudre
                </span>
              </div>
              <p className="text-gray-600 text-sm">
                La plateforme qui connecte particuliers et couturiers professionnels.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#722F37] mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/particulier" className="hover:text-[#722F37]">Accueil</a></li>
                <li><a href="/particulier/decouverte" className="hover:text-[#722F37]">Découverte</a></li>
                <li><a href="/particulier/magazine" className="hover:text-[#722F37]">Magazine</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#722F37] mb-4">Légal</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#722F37]">Mentions légales</a></li>
                <li><a href="#" className="hover:text-[#722F37]">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-[#722F37]">CGU</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-[#722F37] mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>contact@lartdecoudre.fr</li>
                <li>+33 1 23 45 67 89</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-6 text-center text-sm text-gray-500">
            <p>&copy; 2026 L'Art de Coudre. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
