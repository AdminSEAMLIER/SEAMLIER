import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  
  const currentLang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  const toggleLanguage = (lang: 'fr' | 'en') => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleLanguage('fr')}
        className={`px-2 ${currentLang === 'fr' ? 'opacity-100' : 'opacity-50'}`}
        data-testid="button-lang-fr"
      >
        <span className="text-lg">🇫🇷</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleLanguage('en')}
        className={`px-2 ${currentLang === 'en' ? 'opacity-100' : 'opacity-50'}`}
        data-testid="button-lang-en"
      >
        <span className="text-lg">🇬🇧</span>
      </Button>
    </div>
  );
}
