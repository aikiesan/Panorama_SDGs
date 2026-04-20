import { Link } from 'react-router-dom';
import { ASSETS } from '../../utils/assets';
import { Button } from '../uia';

export default function Header() {
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
              Home
            </Link>
            <Link
              to="/dashboard"
              className="text-sm font-medium text-uia-dark hover:text-uia-red transition-colors"
            >
              Panorama
            </Link>
            <Link
              to="/submit"
              className="text-sm font-medium text-uia-dark hover:text-uia-red transition-colors"
            >
              Submit Project
            </Link>
          </nav>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-uia-dark hover:text-uia-red transition-colors"
            >
              Admin
            </Link>
            <Link to="/submit">
              <Button variant="dark" size="sm">
                Submit Project
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
