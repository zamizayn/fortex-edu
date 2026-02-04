
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { User, SiteSettings } from '../types';

interface NavbarProps {
  activeSection: string;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  siteSettings: SiteSettings | null;
}

const Navbar: React.FC<NavbarProps> = ({ activeSection, user, onLogout, onLoginClick, siteSettings }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showFortexDropdown, setShowFortexDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '/', id: 'home', isRoute: true },
    { name: 'Courses', href: '/courses', id: 'programs', isRoute: true },
    { name: 'Top Colleges', href: '/#universities', id: 'universities', isRoute: false },
  ];

  const fortexDropdownLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Contact Us', href: '/contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'py-1.5 bg-white/90 backdrop-blur-md shadow-lg' : 'py-3 bg-transparent shadow-none'}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          {siteSettings?.logoUrl && (
            <img
              src={siteSettings.logoUrl}
              alt="Logo"
              className="h-24 md:h-36 w-auto object-contain transition-all duration-300"
            />
          )}
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className={`text-xs md:text-sm font-medium tracking-wide transition-all ${scrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-300 drop-shadow-lg'}`}
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className={`text-xs md:text-sm font-medium tracking-wide transition-all ${scrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-300 drop-shadow-lg'}`}
              >
                {link.name}
              </a>
            )
          ))}

          {/* Fortex Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowFortexDropdown(!showFortexDropdown)}
              onBlur={() => setTimeout(() => setShowFortexDropdown(false), 200)}
              className={`flex items-center gap-1 text-xs md:text-base font-medium tracking-wide transition-all ${scrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-300 drop-shadow-lg'}`}
            >
              Fortex
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFortexDropdown && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                {fortexDropdownLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => setShowFortexDropdown(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <a
            href="/brochure.pdf"
            download="FORTEXEDU-Brochure.pdf"
            className={`flex items-center gap-2 text-xs md:text-base font-medium tracking-wide transition-all ${scrolled ? 'text-gray-800 hover:text-blue-600' : 'text-white hover:text-blue-300 drop-shadow-lg'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Brochure
          </a>

          <div className={`w-px h-5 mx-2 ${scrolled ? 'bg-charcoal/10' : 'bg-white/10'}`} />

          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 group"
              >
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border border-white/20 shadow-md"
                />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-black/5">
                    <p className="text-xs font-medium text-charcoal truncate">{user.name}</p>
                    <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">{user.role}</p>
                  </div>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block w-full text-left px-4 py-3 text-sm text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      Dashboard
                    </Link>
                  )}

                  <button
                    onClick={() => { onLogout(); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden p-2 transition-colors ${scrolled ? 'text-gray-800' : 'text-white drop-shadow-lg'}`}
        >
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-black/90 backdrop-blur-sm p-8 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-6">
            {navLinks.map((link) => (
              link.isRoute ? (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-semibold text-white hover:text-blue-300 transition-colors py-2"
                >
                  {link.name}
                </Link>
              ) : (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="text-base font-semibold text-white hover:text-blue-300 transition-colors py-2"
                >
                  {link.name}
                </a>
              )
            ))}

            {/* Fortex Dropdown in Mobile */}
            <div className="border-t border-gray-200 pt-4">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-3">Fortex</p>
              {fortexDropdownLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  onClick={() => setIsOpen(false)}
                  className="block text-base font-semibold text-white hover:text-blue-300 transition-colors py-2 pl-4"
                >
                  {link.name}
                </Link>
              ))}
            </div>


            <a
              href="/brochure.pdf"
              download="FORTEXEDU-Brochure.pdf"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 text-base font-semibold text-charcoal hover:text-accent transition-colors py-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Brochure
            </a>

            {/* {!user && (
              <button
                onClick={() => { onLoginClick(); setIsOpen(false); }}
                className="w-full py-5 bg-accent text-white rounded-2xl font-bold text-lg text-center uppercase tracking-widest shadow-xl shadow-accent/20 mt-4 min-h-[56px]"
              >
                Sign In
              </button>
            )} */}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
