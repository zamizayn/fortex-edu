import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, db } from '../firebase';
import { Service, User, SiteSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface ProgramWithCategory {
    name: string;
    category: string;
    categoryId: string;
    categoryImage: string;
    categoryDescription: string;
}

interface CoursesPageProps {
    user: User | null;
    onLogout: () => void;
    onLoginClick: () => void;
    siteSettings: SiteSettings | null;
    onBookCourse?: (courseName: string, categoryName: string) => void;
}

const CoursesPage: React.FC<CoursesPageProps> = ({ user, onLogout, onLoginClick, siteSettings, onBookCourse }) => {
    const [searchParams] = useSearchParams();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(searchParams.get('category'));
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        const cat = searchParams.get('category');
        if (cat) {
            setSelectedCategory(cat);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'services'));
                const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
                setServices(data);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    // Flatten programs with category metadata
    const allPrograms = useMemo(() => {
        const programs: ProgramWithCategory[] = [];
        services.forEach(service => {
            if (service.programs) {
                service.programs.forEach(prog => {
                    programs.push({
                        name: prog,
                        category: service.title,
                        categoryId: service.id,
                        categoryImage: service.imageUrl,
                        categoryDescription: service.description
                    });
                });
            }
        });
        return programs;
    }, [services]);

    // Derived filtered programs
    const filteredPrograms = useMemo(() => {
        return allPrograms.filter(prog => {
            const matchesCategory = !selectedCategory || prog.categoryId === selectedCategory;
            return matchesCategory;
        });
    }, [allPrograms, selectedCategory]);

    const toggleCategory = (id: string) => {
        setSelectedCategory(prev => prev === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-[#FAFBFC] selection:bg-blue-100 selection:text-blue-900">
            <Navbar
                activeSection="courses"
                user={user}
                onLogout={onLogout}
                onLoginClick={onLoginClick}
                siteSettings={siteSettings}
            />

            {/* Hero Header - Matching Homepage Aesthetic */}
            <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-white pt-24 md:pt-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, ease: "linear" }}
                        src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
                        alt="Courses Hero"
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
                            ACADEMIC CATALOG
                        </span>
                        <h1 className="text-4xl md:text-7xl font-semibold text-white leading-[1.1] tracking-tight text-balance">
                            Find Your Future <br /> <span className="text-white/80 italic font-light">International Path.</span>
                        </h1>
                        <p className="text-sm md:text-xl text-white/70 font-normal max-w-2xl mx-auto text-balance leading-relaxed">
                            Explore 150+ world-class programs across {services.length} specialized disciplines.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-24">
                <div className="flex flex-col lg:flex-row gap-16">

                    {/* Sidebar Filters - Desktop Only */}
                    <aside className="hidden lg:block lg:w-1/4">
                        <div className="lg:sticky lg:top-32 space-y-10">

                            {/* Categories Filter - Single Select */}
                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-black/[0.02]">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-[10px] font-bold text-charcoal/20 uppercase tracking-[0.3em]">Disciplines</h3>
                                    {selectedCategory && (
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="text-[10px] font-bold text-accent hover:underline uppercase tracking-wider"
                                        >
                                            Reset
                                        </button>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    {services.map((service) => (
                                        <button
                                            key={service.id}
                                            onClick={() => toggleCategory(service.id)}
                                            className={`w-full px-5 py-4 rounded-xl text-left text-sm font-bold transition-all flex items-center justify-between group ${selectedCategory === service.id
                                                ? 'bg-charcoal text-white shadow-xl shadow-black/10'
                                                : 'text-charcoal/40 hover:text-charcoal hover:bg-slate-50'
                                                }`}
                                        >
                                            <span className="truncate pr-2">{service.title}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full transition-all ${selectedCategory === service.id ? 'bg-accent scale-150' : 'bg-transparent scale-0 group-hover:bg-slate-200 group-hover:scale-100'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Results Count Card */}
                            <div className="p-8 bg-accent rounded-[2.5rem] text-white shadow-2xl shadow-accent/20 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-4">Live Discovery</p>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <span className="text-5xl font-bold">{filteredPrograms.length}</span>
                                    <span className="text-xs font-bold text-white/70 italic">Programs</span>
                                </div>
                                <button
                                    onClick={() => window.scrollTo({ top: window.innerHeight * 0.9, behavior: 'smooth' })}
                                    className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-xs font-bold uppercase tracking-widest border border-white/10"
                                >
                                    View Selection
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Main Listing Area */}
                    <main className="lg:w-3/4">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                    {[1, 2, 3, 4, 5, 6].map(i => (
                                        <div key={i} className="aspect-[4/5] rounded-[3rem] bg-white animate-pulse shadow-sm" />
                                    ))}
                                </div>
                            ) : filteredPrograms.length > 0 ? (
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8"
                                >
                                    {filteredPrograms.map((prog, idx) => (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.3, delay: Math.min(idx * 0.03, 0.3) }}
                                            key={`${prog.categoryId}-${prog.name}`}
                                            className="group p-6 md:p-10 bg-white border border-slate-100/50 rounded-[2.5rem] md:rounded-[3rem] hover:border-accent/10 hover:shadow-3xl hover:shadow-accent/[0.03] transition-all flex flex-col justify-between"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between mb-8">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-accent/5 transition-colors">
                                                        <div className="w-2 h-2 rounded-full bg-slate-200 group-hover:bg-accent transition-all group-hover:scale-150" />
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest group-hover:text-accent/30 transition-colors bg-slate-50/50 px-3 py-1 rounded-full">
                                                        {prog.category}
                                                    </span>
                                                </div>
                                                <h4 className="text-lg md:text-xl font-semibold text-charcoal leading-tight group-hover:text-accent transition-colors">
                                                    {prog.name}
                                                </h4>
                                            </div>
                                            <div className="mt-10 pt-8 border-t border-slate-50 flex items-center justify-between">
                                                <button
                                                    onClick={() => onBookCourse?.(prog.name, prog.category)}
                                                    className="px-4 py-2 rounded-xl bg-slate-50 text-accent font-bold text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all opacity-100 translate-x-0 md:opacity-0 md:-translate-x-2 md:group-hover:opacity-100 md:group-hover:translate-x-0"
                                                >
                                                    Enquire Now
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={`https://wa.me/${siteSettings?.whatsappNumber || '917025337762'}?text=Hi, I am interested in ${prog.name}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center opacity-100 translate-x-0 md:opacity-0 md:translate-x-3 md:group-hover:opacity-100 md:group-hover:translate-x-0 transition-all hover:bg-accent hover:text-white"
                                                        title="WhatsApp Inquiry"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                                    </a>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-40 text-center bg-white rounded-[4rem] border border-dashed border-slate-200"
                                >
                                    <div className="w-28 h-28 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                                        <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <h3 className="text-3xl font-bold text-charcoal mb-4">Zero Matches Found.</h3>
                                    <p className="text-slate-400 font-medium text-lg max-w-md mx-auto leading-relaxed mb-10">
                                        Try selecting a different academic discipline.
                                    </p>
                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="px-12 py-5 bg-charcoal text-white font-bold rounded-2xl shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all text-sm uppercase tracking-widest"
                                    >
                                        Reset All Filters
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <button
                    onClick={() => setIsFilterOpen(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-charcoal text-white rounded-full shadow-2xl shadow-black/30 hover:scale-105 active:scale-95 transition-all text-sm font-bold uppercase tracking-wider border border-white/10 backdrop-blur-md bg-charcoal/90"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Filters {selectedCategory ? '(1)' : ''}
                </button>
            </div>

            {/* Mobile Filter Bottom Sheet */}
            <AnimatePresence>
                {isFilterOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsFilterOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white rounded-t-[3rem] z-[70] shadow-2xl lg:hidden flex flex-col"
                        >
                            <div className="p-4 flex justify-center">
                                <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                            </div>
                            <div className="px-8 pb-6 flex items-center justify-between border-b border-slate-50">
                                <div>
                                    <h3 className="text-xl font-bold text-charcoal">Academic Catalog</h3>
                                    <p className="text-xs text-slate-400 font-medium">Select a discipline to browse</p>
                                </div>
                                {selectedCategory && (
                                    <button
                                        onClick={() => { setSelectedCategory(null); setIsFilterOpen(false); }}
                                        className="text-[10px] font-bold text-accent uppercase tracking-wider"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-2">
                                {services.map((service) => (
                                    <button
                                        key={service.id}
                                        onClick={() => {
                                            toggleCategory(service.id);
                                            setIsFilterOpen(false);
                                        }}
                                        className={`w-full px-6 py-5 rounded-2xl text-left text-[15px] font-bold transition-all flex items-center justify-between group ${selectedCategory === service.id
                                            ? 'bg-accent text-white shadow-xl shadow-accent/20'
                                            : 'bg-slate-50 text-charcoal/60 hover:bg-slate-100'
                                            }`}
                                    >
                                        <span>{service.title}</span>
                                        {selectedCategory === service.id && (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <div className="p-8 border-t border-slate-50">
                                <button
                                    onClick={() => setIsFilterOpen(false)}
                                    className="w-full py-5 bg-charcoal text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-black/10 transition-all active:scale-95"
                                >
                                    Show Results
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <Footer />
        </div>
    );
};

export default CoursesPage;
