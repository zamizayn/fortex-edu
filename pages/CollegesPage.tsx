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
                            A comprehensive directory of our partner colleges dedicated to excellence in diverse academic and professional education.
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
                                            <div className="flex gap-3">
                                                {college.websiteUrl ? (
                                                    <a
                                                        href={college.websiteUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-charcoal/10 text-charcoal font-medium rounded-xl hover:bg-gray-50 transition-all text-xs flex-1"
                                                    >
                                                        Visit Website
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] font-medium text-charcoal/30 uppercase tracking-widest flex-1 flex items-center justify-center border border-transparent">Contact for Details</span>
                                                )}
                                                <a
                                                    href={`https://wa.me/${siteSettings?.whatsappNumber?.replace(/\D/g, '') || ''}?text=${encodeURIComponent(`Hello, I am interested in ${college.name}.`)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white font-medium rounded-xl hover:bg-[#20bd5a] shadow-lg shadow-[#25D366]/20 transition-all text-xs flex-1"
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
