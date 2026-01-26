import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { MapPin, Search, MessageCircle, CheckCircle, Star, ArrowRight, Scissors, Users, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { LanguageToggle } from "@/components/language-toggle";

const cities = [
  { name: "Paris", image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=300&fit=crop" },
  { name: "Lyon", image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=300&fit=crop" },
  { name: "Marseille", image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&h=300&fit=crop" },
  { name: "Bordeaux", image: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&h=300&fit=crop" },
  { name: "Toulouse", image: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?w=400&h=300&fit=crop" },
  { name: "Nice", image: "https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=400&h=300&fit=crop" },
];

export default function Landing() {
  const { t } = useTranslation();
  const [location, setLocation] = useState("");

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

  const stats = [
    { value: "100%", label: t('landing.verifiedTailors') },
    { value: "100%", label: t('landing.onTimeDelivery') },
    { value: "4.8/5", label: t('landing.averageRating') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <Logo className="text-[#722F37]" textClassName="text-lg text-[#722F37]" />
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link href="/connexion">
              <Button variant="ghost" className="text-[#722F37]" data-testid="button-connexion-header">
                {t('landing.login')}
              </Button>
            </Link>
            <Link href="/inscription-particulier">
              <Button className="bg-[#722F37] hover:bg-[#5a252c] text-white" data-testid="button-inscription-header">
                {t('landing.signup')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative py-20 lg:py-28 px-4 lg:px-8 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1537274942065-eda9d00a6293?w=1920&h=800&fit=crop')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-white mb-6 leading-tight">
            {t('landing.heroTitle')}
          </h1>
          <p className="text-white/90 text-lg lg:text-xl mb-10 max-w-2xl mx-auto">
            {t('landing.heroSubtitle')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder={t('landing.searchPlaceholder')}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-12 h-14 text-base border-0 bg-white shadow-lg"
                data-testid="input-location"
              />
            </div>
            <Link href="/particulier">
              <Button size="lg" className="h-14 px-8 bg-[#722F37] hover:bg-[#5a252c] text-white shadow-lg" data-testid="button-search-hero">
                <Search className="h-5 w-5 mr-2" />
                {t('landing.searchButton')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 px-4 lg:px-8 border-y border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl lg:text-4xl font-bold text-[#722F37]">{stat.value}</p>
                <p className="text-gray-600 text-sm lg:text-base mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-4">
              {t('landing.howItWorks')}
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              {t('landing.howItWorksSubtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-[#722F37] text-white flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold">{step.number}</span>
                </div>
                <h3 className="font-semibold text-xl text-[#722F37] mb-3">
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

      <section className="py-16 lg:py-24 px-4 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-4">
              {t('landing.popularCities')}
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cities.map((city) => (
              <Link key={city.name} href={`/particulier/decouverte?ville=${encodeURIComponent(city.name)}`}>
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

      <section className="py-16 lg:py-24 px-4 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl lg:text-4xl text-[#722F37] mb-4">
              {t('landing.whyChooseUs')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-[#722F37] flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-7 w-7 text-[#722F37]" />
                </div>
                <h3 className="font-semibold text-lg text-[#722F37] mb-2">{t('landing.verifiedPros')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('landing.verifiedProsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-[#722F37] flex items-center justify-center mx-auto mb-4">
                  <Star className="h-7 w-7 text-[#722F37]" />
                </div>
                <h3 className="font-semibold text-lg text-[#722F37] mb-2">{t('landing.authenticReviews')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('landing.authenticReviewsDesc')}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-gray-100 bg-white shadow-sm p-6">
              <CardContent className="p-0 text-center">
                <div className="w-14 h-14 rounded-full bg-white border border-[#722F37] flex items-center justify-center mx-auto mb-4">
                  <Scissors className="h-7 w-7 text-[#722F37]" />
                </div>
                <h3 className="font-semibold text-lg text-[#722F37] mb-2">{t('landing.freeService')}</h3>
                <p className="text-gray-600 text-sm">
                  {t('landing.freeServiceDesc')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24 px-4 lg:px-8 bg-[#5a1f25]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-3xl lg:text-4xl text-white mb-4">
            {t('landing.areTailor')}
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
            {t('landing.joinNetwork')}
          </p>
          <Link href="/professionnel">
            <Button size="lg" variant="outline" className="bg-white text-[#722F37] border-white hover:bg-gray-100" data-testid="button-join-pro">
              {t('landing.joinAsPro')}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-100 py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">
              © 2026 SEAMLI. {t('footer.allRightsReserved')}
            </p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/mentions-legales" className="hover:text-[#722F37] transition-colors" data-testid="link-mentions">{t('footer.legalNotice')}</Link>
              <a href="#" className="hover:text-[#722F37] transition-colors" data-testid="link-cgv">{t('footer.terms')}</a>
              <Link href="/confidentialite" className="hover:text-[#722F37] transition-colors" data-testid="link-privacy">{t('footer.privacy')}</Link>
              <a href="#" className="hover:text-[#722F37] transition-colors" data-testid="link-contact">{t('footer.contact')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
