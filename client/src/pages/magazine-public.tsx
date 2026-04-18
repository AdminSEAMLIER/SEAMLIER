import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { BookOpen, Clock, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import type { MagazineArticle } from "@shared/schema";

export default function MagazinePublic() {
  const { data: articles = [], isLoading } = useQuery<MagazineArticle[]>({
    queryKey: ["/api/articles"],
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header épuré */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="text-[#601B28]" textClassName="text-lg text-[#601B28]" />
          </Link>
          <Link href="/connexion">
            <button className="text-sm text-[#601B28] hover:underline">Se connecter</button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#faf9f7] border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#601B28] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-[#601B28]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#601B28]" style={{fontFamily:"Playfair Display, serif"}}>
              Le Magazine
            </h1>
          </div>
          <p className="text-gray-500 mt-2">Tendances, conseils et portraits d'artisans</p>
        </div>
      </div>

      {/* Articles */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-50 rounded-xl h-64 animate-pulse" />
            ))}
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map(article => (
              <Link key={article.id} href={`/magazine/${article.id}`} className="block">
                <article className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                  {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover" />
                  ) : (
                    <div className="w-full h-48 bg-[#faf9f7] flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-[#601B28]/20" />
                    </div>
                  )}
                  <div className="p-5">
                    {article.category && (
                      <Badge variant="outline" className="text-[10px] text-[#601B28] border-[#601B28]/30 mb-3">
                        {article.category}
                      </Badge>
                    )}
                    <h2 className="font-serif text-lg text-gray-900 mb-2 line-clamp-2" style={{fontFamily:"Playfair Display, serif"}}>
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="text-gray-500 text-sm line-clamp-3 mb-4">{article.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      {article.createdAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(article.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {article.views || 0}
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-16">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
              <BookOpen className="h-8 w-8 text-gray-400" />
            </div>
            <h2 className="font-serif text-xl text-gray-700 mb-3" style={{fontFamily:"Playfair Display, serif"}}>
              Bientôt disponible
            </h2>
            <p className="text-gray-500 max-w-md">
              De nouveaux articles sur les tendances, conseils et portraits d'artisans seront publiés prochainement.
            </p>
          </div>
        )}
      </div>

      {/* Footer minimal */}
      <footer className="border-t border-gray-100 py-6 px-4 text-center text-sm text-gray-400">
        © 2026 SEAMLIER — <Link href="/" className="hover:text-[#601B28]">Retour au site</Link>
      </footer>
    </div>
  );
}
