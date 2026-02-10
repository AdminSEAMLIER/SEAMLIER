import { useTranslation } from "react-i18next";
import { BookOpen } from "lucide-react";

export default function Magazine() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen pb-20 lg:pb-8 bg-white">
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-[#722F37] flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-[#722F37]" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#722F37]" data-testid="text-magazine-title">
              {t('magazine.title')}
            </h1>
          </div>
          <p className="text-gray-600 mt-2" data-testid="text-magazine-subtitle">
            {t('magazine.subtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-16 lg:py-24">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
            <BookOpen className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="font-serif text-xl lg:text-2xl text-gray-700 mb-3" data-testid="text-magazine-empty-title">
            {t('magazine.emptyTitle', 'Bientôt disponible')}
          </h2>
          <p className="text-gray-500 max-w-md" data-testid="text-magazine-empty-description">
            {t('magazine.emptyDescription', 'De nouveaux articles sur les tendances, conseils et portraits d\'artisans seront publiés prochainement.')}
          </p>
        </div>
      </div>
    </div>
  );
}
