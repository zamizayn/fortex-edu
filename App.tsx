
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import AuthModal from './components/AuthModal';
import EventPopup from './components/EventPopup';
import BookingPopup from './components/BookingPopup';
import AdminDashboard from './components/AdminDashboard';
import StudentDashboard from './components/StudentDashboard';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import CoursesPage from './pages/CoursesPage';
import CollegesPage from './pages/CollegesPage';
import UniversitiesPage from './pages/UniversitiesPage';
import ScrollToTop from './components/ScrollToTop';
import { seedCourses } from './seedCourses';
import { User, SiteSettings } from './types';
import { db, doc, onSnapshot } from './firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('fortex_user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register' | 'admin'>('login');
  const [whatsappNumber, setWhatsappNumber] = useState('917025337762');
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [preFilledCourse, setPreFilledCourse] = useState<string | undefined>(undefined);
  const [preFilledCategory, setPreFilledCategory] = useState<string | undefined>(undefined);

  // Expose seedCourses function to window for easy access
  useEffect(() => {
    (window as any).seedCourses = seedCourses;
    console.log('💡 To add courses to the database, run: seedCourses() in the console');
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

  const isVisible = (sectionId: string) => siteSettings?.visibleSections?.[sectionId] !== false;

  const hasAutoTriggeredBooking = React.useRef(false);

  // Auto-show booking popup after 3 seconds (only once per session)
  useEffect(() => {
    if (isVisible('booking') && !hasAutoTriggeredBooking.current && window.location.pathname === '/') {
      const timer = setTimeout(() => {
        setIsBookingOpen(true);
        hasAutoTriggeredBooking.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [siteSettings]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('fortex_user', JSON.stringify(newUser));
    if (newUser.role === 'admin') {
      window.location.href = '/admin';
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('fortex_user');
    window.location.href = '/';
  };

  // Removed global admin check to allow admins to use the site


  const triggerBooking = (courseName?: string, categoryName?: string) => {
    setPreFilledCourse(courseName);
    setPreFilledCategory(categoryName);
    setIsBookingOpen(true);
  };

  // Scroll visibility for sticky widget
  const [showWidget, setShowWidget] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // On mobile, show after 75vh (hero height). On desktop, always show.
      const shouldShow = window.innerWidth >= 768 || window.scrollY > (window.innerHeight * 0.75);
      setShowWidget(shouldShow);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="relative min-h-screen font-sans selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar
                  activeSection="home"
                  user={user}
                  onLogout={handleLogout}
                  onLoginClick={() => setIsAuthModalOpen(true)}
                  siteSettings={siteSettings}
                />
                {isVisible('events') && <EventPopup />}
                <HomePage
                  user={user}
                  onLoginClick={() => setIsAuthModalOpen(true)}
                  siteSettings={siteSettings}
                />
                <Footer siteSettings={siteSettings} />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <AboutPage
                user={user}
                onLogout={handleLogout}
                onLoginClick={() => setIsAuthModalOpen(true)}
                siteSettings={siteSettings}
              />
            }
          />
          <Route
            path="/contact"
            element={
              <ContactPage
                user={user}
                onLogout={handleLogout}
                onLoginClick={() => setIsAuthModalOpen(true)}
                siteSettings={siteSettings}
              />
            }
          />
          <Route
            path="/courses"
            element={
              <CoursesPage
                user={user}
                onLogout={handleLogout}
                onLoginClick={() => setIsAuthModalOpen(true)}
                siteSettings={siteSettings}
                onBookCourse={triggerBooking}
              />
            }
          />
          <Route
            path="/colleges"
            element={
              <CollegesPage
                user={user}
                onLogout={handleLogout}
                onLoginClick={() => setIsAuthModalOpen(true)}
                siteSettings={siteSettings}
              />
            }
          />
          <Route
            path="/universities"
            element={
              <UniversitiesPage
                user={user}
                onLogout={handleLogout}
                onLoginClick={() => setIsAuthModalOpen(true)}
                siteSettings={siteSettings}
              />
            }
          />
          <Route
            path="/admin"
            element={
              user?.role === 'admin' ? (
                <AdminDashboard user={user} onLogout={handleLogout} />
              ) : (
                <HomePage
                  user={user}
                  onLoginClick={() => { setAuthModalView('admin'); setIsAuthModalOpen(true); }}
                  siteSettings={siteSettings}
                  shouldOpenLogin={true}
                />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              user ? (
                <StudentDashboard user={user} onLogout={handleLogout} siteSettings={siteSettings} />
              ) : (
                <HomePage
                  user={user}
                  onLoginClick={() => setIsAuthModalOpen(true)}
                  siteSettings={siteSettings}
                  shouldOpenLogin={true}
                />
              )
            }
          />
        </Routes>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => { setIsAuthModalOpen(false); setAuthModalView('login'); }}
          onLogin={handleLogin}
          initialView={authModalView}
        />

        {isVisible('booking') && (
          <BookingPopup
            externalIsOpen={isBookingOpen}
            onExternalClose={() => {
              setIsBookingOpen(false);
              setPreFilledCourse(undefined);
              setPreFilledCategory(undefined);
            }}
            initialCourse={preFilledCourse}
            initialCategory={preFilledCategory}
          />
        )}

        {/* Free Counselling Sticky Widget */}
        <button
          onClick={() => setIsBookingOpen(true)}
          style={{ writingMode: 'vertical-rl' }}
          className={`fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-charcoal text-white px-1.5 py-3 rounded-r-xl shadow-2xl hover:bg-black transition-all duration-500 ease-out flex items-center gap-2 border-l border-y border-white/20 rotate-180 ${showWidget ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}
        >
          <span className="relative flex h-2 w-2 rotate-90">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
          <span className="font-bold text-xs tracking-widest uppercase whitespace-nowrap">Free Consultation</span>
        </button>

        <a
          href={`tel:${siteSettings?.contactPhone || '+917025337762'}`}
          className="fixed bottom-6 left-6 bg-blue-600 text-white p-3.5 rounded-full shadow-2xl hover:bg-blue-700 hover:scale-110 transition-all z-40 flex items-center justify-center group min-w-[48px] min-h-[48px]"
          aria-label="Call for Assistance"
        >
          <span className="absolute left-full ml-4 bg-white text-gray-900 px-3 py-2 rounded-lg text-xs font-semibold shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Click to Call
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
          </svg>
        </a>

        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 bg-green-500 text-white p-3.5 rounded-full shadow-2xl hover:bg-green-600 hover:scale-110 transition-all z-40 flex items-center justify-center group min-w-[48px] min-h-[48px]"
          aria-label="Contact on WhatsApp"
        >
          <span className="absolute right-full mr-4 bg-white text-gray-900 px-3 py-2 rounded-lg text-xs font-semibold shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Need Help? Chat Now
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z" />
          </svg>
        </a>
      </div>
    </Router>
  );
};

export default App;
