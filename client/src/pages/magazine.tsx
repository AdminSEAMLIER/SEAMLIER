import { useTranslation } from "react-i18next";
import { BookOpen, Clock, Heart, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Magazine() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const articles = [
    {
      id: "1",
      titleKey: "magazine.articles.article1Title",
      excerptKey: "magazine.articles.article1Excerpt",
      categoryKey: "magazine.trends",
      category: "trends",
      image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=600&h=400&fit=crop",
      readTime: "5",
      date: "2 jan. 2026",
    },
    {
      id: "2",
      titleKey: "magazine.articles.article2Title",
      excerptKey: "magazine.articles.article2Excerpt",
      categoryKey: "magazine.tips",
      category: "tips",
      image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&h=400&fit=crop",
      readTime: "8",
      date: "28 déc. 2025",
    },
    {
      id: "3",
      titleKey: "magazine.articles.article3Title",
      excerptKey: "magazine.articles.article3Excerpt",
      categoryKey: "magazine.portrait",
      category: "portrait",
      image: "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=600&h=400&fit=crop",
      readTime: "6",
      date: "25 déc. 2025",
    },
    {
      id: "4",
      titleKey: "magazine.articles.article4Title",
      excerptKey: "magazine.articles.article4Excerpt",
      categoryKey: "magazine.tips",
      category: "tips",
      image: "https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=600&h=400&fit=crop",
      readTime: "4",
      date: "20 déc. 2025",
    },
    {
      id: "5",
      titleKey: "magazine.articles.article5Title",
      excerptKey: "magazine.articles.article5Excerpt",
      categoryKey: "magazine.wedding",
      category: "wedding",
      image: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?w=600&h=400&fit=crop",
      readTime: "7",
      date: "15 déc. 2025",
    },
  ];

  const categories = [
    { key: "all", labelKey: "magazine.all" },
    { key: "trends", labelKey: "magazine.trends" },
    { key: "tips", labelKey: "magazine.tips" },
    { key: "portrait", labelKey: "magazine.portrait" },
    { key: "wedding", labelKey: "magazine.wedding" },
  ];

  const filteredArticles = selectedCategory === "all" 
    ? articles 
    : articles.filter(a => a.category === selectedCategory);

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]">
              {t('magazine.title')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2">
            {t('magazine.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide mb-6">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setSelectedCategory(category.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category.key
                  ? "bg-[#722F37] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              data-testid={`filter-${category.key}`}
            >
              {t(category.labelKey)}
            </button>
          ))}
        </div>

        {filteredArticles.length > 0 && (
          <Card className="border border-gray-100 bg-white shadow-sm overflow-hidden mb-6">
            <div className="md:flex">
              <div className="md:w-1/2 h-48 md:h-auto">
                <img
                  src={filteredArticles[0].image}
                  alt={t(filteredArticles[0].titleKey)}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="md:w-1/2 p-6 flex flex-col justify-center bg-white">
                <Badge variant="secondary" className="w-fit mb-3 bg-[#722F37]/10 text-[#722F37] border-none">
                  {t(filteredArticles[0].categoryKey)}
                </Badge>
                <h2 className="font-serif text-xl lg:text-2xl text-[#722F37] mb-2">
                  {t(filteredArticles[0].titleKey)}
                </h2>
                <p className="text-gray-600 mb-4">
                  {t(filteredArticles[0].excerptKey)}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {filteredArticles[0].readTime} {t('magazine.readTime')}
                    </span>
                    <span>{filteredArticles[0].date}</span>
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
          {filteredArticles.slice(1).map((article) => (
            <Card key={article.id} className="border border-gray-100 bg-white shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow">
              <div className="h-40 overflow-hidden">
                <img
                  src={article.image}
                  alt={t(article.titleKey)}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4 bg-white">
                <Badge variant="secondary" className="mb-2 bg-gray-100 text-gray-600 border-none text-xs">
                  {t(article.categoryKey)}
                </Badge>
                <h3 className="font-semibold text-[#722F37] mb-2 line-clamp-2">
                  {t(article.titleKey)}
                </h3>
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {t(article.excerptKey)}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {article.readTime} {t('magazine.readTime')}
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
