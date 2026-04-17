import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";

export default function MagazinePreview() {
  const { data: articles = [] } = useQuery<any[]>({
    queryKey: ["/api/magazine/articles/public"],
    queryFn: async () => {
      const r = await fetch("/api/magazine/articles?published=true&limit=3");
      if (!r.ok) return [];
      return r.json();
    },
  });

  if (!articles.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {articles.slice(0, 3).map((article: any) => (
        <Link key={article.id} href={`/magazine/${article.id}`}>
          <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            {article.imageUrl && (
              <img src={article.imageUrl} alt={article.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <p className="text-xs text-[#601B28] font-medium uppercase mb-2">{article.category || "Mode"}</p>
              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">{article.title}</h3>
              <p className="text-sm text-gray-500 line-clamp-2">{article.excerpt || article.content?.slice(0, 100)}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
