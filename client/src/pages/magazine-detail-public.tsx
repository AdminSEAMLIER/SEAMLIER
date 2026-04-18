import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Eye, Loader2 } from "lucide-react";
import { Logo } from "@/components/logo";
import type { MagazineArticle } from "@shared/schema";

export default function MagazineDetailPublic() {
  const [, params] = useRoute("/magazine/:id");
  const articleId = params?.id;

  const { data: article, isLoading } = useQuery<MagazineArticle>({
    queryKey: ["/api/articles", articleId],
    enabled: !!articleId,
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header épuré */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Logo className="text-[#601B28]" textClassName="text-lg text-[#601B28]" />
          </Link>
          <Link href="/connexion">
            <button className="text-sm text-[#601B28] hover:underline">Se connecter</button>
          </Link>
        </div>
      </header>

      {isLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#601B28]" />
        </div>
      ) : !article ? (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <p className="text-gray-500">Article introuvable.</p>
          <Link href="/magazine" className="text-[#601B28] hover:underline mt-4 block">← Retour au magazine</Link>
        </div>
      ) : (
        <article className="max-w-4xl mx-auto px-4 py-10">
          <Link href="/magazine" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#601B28] mb-8">
            <ArrowLeft className="h-4 w-4" />
            Retour au magazine
          </Link>

          {article.category && (
            <Badge variant="outline" className="text-[#601B28] border-[#601B28]/30 mb-4">
              {article.category}
            </Badge>
          )}

          <h1 className="text-3xl lg:text-4xl text-gray-900 mb-4 leading-tight" style={{fontFamily:"Playfair Display, serif"}}>
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-400 mb-8">
            {article.createdAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {new Date(article.createdAt).toLocaleDateString("fr-FR", {day:"numeric", month:"long", year:"numeric"})}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {article.views || 0} vues
            </span>
          </div>

          {article.imageUrl && (
            <img src={article.imageUrl} alt={article.title} className="w-full h-64 lg:h-96 object-cover rounded-xl mb-8" />
          )}

          {article.excerpt && (
            <p className="text-lg text-gray-600 mb-8 italic border-l-4 border-[#601B28]/20 pl-4">
              {article.excerpt}
            </p>
          )}

          <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {article.content}
          </div>
        </article>
      )}

      {/* Footer minimal */}
      <footer className="border-t border-gray-100 py-6 px-4 text-center text-sm text-gray-400 mt-16">
        © 2026 SEAMLIER — <Link href="/" className="hover:text-[#601B28]">Retour au site</Link>
      </footer>
    </div>
  );
}
