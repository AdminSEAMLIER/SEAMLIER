import { Link } from "wouter";
import { Scissors, MapPin, User, Briefcase, Star, Calendar, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const services = [
  { 
    title: "Haute Couture", 
    description: "Créations uniques et sur-mesure",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop"
  },
  { 
    title: "Robes de Mariée", 
    description: "Le jour le plus beau de votre vie",
    image: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=400&h=500&fit=crop"
  },
  { 
    title: "Costumes", 
    description: "Élégance masculine sur-mesure",
    image: "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?w=400&h=500&fit=crop"
  },
  { 
    title: "Retouches", 
    description: "Ajustements et transformations",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=500&fit=crop"
  },
  { 
    title: "Mode Africaine", 
    description: "Traditions et modernité",
    image: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&h=500&fit=crop"
  },
  { 
    title: "Streetwear", 
    description: "Style urbain personnalisé",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop"
  },
];

const features = [
  {
    icon: Star,
    title: "Artisans vérifiés",
    description: "Tous nos couturiers sont sélectionnés pour leur savoir-faire et leur expertise.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
    cta: "Découvrir",
    href: "/particulier"
  },
  {
    icon: Calendar,
    title: "Réservation facile",
    description: "Prenez rendez-vous en quelques clics avec le couturier de votre choix.",
    image: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&h=400&fit=crop",
    cta: "Réserver",
    href: "/particulier/search"
  },
  {
    icon: Sparkles,
    title: "Créations uniques",
    description: "Des pièces sur-mesure qui reflètent votre personnalité.",
    image: "https://images.unsplash.com/photo-1518657175232-6f728c325f0f?w=600&h=400&fit=crop",
    cta: "Explorer",
    href: "/particulier/marketplace"
  },
];

export default function Landing() {
  const [location, setLocation] = useState("");

  return (
    <div className="min-h-screen bg-background">
      <section className="relative min-h-[85vh] flex flex-col">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=900&fit=crop"
            alt="L'art de la couture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />
        </div>
        
        <header className="relative z-20 flex items-center justify-between px-4 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="font-serif text-2xl text-white font-medium">L'art de coudre</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/particulier">
              <Button variant="ghost" className="text-white border-white/20 hover:bg-white/10" data-testid="button-login">
                Connexion
              </Button>
            </Link>
            <Link href="/professionnel">
              <Button className="bg-white text-foreground hover:bg-white/90" data-testid="button-pro">
                Espace Pro
              </Button>
            </Link>
          </div>
        </header>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-12">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-4 max-w-4xl leading-tight">
            Trouvez le couturier idéal près de chez vous
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mb-10">
            La plateforme qui connecte les particuliers aux meilleurs artisans couturiers
          </p>

          <div className="w-full max-w-xl bg-white rounded-full p-2 flex items-center gap-2 shadow-xl">
            <div className="flex items-center gap-2 flex-1 pl-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <Input 
                type="text"
                placeholder="Entrez votre ville ou code postal"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="border-0 shadow-none focus-visible:ring-0 text-base"
                data-testid="input-location"
              />
            </div>
            <Link href="/particulier/search">
              <Button size="lg" className="rounded-full px-8" data-testid="button-search-location">
                Rechercher
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-white/70 text-sm">
            <span className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current" />
              Artisans vérifiés
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Réservation en ligne
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Créations sur-mesure
            </span>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 px-4 lg:px-8 bg-background">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-serif text-3xl lg:text-4xl text-center mb-4">
            Tous les services de couture
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            De la haute couture aux retouches, trouvez l'artisan qui correspond à vos besoins
          </p>

          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {services.map((service) => (
              <Link key={service.title} href="/particulier/search">
                <div className="flex-shrink-0 w-[200px] lg:w-[220px] snap-start group cursor-pointer">
                  <div className="relative aspect-[4/5] rounded-lg overflow-hidden mb-3">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="font-serif text-lg text-white font-medium">{service.title}</h3>
                      <p className="text-white/70 text-sm">{service.description}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 px-4 lg:px-8 bg-card">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="overflow-hidden group hover-elevate">
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3 text-primary">
                    <feature.icon className="h-5 w-5" />
                    <h3 className="font-serif text-xl font-medium">{feature.title}</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <Link href={feature.href}>
                    <Button variant="outline" className="w-full" data-testid={`button-${feature.title.toLowerCase().replace(/\s/g, '-')}`}>
                      {feature.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 px-4 lg:px-8 bg-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl lg:text-4xl mb-4">
            Vous êtes couturier ?
          </h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Rejoignez notre communauté d'artisans et développez votre activité
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/professionnel">
              <Button size="lg" className="gap-2" data-testid="button-join-pro">
                <Briefcase className="h-5 w-5" />
                Accéder à l'espace Pro
              </Button>
            </Link>
            <Link href="/particulier">
              <Button size="lg" variant="outline" className="gap-2" data-testid="button-client-space">
                <User className="h-5 w-5" />
                Espace Particulier
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-card border-t py-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                <Scissors className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-medium">L'art de coudre</span>
            </div>
            <p className="text-muted-foreground text-sm">
              La plateforme de mise en relation couturiers-particuliers
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
