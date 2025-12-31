import { Link } from "wouter";
import { Scissors, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <section className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&h=900&fit=crop"
            alt="L'art de la couture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        </div>
        
        <div className="relative z-10 flex flex-col items-center text-center px-4 py-12 max-w-4xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center mb-8">
            <Scissors className="h-10 w-10 text-white" />
          </div>
          
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-4">
            L'art de coudre
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-xl mb-12">
            La plateforme qui connecte les particuliers aux meilleurs couturiers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <Link href="/particulier">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover-elevate cursor-pointer group transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                    <User className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="font-serif text-2xl text-white mb-2">
                    Espace Particulier
                  </h2>
                  <p className="text-white/70 text-sm mb-4">
                    Trouvez un couturier, explorez les créations et commandez vos tenues sur mesure
                  </p>
                  <Button variant="secondary" className="mt-auto" data-testid="button-particulier">
                    Accéder
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/professionnel">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover-elevate cursor-pointer group transition-all duration-300">
                <CardContent className="p-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="font-serif text-2xl text-white mb-2">
                    Espace Professionnel
                  </h2>
                  <p className="text-white/70 text-sm mb-4">
                    Gérez votre activité, vos clients, votre portfolio et développez votre visibilité
                  </p>
                  <Button variant="secondary" className="mt-auto" data-testid="button-professionnel">
                    Accéder
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
