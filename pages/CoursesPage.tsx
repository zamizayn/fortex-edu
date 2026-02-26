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
                data.sort((a, b) => {
                    if (a.order !== undefined && b.order !== undefined) {
                        if (a.order !== b.order) return a.order - b.order;
                    } else if (a.order !== undefined) {
                        return -1;
                    } else if (b.order !== undefined) {
                        return 1;
                    }
                    return a.title.localeCompare(b.title);
                });
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
                            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl shadow-black/[0.02]">
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
                                            className={`w-full px-4 py-3 rounded-lg text-left text-xs font-bold transition-all flex items-center justify-between group ${selectedCategory === service.id
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
                            <div className="p-6 bg-gray-100 rounded-lg text-gray-900 flex flex-col items-center justify-center text-center">
                                <p className="text-sm font-medium text-gray-600 mb-2">
                                    Total Programs
                                </p>

                                <div className="text-4xl font-bold">
                                    {filteredPrograms.length}
                                </div>
                            </div>



                        </div>
                    </aside>

                    {/* Main Listing Area */}
                    <main className="lg:w-3/4">
                        <AnimatePresence mode="popLayout">
                            {loading ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {[1, 2, 3, 4, 5, 6].map((i) => (
                                        <div
                                            key={i}
                                            className="aspect-[4/5] rounded-xl bg-gray-200 animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : filteredPrograms.length > 0 ? (
                                <motion.div
                                    layout
                                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                                >
                                    {filteredPrograms.map((prog) => (
                                        <motion.div
                                            key={`${prog.categoryId}-${prog.name}`}
                                            layout
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.25 }}
                                            className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                                        >
                                            <div>
                                                <span className="inline-block text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
                                                    {prog.category}
                                                </span>

                                                <h4 className="text-lg font-semibold text-gray-900 leading-snug">
                                                    {prog.name}
                                                </h4>
                                            </div>

                                            <div className="mt-8 pt-4 border-t border-gray-100">
                                                <button
                                                    onClick={() => onBookCourse?.(prog.name, prog.category)}
                                                    className="w-full py-2.5 bg-gray-900 text-white text-sm font-medium rounded-md hover:bg-black transition"
                                                >
                                                    Enquire Now
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-28 text-center border border-dashed border-gray-300 rounded-xl bg-gray-50"
                                >
                                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                                        No Programs Found
                                    </h3>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                                        Try adjusting your filters or selecting a different category.
                                    </p>

                                    <button
                                        onClick={() => setSelectedCategory(null)}
                                        className="px-6 py-2.5 bg-gray-900 text-white rounded-md hover:bg-black transition"
                                    >
                                        Reset Filters
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

            <Footer siteSettings={siteSettings} />
        </div>
    );
};

export default CoursesPage;
