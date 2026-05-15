import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ASSETS } from '../../utils/assets';
import { Button } from '../uia';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('fr') ? 'fr' : 'en';

  const toggle = () => i18n.changeLanguage(lang === 'en' ? 'fr' : 'en');

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-0 rounded-full border border-uia-dark overflow-hidden text-xs font-display font-bold uppercase tracking-uia-wide ${className}`}
      aria-label="Toggle language"
    >
      <span className={`px-3 py-1.5 transition-colors ${lang === 'en' ? 'bg-uia-blue text-white' : 'bg-white text-uia-dark hover:bg-uia-gray-light'}`}>
        EN
      </span>
      <span className={`px-3 py-1.5 transition-colors ${lang === 'fr' ? 'bg-uia-blue text-white' : 'bg-white text-uia-dark hover:bg-uia-gray-light'}`}>
        FR
      </span>
    </button>
  );
}

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="bg-mapbox-black border-b border-mapbox-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={ASSETS.logo}
              alt="UIA Logo"
              className="w-12 h-12 object-contain"
            />
            <div>
              <h1 className="text-xl font-display font-semibold text-black tracking-uia-normal">
                Panorama SDG
              </h1>
              <p className="text-xs text-uia-dark tracking-uia-wide font-display uppercase">
                Union of International Architects
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className="text-sm font-medium text-uia-dark hover:text-uia-red transition-colors"
            >
              {t('nav.home')}
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-uia-dark hover:text-uia-red transition-colors"
            >
              {t('nav.explore')}
            </Link>
            <Link
              to="/submit"
              className="text-sm font-medium text-uia-dark hover:text-uia-red transition-colors"
            >
              {t('nav.submit')}
            </Link>
          </nav>

          {/* Right side: language toggle + admin + submit CTA */}
          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-uia-dark hover:text-uia-red transition-colors"
            >
              {t('nav.admin')}
            </Link>
            <Link to="/submit">
              <Button variant="dark" size="sm">
                {t('nav.submit')}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
