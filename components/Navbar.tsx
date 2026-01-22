
import React, { useState, useEffect } from 'react';
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home', id: 'home' },
    { name: 'Courses', href: '#programs', id: 'programs' },
    { name: 'Top Colleges', href: '#universities', id: 'universities' },
    { name: 'Free Counseling', href: '#booking', id: 'booking' },
    { name: 'About Us', href: '#about', id: 'about' },
    { name: 'Contact', href: '#contact', id: 'contact' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
        ? 'py-4 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-lg shadow-black/5'
        : 'py-6 bg-transparent'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Logo */}
        <a href="#home" className="flex items-center gap-2 group">
          {siteSettings?.logoUrl ? (
            <img
              src={siteSettings.logoUrl}
              alt="Logo"
              className={`h-12 w-auto object-contain transition-all duration-300 ${scrolled ? 'invert-0' : 'brightness-0 invert'}`}
            />
          ) : (
            <span className={`text-4xl font-semibold tracking-tighter ${scrolled ? 'text-charcoal' : 'text-white'}`}>
              FORTEX<span className="text-accent">EDU</span>
            </span>
          )}
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className={`text-sm font-medium tracking-wide transition-all hover:opacity-100 ${activeSection === link.id
                ? (scrolled ? 'text-accent' : 'text-white')
                : (scrolled ? 'text-charcoal/60' : 'text-white/60')
                }`}
            >
              {link.name}
            </a>
          ))}

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
                  className="w-8 h-8 rounded-full border border-white/20 shadow-md"
                />
              </button>
              {showProfileMenu && (
                <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-2xl border border-black/5 p-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-3 border-b border-black/5">
                    <p className="text-xs font-medium text-charcoal truncate">{user.name}</p>
                    <p className="text-[10px] text-charcoal/40 uppercase tracking-widest">{user.role}</p>
                  </div>
                  <button
                    onClick={() => { onLogout(); setShowProfileMenu(false); }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${scrolled
                ? 'bg-charcoal text-white hover:bg-black shadow-xl shadow-black/10'
                : 'bg-white text-charcoal hover:bg-white/90 shadow-xl shadow-white/10'
                }`}
            >
              Sign In
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`md:hidden p-2 transition-colors ${scrolled ? 'text-charcoal' : 'text-white'}`}
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-black/5 p-6 animate-in slide-in-from-top duration-300">
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-lg font-medium text-charcoal hover:text-accent transition-colors"
              >
                {link.name}
              </a>
            ))}
            {!user && (
              <button
                onClick={() => { onLoginClick(); setIsOpen(false); }}
                className="w-full py-4 bg-accent text-white rounded-2xl font-semibold text-center uppercase tracking-widest shadow-xl shadow-accent/20 mt-4"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
