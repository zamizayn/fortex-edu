import React, { useEffect, useState } from 'react';
import { collection, getDocs, db } from '../firebase';
import { University, User, SiteSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface UniversitiesPageProps {
    user: User | null;
    onLogout: () => void;
    onLoginClick: () => void;
    siteSettings: SiteSettings | null;
}

const UniversitiesPage: React.FC<UniversitiesPageProps> = ({ user, onLogout, onLoginClick, siteSettings }) => {
    const [universities, setUniversities] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<string>('All');

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchUniversities = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'universities'));
                setUniversities(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as University)));
            } catch (error) {
                console.error("Error fetching universities:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUniversities();
    }, []);

    return (
        <div className="min-h-screen bg-white">
            <Navbar
                activeSection="universities"
                user={user}
                onLogout={onLogout}
                onLoginClick={onLoginClick}
                siteSettings={siteSettings}
            />

            {/* Hero Header - Matching Colleges Aesthetic */}
            <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-white pt-24 md:pt-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, ease: "linear" }}
                        src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop"
                        alt="Universities Hero"
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="relative z-20 max-w-5xl mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="space-y-6 md:space-y-8"
                    >
                        <span className="text-white text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] bg-white/10 backdrop-blur-md px-6 py-2 rounded-full inline-block border border-white/20">
                            Global Partners
                        </span>
                        <h1 className="text-4xl md:text-7xl font-semibold text-white leading-[1.1] tracking-tight text-balance">
                            World-Class <br /> <span className="text-white/80 italic font-light">Academic Excellence.</span>
                        </h1>
                        <p className="text-sm md:text-xl text-white/70 font-normal max-w-2xl mx-auto text-balance leading-relaxed">
                            Discover prestigious universities offering cutting-edge programs and transformative educational experiences.
                        </p>
                    </motion.div>
                </div>
            </div>

            <main className="py-12 md:py-24">
                <div className="max-w-7xl mx-auto px-6 lg:px-12">
                    <div className="flex flex-col lg:flex-row gap-16">
                        {/* Sidebar Filters - Desktop Only */}
                        {!loading && universities.length > 0 && (
                            <aside className="hidden lg:block lg:w-1/4">
                                <div className="lg:sticky lg:top-32 space-y-10">
                                    {/* Locations Filter */}
                                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-black/[0.02]">
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className="text-[10px] font-bold text-charcoal/20 uppercase tracking-[0.3em]">Locations</h3>
                                            {selectedLocation !== 'All' && (
                                                <button
                                                    onClick={() => setSelectedLocation('All')}
                                                    className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wider"
                                                >
                                                    Reset
                                                </button>
                                            )}
                                        </div>
                                        <div className="space-y-1.5">
                                            {['All', ...Array.from(new Set(universities.map(u => u.location).filter(Boolean)))].map((loc) => (
                                                <button
                                                    key={loc}
                                                    onClick={() => setSelectedLocation(loc)}
                                                    className={`w-full px-4 py-3 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between group ${selectedLocation === loc
                                                        ? 'bg-charcoal text-white shadow-xl shadow-black/10'
                                                        : 'text-charcoal/40 hover:text-charcoal hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <span className="truncate pr-2">{loc}</span>
                                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${selectedLocation === loc ? 'bg-accent scale-150' : 'bg-transparent scale-0 group-hover:bg-slate-200 group-hover:scale-100'}`} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Results Count Card */}
                                    <div className="p-6 bg-gray-100 rounded-lg text-gray-900 flex flex-col items-center justify-center text-center">
                                        <p className="text-sm font-medium text-gray-600 mb-2">
                                            Total Universities
                                        </p>
                                        <div className="text-4xl font-bold">
                                            {selectedLocation === 'All' ? universities.length : universities.filter(u => u.location === selectedLocation).length}
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        )}

                        {/* Main Listing Area */}
                        <div className="lg:w-3/4">

                    {!loading && universities.length > 0 && (
                        <div className="flex justify-end mb-8 lg:hidden">
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="px-4 py-3 bg-white border border-black/5 rounded-full text-sm font-semibold text-charcoal outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer shadow-sm w-full sm:w-auto"
                            >
                                {['All', ...Array.from(new Set(universities.map(u => u.location).filter(Boolean)))].map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="aspect-[16/10] rounded-[2rem] bg-gray-50 animate-pulse" />
                            ))}
                        </div>
                    ) : universities.length === 0 ? (
                        <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-black/5 text-charcoal/30 font-bold uppercase tracking-widest">
                            No universities found for the selected location.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {(selectedLocation === 'All' ? universities : universities.filter(u => u.location === selectedLocation)).map((uni, idx) => (
                                <motion.div
                                    key={uni.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative flex flex-col h-full bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-accent/10 hover:shadow-3xl transition-all"
                                >
                                    <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-6">
                                        <img
                                            src={uni.imageUrl}
                                            alt={uni.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                            <span className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest">{uni.location}</span>
                                        </div>
                                        <h4 className="text-xl font-semibold text-charcoal mb-4 group-hover:text-accent transition-colors tracking-tight leading-tight line-clamp-1">{uni.name}</h4>
                                        <p className="text-charcoal/60 text-sm font-normal line-clamp-3 leading-relaxed mb-8 flex-grow">{uni.description}</p>

                                        <div className="pt-6 border-t border-slate-50 mt-auto">
                                            <div className="flex gap-3">
                                                <a
                                                    href={`https://wa.me/${siteSettings?.whatsappNumber?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(`Hello, I am interested in ${uni.name}.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-medium rounded-xl hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20 transition-all text-xs"
                                                >
                                                    Enquire
                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                        </div>
                    </div>
                </div>
            </main>

            <Footer siteSettings={siteSettings} />

            {/* Footer */}
        </div>
    );
};

export default UniversitiesPage;
