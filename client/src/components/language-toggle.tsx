import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  const toggleLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-0.5 text-sm font-medium">
      <button
        onClick={() => toggleLanguage('fr')}
        className={`px-2 py-1 rounded transition-colors ${currentLang === 'fr' ? 'text-[#601B28] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
        data-testid="button-lang-fr"
      >
        FR
      </button>
      <span className="text-gray-300 select-none">|</span>
      <button
        onClick={() => toggleLanguage('en')}
        className={`px-2 py-1 rounded transition-colors ${currentLang === 'en' ? 'text-[#601B28] font-bold' : 'text-gray-400 hover:text-gray-600'}`}
        data-testid="button-lang-en"
      >
        EN
      </button>
    </div>
  );
}
