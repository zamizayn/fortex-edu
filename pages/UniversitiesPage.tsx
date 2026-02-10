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

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="aspect-[16/10] rounded-[2rem] bg-gray-50 animate-pulse" />
                            ))}
                        </div>
                    ) : universities.length === 0 ? (
                        <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-black/5 text-charcoal/30 font-bold uppercase tracking-widest">
                            No universities listed yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {universities.map((uni, idx) => (
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

                                        <div className="pt-6 border-t border-slate-50 mt-auto flex flex-wrap gap-4">
                                            {uni.websiteUrl && (
                                                <a
                                                    href={uni.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-accent text-white font-medium rounded-xl hover:bg-blue-700 transition-all text-sm w-full"
                                                >
                                                    Visit Website
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <Footer siteSettings={siteSettings} />

            {/* Footer */}
        </div>
    );
};

export default UniversitiesPage;
