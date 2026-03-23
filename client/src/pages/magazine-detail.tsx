import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Calendar, Eye, Loader2 } from "lucide-react";
import type { MagazineArticle } from "@shared/schema";

export default function MagazineDetail() {
  const [, params] = useRoute("/magazine/:id");
  const articleId = params?.id;

  const { data: article, isLoading } = useQuery<MagazineArticle>({
    queryKey: ["/api/articles", articleId],
    enabled: !!articleId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#601B28]" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
        <p className="mb-4 text-gray-500">Article introuvable</p>
        <Link href="/magazine">
          <Button className="bg-[#601B28]" data-testid="button-back-magazine">Retour au magazine</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <article className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/magazine">
          <Button variant="ghost" className="mb-8 text-gray-500 hover:text-[#601B28] pl-0" data-testid="button-back">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au magazine
          </Button>
        </Link>

        <header className="mb-10">
          {article.category && (
            <Badge variant="outline" className="text-[10px] text-[#601B28] border-[#601B28]/30 mb-4">
              {article.category}
            </Badge>
          )}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold mt-2 mb-6 text-gray-900 leading-tight" data-testid="text-article-title">
            {article.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            {article.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {new Date(article.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
            )}
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              {article.views || 0} vues
            </div>
          </div>
        </header>

        {article.imageUrl && (
          <div className="rounded-2xl overflow-hidden shadow-lg mb-12">
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-auto max-h-[500px] object-cover"
              data-testid="img-article"
            />
          </div>
        )}

        {article.excerpt && (
          <p className="text-xl font-medium text-gray-700 mb-8 italic border-l-4 border-[#601B28] pl-6" data-testid="text-article-excerpt">
            {article.excerpt}
          </p>
        )}

        {article.content && (
          <div
            className="prose prose-lg max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap"
            data-testid="text-article-content"
            dangerouslySetInnerHTML={{ __html: article.content.replace(/</g, '&lt;').replace(/&lt;(\/?(b|i|u|strong|em))>/g, '<$1>') }}
          />
        )}
      </article>
    </div>
  );
}
