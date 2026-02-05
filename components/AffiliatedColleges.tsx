import React, { useEffect, useState } from 'react';
import { collection, getDocs, db } from '../firebase';
import { College, User, SiteSettings } from '../types';
import { saveLead } from '../services/db';
import { useNavigate } from 'react-router-dom';

interface AffiliatedCollegesProps {
    user: User | null;
    onLoginClick: () => void;
    siteSettings: SiteSettings | null;
}

const AffiliatedColleges: React.FC<AffiliatedCollegesProps> = ({ user, onLoginClick, siteSettings }) => {
    const navigate = useNavigate();
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

    if (loading) {
        return (
            <div className="py-12 md:py-32 grid md:grid-cols-3 gap-8 max-w-7xl mx-auto px-6">
                {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-[4/5] rounded-3xl bg-gray-50 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <section id="colleges" className="py-12 md:py-32 bg-gray-50">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="mb-16">
                    <p className="text-xs font-medium text-accent uppercase tracking-[0.3em] mb-4">Our Network</p>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <h2 className="text-3xl md:text-5xl font-semibold text-charcoal tracking-tight text-balance">
                            Excellence in <br /> Affiliate Education.
                        </h2>
                        <div className="flex flex-col md:items-end gap-4">
                            <p className="text-base md:text-xl text-charcoal/50 font-normal max-w-md md:text-right">
                                Discover premier colleges dedicated to shaping your future across diverse academic disciplines.
                            </p>
                            <button
                                onClick={() => navigate('/colleges')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-black/5 rounded-full text-sm font-semibold text-charcoal hover:bg-gray-50 transition-all shadow-sm w-fit self-start md:self-end"
                            >
                                See All Colleges
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </button>
                        </div>
                    </div>
                </div>

                {colleges.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[2rem] border border-black/5 text-charcoal/30 font-bold uppercase tracking-widest">
                        No colleges listed yet.
                    </div>
                ) : (
                    <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 -mx-6 px-6 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
                        {colleges.map((college) => (
                            <div
                                key={college.id}
                                className="group relative min-w-[85vw] md:min-w-[400px] snap-start"
                            >
                                <div className="aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/5 bg-white mb-6">
                                    <img
                                        src={college.imageUrl}
                                        alt={college.name}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                </div>
                                <div className="px-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                                        <span className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest">{college.location}</span>
                                    </div>
                                    <h4 className="text-xl md:text-2xl font-semibold text-charcoal mb-3 group-hover:text-accent transition-colors tracking-tight leading-tight line-clamp-1">{college.name}</h4>
                                    <p className="text-charcoal/60 text-sm font-normal line-clamp-2 leading-relaxed mb-6">{college.description}</p>
                                    <div className="pt-4 mt-auto">
                                        {college.websiteUrl ? (
                                            <a
                                                href={college.websiteUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="inline-flex items-center gap-2 px-5 py-2.5 border border-charcoal/10 text-charcoal font-medium rounded-xl hover:bg-gray-50 transition-all text-xs"
                                            >
                                                Visit Website
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                            </a>
                                        ) : (
                                            <span className="text-[10px] font-medium text-charcoal/20 uppercase tracking-widest">Contact for Details</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>


            {/* Lead Form Styled consistently with Universities */}
            {showLeadForm && (
                <div className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-3xl animate-in zoom-in-95 duration-300">
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
                    </div>
                </div>
            )}
        </section>
    );
};

export default AffiliatedColleges;
