import { BookOpen, Clock, Heart, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const articles = [
  {
    id: "1",
    title: "Les tendances couture printemps-été 2026",
    excerpt: "Découvrez les tissus, couleurs et styles qui marqueront la saison...",
    category: "Tendances",
    image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop",
    readTime: "5 min",
    date: "2 jan. 2026",
  },
  {
    id: "2",
    title: "Comment choisir son couturier : le guide complet",
    excerpt: "Tous nos conseils pour trouver l'artisan qui saura réaliser vos projets...",
    category: "Conseils",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=400&fit=crop",
    readTime: "8 min",
    date: "28 déc. 2025",
  },
  {
    id: "3",
    title: "L'art de la haute couture africaine",
    excerpt: "Rencontre avec des créateurs qui réinventent les traditions...",
    category: "Portrait",
    image: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&h=400&fit=crop",
    readTime: "6 min",
    date: "25 déc. 2025",
  },
  {
    id: "4",
    title: "Entretenir ses vêtements sur-mesure",
    excerpt: "Les gestes essentiels pour préserver la qualité de vos pièces...",
    category: "Conseils",
    image: "https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=600&h=400&fit=crop",
    readTime: "4 min",
    date: "20 déc. 2025",
  },
  {
    id: "5",
    title: "Robes de mariée : les créateurs à suivre",
    excerpt: "Notre sélection des meilleurs couturiers spécialisés en mariage...",
    category: "Mariage",
    image: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&h=400&fit=crop",
    readTime: "7 min",
    date: "15 déc. 2025",
  },
];

const categories = ["Tous", "Tendances", "Conseils", "Portrait", "Mariage"];

export default function Magazine() {
  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#722F37] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              Magazine
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            Inspirations, conseils et actualités du monde de la couture
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {categories.map((category) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                category === "Tous"
                  ? "bg-[#722F37] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              data-testid={`filter-${category.toLowerCase()}`}
            >
              {category}
            </button>
          ))}
        </div>

        {articles.length > 0 && (
          <Card className="border-0 shadow-sm overflow-hidden mb-6">
            <div className="md:flex">
              <div className="md:w-1/2 h-48 md:h-auto">
                <img
                  src={articles[0].image}
                  alt={articles[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="md:w-1/2 p-6 flex flex-col justify-center">
                <Badge variant="secondary" className="w-fit mb-3 bg-[#722F37]/10 text-[#722F37] border-none">
                  {articles[0].category}
                </Badge>
                <h2 className="font-serif text-xl lg:text-2xl text-[#722F37] mb-2">
                  {articles[0].title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {articles[0].excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {articles[0].readTime}
                    </span>
                    <span>{articles[0].date}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-gray-500">
                      <Heart className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-gray-500">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.slice(1).map((article) => (
            <Card key={article.id} className="border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-40 overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <Badge variant="secondary" className="mb-2 bg-gray-100 text-gray-600 border-none text-xs">
                  {article.category}
                </Badge>
                <h3 className="font-semibold text-[#722F37] mb-2 line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readTime}
                  </span>
                  <span>{article.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
