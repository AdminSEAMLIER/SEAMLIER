import { useRoute, Link } from "wouter";
import { articles } from "@/data/magazine";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Calendar } from "lucide-react";

export default function MagazineDetail() {
  const [, params] = useRoute("/particulier/magazine/:id");
  const article = articles.find(a => a.id === Number(params?.id));

  if (!article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="mb-4 text-gray-500">Article introuvable</p>
        <Link href="/particulier/magazine">
          <Button className="bg-[#722F37]">Retour au magazine</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <article className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/particulier/magazine">
          <Button variant="ghost" className="mb-8 text-gray-500 hover:text-[#722F37] pl-0">
            <ArrowLeft className="mr-2 h-4 w-4" /> Retour au magazine
          </Button>
        </Link>

        <header className="mb-10">
          <span className="text-[#722F37] font-bold uppercase tracking-widest text-xs">
            {article.category}
          </span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mt-4 mb-6 text-gray-900 leading-tight">
            {article.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-400 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {article.date}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> 5 min de lecture
            </div>
          </div>
        </header>

        <div className="rounded-3xl overflow-hidden shadow-xl mb-12">
          <img 
            src={article.image} 
            alt={article.title} 
            className="w-full h-auto max-h-[500px] object-cover" 
          />
        </div>

        <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
          <p className="text-xl font-medium text-gray-900 mb-8 italic border-l-4 border-[#722F37] pl-6">
            {article.excerpt}
          </p>
          <p>
            Contenu de l'article à venir... (Vous pouvez modifier ce texte dans le fichier magazine-detail.tsx).
          </p>
        </div>
      </article>
    </div>
  );
}