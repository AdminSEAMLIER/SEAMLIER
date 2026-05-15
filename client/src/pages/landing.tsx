import { Link, useLocation as useWouterLocation } from "wouter";
import MagazinePreview from "@/components/MagazinePreview";
import { useTranslation } from "react-i18next";
import { MapPin, Search, MessageCircle, CheckCircle, Star, ArrowRight, Scissors, Users, Shield, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import parisImg from "@/assets/images/paris.jpg";
import lyonImg from "@/assets/images/lyon.jpg";
import marseilleImg from "@/assets/images/marseille.jpg";
import bordeauxImg from "@/assets/images/bordeaux.jpg";
import toulouseImg from "@/assets/images/toulouse.jpg";
import niceImg from "@/assets/images/nice.jpg";

const cities = [
  { name: "Paris", image: parisImg },
  { name: "Lyon", image: lyonImg },
  { name: "Marseille", image: marseilleImg },
  { name: "Bordeaux", image: bordeauxImg },
  { name: "Toulouse", image: toulouseImg },
  { name: "Nice", image: niceImg },
];

export default function Landing({ embedded }: { embedded?: boolean } = {}) {
  const { t } = useTranslation();
  const [, setPageLocation] = useWouterLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useState("");

  const handleSearch = () => {
    if (!location.trim()) {
      toast({
        title: t('landing.searchError'),
        description: t('landing.enterCity'),
        variant: "destructive",
      });
      return;
    }
    setPageLocation(`/recherche?ville=${encodeURIComponent(location.trim())}`);
  };

  const steps = [
    {
      number: "1",
      title: t('landing.step1Title'),
      description: t('landing.step1Desc'),
      icon: MessageCircle,
    },
    {
      number: "2",
      title: t('landing.step2Title'),
      description: t('landing.step2Desc'),
      icon: Users,
    },
    {
      number: "3",
      title: t('landing.step3Title'),
      description: t('landing.step3Desc'),
      icon: CheckCircle,
    },
  ];

  const features = [
    t('features.verifiedTailors'),
    t('features.onTimeDelivery'),
    t('features.secureMessaging'),
  ];

  return (
    <div className={embedded ? "bg-white" : "min-h-screen bg-white"}>
      {!embedded && (
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="w-full px-2 md:px-8 py-2 md:py-4 flex items-center justify-between gap-1 md:gap-2">
          <Logo className="text-[#601B28] shrink-0" textClassName="text-base lg:text-lg text-[#601B28]" />
          <div className="flex items-center gap-1 md:gap-2 lg:gap-4">
            <LanguageToggle />
            <Link href="/magazine" className="hidden lg:inline-flex"><Button variant="ghost" size="sm" className="text-[#601B28] px-3 lg:px-4 text-sm lg:text-base h-8 lg:h-9">Magazine</Button></Link>
            {isAuthenticated && user ? (
              <Link href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'tailor' ? '/dashboard-pro' : '/dashboard-client'}>
                <Button size="sm" className="bg-[#601B28] hover:bg-[#4E1522] text-white px-2 md:px-4 text-xs md:text-sm h-8 md:h-9 gap-1.5" data-testid="button-mon-espace">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('landing.mySpace')}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/connexion">
                  <Button variant="ghost" size="sm" className="text-[#601B28] px-1.5 md:px-3 lg:px-4 text-xs md:text-sm lg:text-base h-7 md:h-8 lg:h-9" data-testid="button-connexion-header">
                    {t('landing.login')}
                  </Button>
                </Link>
                <Link href="/inscription">
                  <Button size="sm" className="bg-[#601B28] hover:bg-[#4E1522] text-white px-1.5 md:px-3 lg:px-4 text-xs md:text-sm lg:text-base h-7 md:h-8 lg:h-9" data-testid="button-inscription-header">
                    {t('landing.signup')}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      )}

      <section className="relative py-20 lg:py-32 px-4 md:px-8 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1537274942065-eda9d00a6293?w=1920&h=800&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative w-full max-w-4xl mx-auto text-center px-2">
          <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-white/90 text-base lg:text-xl mb-10 max-w-2xl mx-auto px-2">
            {t('landing.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl mx-auto">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('landing.searchPlaceholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-14 text-base border-0 bg-white shadow-lg w-full"
                data-testid="input-location"
              />
            </div>
            <Button
              size="lg"
              className="h-14 px-6 bg-[#601B28] hover:bg-[#4E1522] text-white shadow-lg w-full sm:w-auto"
              data-testid="button-search-hero"
              onClick={handleSearch}
            >
              <Search className="h-5 w-5 mr-2" />
              {t('landing.searchButton')}
            </Button>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-12 px-4 md:px-8 border-y border-gray-100 bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-2 md:gap-8 text-center">
            {features.map((feature) => (
              <div key={feature}>
                <p className="text-gray-800 text-xs sm:text-sm md:text-base lg:text-lg font-medium leading-tight break-words">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-2 md:px-8 bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-[#601B28] mb-4">
              {t('landing.howItWorks')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('landing.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#601B28] text-white flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold">{step.number}</span>
                </div>
                <h3 className="font-semibold text-xl text-[#601B28] mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="featured-tailors" className="py-16 lg:py-24 px-2 md:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-[#601B28] mb-4">
              {t('landing.popularCities')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cities.map((city) => (
              <Link key={city.name} href={`/recherche?ville=${encodeURIComponent(city.name)}`}>
                <Card className="overflow-hidden cursor-pointer group border-0 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative h-32">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-white font-semibold text-lg">{city.name}</h3>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-2 md:px-8 bg-white">
        <div className="w-full max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-[#601B28] mb-4">
              {t('landing.whyChooseUs')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-[#601B28] flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-[#601B28]" />
                </div>
                <h3 className="font-semibold text-lg text-[#601B28] mb-2">{t('landing.verifiedPros')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('landing.verifiedProsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-[#601B28] flex items-center justify-center mx-auto mb-4">
                  <Star className="h-7 w-7 text-[#601B28]" />
                </div>
                <h3 className="font-semibold text-lg text-[#601B28] mb-2">{t('landing.authenticReviews')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('landing.authenticReviewsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-[#601B28] flex items-center justify-center mx-auto mb-4">
                  <Scissors className="h-7 w-7 text-[#601B28]" />
                </div>
                <h3 className="font-semibold text-lg text-[#601B28] mb-2">{t('landing.freeService')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('landing.freeServiceDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {!embedded && (
      <section className="py-16 lg:py-24 px-2 md:px-8 bg-[#5a1f25]">
        <div className="w-full max-w-7xl mx-auto text-center">
          <h2 className="font-serif text-3xl lg:text-4xl text-white mb-4">
            {t('landing.areTailor')}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            {t('landing.joinNetwork')}
          </p>
          <Link href="/professionnel">
            <Button size="sm" variant="outline" className="bg-white/90 text-[#601B28] border-white/50 hover:bg-white text-sm" data-testid="button-join-pro">
              {t('landing.joinAsPro')}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </section>
      )}
      <section className="py-16 lg:py-24 px-4 md:px-8 bg-[#faf9f7]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-serif text-2xl md:text-3xl text-[#601B28]">Le Magazine</h2>
            <Link href="/magazine"><Button variant="ghost" className="text-[#601B28] hover:text-[#4E1522]">Voir tous les articles →</Button></Link>
          </div>
          <MagazinePreview />
        </div>
      </section>

      {!embedded && (
      <footer className="bg-white border-t border-gray-100 py-8 px-2 md:px-8">
        <div className="w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 SEAMLIER. {t('footer.allRightsReserved')}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/mentions-legales" className="hover:text-[#601B28] transition-colors" data-testid="link-mentions">{t('footer.legalNotice')}</Link>
              <Link href="/cgv" className="hover:text-[#601B28] transition-colors" data-testid="link-cgv">{t('footer.terms')}</Link>
              <Link href="/cgu" className="hover:text-[#601B28] transition-colors" data-testid="link-cgu">CGU</Link>
              <Link href="/confidentialite" className="hover:text-[#601B28] transition-colors" data-testid="link-privacy">{t('footer.privacy')}</Link>
              <Link href="/politique-remboursement" className="hover:text-[#601B28] transition-colors" data-testid="link-refund">Remboursement</Link>
            </div>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
}
