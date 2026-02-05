import React, { useEffect, useState } from 'react';
import { collection, getDocs, db } from '../firebase';
import { College, User, SiteSettings } from '../types';
import { saveLead } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

interface CollegesPageProps {
    user: User | null;
    onLogout: () => void;
    onLoginClick: () => void;
    siteSettings: SiteSettings | null;
}

const CollegesPage: React.FC<CollegesPageProps> = ({ user, onLogout, onLoginClick, siteSettings }) => {
    const [colleges, setColleges] = useState<College[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadFormData, setLeadFormData] = useState({
        location: '',
        course: '',
        percentage: '',
        phone: ''
    });

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchColleges = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'colleges'));
                setColleges(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as College)));
            } catch (error) {
                console.error("Error fetching colleges:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchColleges();
    }, []);

    const handleInterest = (college: College) => {
        if (!user) {
            onLoginClick();
            return;
        }
        setSelectedCollege(college);
        setShowLeadForm(true);
    };

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCollege || !user) return;

        try {
            await saveLead(user, selectedCollege.id, selectedCollege.name, 'college', leadFormData);
            alert(`Interest registered for ${selectedCollege.name}. We will contact you shortly.`);
            setShowLeadForm(false);
            setLeadFormData({ location: '', course: '', percentage: '', phone: '' });
            setSelectedCollege(null);
        } catch (error) {
            console.error("Error saving lead:", error);
            alert("Something went wrong. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar
                activeSection="colleges"
                user={user}
                onLogout={onLogout}
                onLoginClick={onLoginClick}
                siteSettings={siteSettings}
            />

            {/* Hero Header - Matching Courses Aesthetic */}
            <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-white pt-24 md:pt-32">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-black/50 z-10" />
                    <motion.img
                        initial={{ scale: 1.1 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 10, ease: "linear" }}
                        src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2086&auto=format&fit=crop"
                        alt="Colleges Hero"
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
                            Our Network
                        </span>
                        <h1 className="text-4xl md:text-7xl font-semibold text-white leading-[1.1] tracking-tight text-balance">
                            Excellence in <br /> <span className="text-white/80 italic font-light">Affiliate Education.</span>
                        </h1>
                        <p className="text-sm md:text-xl text-white/70 font-normal max-w-2xl mx-auto text-balance leading-relaxed">
                            A comprehensive directory of our partner colleges dedicated to excellence in nursing and allied health education.
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
                    ) : colleges.length === 0 ? (
                        <div className="text-center py-24 bg-gray-50 rounded-[2.5rem] border border-black/5 text-charcoal/30 font-bold uppercase tracking-widest">
                            No colleges listed yet.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {colleges.map((college, idx) => (
                                <motion.div
                                    key={college.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                                    className="group relative flex flex-col h-full bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-accent/10 hover:shadow-3xl transition-all"
                                >
                                    <div className="aspect-[16/10] rounded-2xl overflow-hidden mb-6">
                                        <img
                                            src={college.imageUrl}
                                            alt={college.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                        />
                                    </div>
                                    <div className="flex flex-col flex-grow">
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                            <span className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest">{college.location}</span>
                                        </div>
                                        <h4 className="text-xl font-semibold text-charcoal mb-4 group-hover:text-accent transition-colors tracking-tight leading-tight line-clamp-1">{college.name}</h4>
                                        <p className="text-charcoal/60 text-sm font-normal line-clamp-3 leading-relaxed mb-8 flex-grow">{college.description}</p>

                                        <div className="pt-6 border-t border-slate-50 mt-auto">
                                            {college.websiteUrl ? (
                                                <a
                                                    href={college.websiteUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 px-6 py-3 border border-charcoal/10 text-charcoal font-medium rounded-xl hover:bg-gray-50 transition-all text-xs"
                                                >
                                                    Visit Website
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            ) : (
                                                <span className="text-[10px] font-medium text-charcoal/30 uppercase tracking-widest">Contact for Details</span>
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

            {/* Lead Form */}
            <AnimatePresence>
                {showLeadForm && (
                    <div className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-md flex items-center justify-center p-6">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-3xl"
                        >
                            <h3 className="text-3xl font-semibold text-charcoal mb-2">Step into the Future.</h3>
                            <p className="text-charcoal/50 font-normal mb-8 text-balance">Complete your profile to start your journey with {selectedCollege?.name}.</p>
                            <form id="leadForm" onSubmit={handleLeadSubmit} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-medium text-charcoal/40 uppercase tracking-widest mb-2">Location</label>
                                        <input type="text" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all" placeholder="City" value={leadFormData.location} onChange={(e) => setLeadFormData({ ...leadFormData, location: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-charcoal/40 uppercase tracking-widest mb-2">Phone</label>
                                        <input type="tel" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all" placeholder="+91" value={leadFormData.phone} onChange={(e) => setLeadFormData({ ...leadFormData, phone: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-charcoal/40 uppercase tracking-widest mb-2">Last Course</label>
                                    <input type="text" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all" placeholder="e.g. 12th Standard" value={leadFormData.course} onChange={(e) => setLeadFormData({ ...leadFormData, course: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-medium text-charcoal/40 uppercase tracking-widest mb-2">Recent Grade</label>
                                    <input type="text" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all" placeholder="e.g. 90%" value={leadFormData.percentage} onChange={(e) => setLeadFormData({ ...leadFormData, percentage: e.target.value })} />
                                </div>
                                <div className="pt-4 flex gap-4">
                                    <button type="submit" className="flex-1 bg-accent text-white font-medium py-4 rounded-xl shadow-xl shadow-accent/20 hover:bg-blue-700 transition-all">Submit Application</button>
                                    <button type="button" onClick={() => setShowLeadForm(false)} className="px-8 py-4 text-charcoal/40 font-medium hover:text-charcoal transition-colors">Cancel</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CollegesPage;
