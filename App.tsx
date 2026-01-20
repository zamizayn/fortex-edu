
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Programs from './components/Programs';
import Admissions from './components/Admissions';
import SocialFeed from './components/SocialFeed';
import Contact from './components/Contact';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import ConsultationBooking from './components/ConsultationBooking';
import VideoGallery from './components/VideoGallery';
import AdminDashboard from './components/AdminDashboard';
import AffiliatedColleges from './components/AffiliatedColleges';
import Universities from './components/Universities';
import Events from './components/Events';
import EventPopup from './components/EventPopup';
import Team from './components/Team';
import BookingPopup from './components/BookingPopup';
import { User, SiteSettings } from './types';
import { db, doc, onSnapshot } from './firebase';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState('home');
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('917025337762');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['home', 'about', 'team', 'colleges', 'universities', 'programs', 'booking', 'media', 'admissions', 'social', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top >= -150 && rect.top <= 300;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Check for persisted user
    const storedUser = localStorage.getItem('fortex_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  useEffect(() => {
    // Seed initial data
    const initApp = async () => {
      const { seedAdminUser, seedContent } = await import('./services/db');
      await seedAdminUser();
      await seedContent();
    };
    initApp();

    // Real-time settings listener
    const unsub = onSnapshot(doc(db, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const settings = docSnap.data() as SiteSettings;
        setSiteSettings(settings);
        if (settings.whatsappNumber) setWhatsappNumber(settings.whatsappNumber);
      }
    });

    return () => unsub();
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('fortex_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fortex_user');
  };

  if (user?.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  const isVisible = (sectionId: string) => siteSettings?.visibleSections?.[sectionId] !== false;

  return (
    <div className="relative min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900">
      <Navbar
        activeSection={activeSection}
        user={user}
        onLogout={handleLogout}
        onLoginClick={() => setIsAuthModalOpen(true)}
        siteSettings={siteSettings}
      />

      {/* Intro Popup for Events */}
      {isVisible('events') && <EventPopup />}
      {isVisible('booking') && <BookingPopup />}

      <main>
        {isVisible('hero') && (
          <section id="home">
            <Hero />
          </section>
        )}

        {isVisible('about') && (
          <section id="about">
            <About />
          </section>
        )}

        {isVisible('team') && (
          <Team members={siteSettings?.teamMembers} />
        )}

        {isVisible('colleges') && (
          <>
            <AffiliatedColleges user={user} onLoginClick={() => setIsAuthModalOpen(true)} />
          </>
        )}

        {isVisible('universities') && <Universities />}

        {isVisible('programs') && <Programs />}

        {isVisible('booking') && <ConsultationBooking />}

        {isVisible('media') && <VideoGallery />}

        {isVisible('admissions') && <Admissions />}
        {isVisible('events') && <Events />}


        {isVisible('contact') && <Contact />}
      </main>

      <Footer />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
      />

      <a
        href={`https://wa.me/${whatsappNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 hover:scale-110 transition-all z-40 flex items-center justify-center group"
        aria-label="Contact on WhatsApp"
      >
        <span className="absolute right-full mr-3 bg-white text-gray-900 px-3 py-1.5 rounded-lg text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Need Help? Chat Now
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
        </svg>
      </a>
    </div>
  );
};

export default App;
