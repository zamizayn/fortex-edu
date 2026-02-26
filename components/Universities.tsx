import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db as firestore } from '../firebase';
import { University, User } from '../types';
import { saveLead } from '../services/db';

interface UniversitiesProps {
    user: User | null;
    onLoginClick: () => void;
}

const Universities: React.FC<UniversitiesProps> = ({ user, onLoginClick }) => {
    const [universities, setUniversities] = useState<University[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedUni, setSelectedUni] = useState<University | null>(null);
    const [showLeadForm, setShowLeadForm] = useState(false);
    const [leadFormData, setLeadFormData] = useState({
        location: '',
        course: '',
        percentage: ''
    });
    const [selectedLocation, setSelectedLocation] = useState<string>('All');

    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const snapshot = await getDocs(collection(firestore, 'universities'));
                setUniversities(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as University)));
            } catch (error) {
                console.error("Error fetching universities:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUniversities();
    }, []);

    const handleInterest = (uni: University) => {
        if (!user) {
            onLoginClick();
            return;
        }
        setSelectedUni(uni);
        setShowLeadForm(true);
    };

    const handleLeadSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUni || !user) return;

        try {
            await saveLead(user, selectedUni.id, selectedUni.name, 'university', leadFormData);
            alert(`Interest registered for ${selectedUni.name}. We will contact you shortly.`);
            setShowLeadForm(false);
            setLeadFormData({ location: '', course: '', percentage: '' });
            setSelectedUni(null);
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

    const uniqueLocations = ['All', ...Array.from(new Set(universities.map(u => u.location).filter(Boolean)))];
    const filteredUniversities = selectedLocation === 'All'
        ? universities
        : universities.filter(u => u.location === selectedLocation);

    if (universities.length === 0) return null;

    return (
        <section id="universities" className="py-12 md:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="mb-16">
                    <p className="text-xs font-medium text-accent uppercase tracking-[0.3em] mb-4">Elite Institutions</p>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <h2 className="text-5xl font-semibold text-charcoal tracking-tight text-balance">
                            Partnering with <br /> the World's Best.
                        </h2>
                        <div className="flex flex-col md:items-end gap-4">
                            <p className="text-xl text-charcoal/50 font-normal max-w-md md:text-right">
                                Direct pathways to prestigious universities across the globe.
                            </p>
                            <select
                                value={selectedLocation}
                                onChange={(e) => setSelectedLocation(e.target.value)}
                                className="px-4 py-3 bg-gray-50 border border-black/5 rounded-full text-sm font-semibold text-charcoal outline-none focus:ring-2 focus:ring-accent transition-all cursor-pointer shadow-sm w-full sm:w-auto self-start md:self-end"
                            >
                                {uniqueLocations.map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {filteredUniversities.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-[2rem] border border-black/5 text-charcoal/30 font-bold uppercase tracking-widest">
                        No universities found for the selected location.
                    </div>
                ) : (
                    <div className="grid md:grid-cols-3 gap-10">
                        {filteredUniversities.map((uni) => (
                            <div
                                key={uni.id}
                                className="group relative cursor-pointer"
                                onClick={() => setSelectedUni(uni)}
                            >
                                <div className="aspect-[16/10] rounded-[2rem] overflow-hidden shadow-2xl shadow-black/5 bg-gray-50 mb-6">
                                    <img
                                        src={uni.imageUrl}
                                        alt={uni.name}
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    />
                                </div>
                                <div className="px-2">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="w-2 h-2 rounded-full bg-accent" />
                                        <span className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest">{uni.location}</span>
                                    </div>
                                    <h4 className="text-2xl font-semibold text-charcoal mb-4 group-hover:text-accent transition-colors tracking-tight leading-tight">{uni.name}</h4>
                                    <p className="text-charcoal/60 text-sm font-normal line-clamp-2 leading-relaxed mb-6">{uni.description}</p>
                                    <button className="text-xs font-medium text-charcoal uppercase tracking-widest border-b-2 border-charcoal/10 group-hover:border-accent transition-all pb-1">
                                        View Prospectus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal & Form Logic Remains Similar for functionality but Styled for Revamp */}
            {selectedUni && !showLeadForm && (
                <div className="fixed inset-0 z-[60] bg-charcoal/40 backdrop-blur-md flex items-center justify-center p-6" onClick={() => setSelectedUni(null)}>
                    <div className="bg-white rounded-[2.5rem] overflow-hidden max-w-4xl w-full shadow-3xl animate-in fade-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="relative h-96">
                            <img src={selectedUni.imageUrl} alt={selectedUni.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                            <button onClick={() => setSelectedUni(null)} className="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            <div className="absolute bottom-10 left-10 right-10">
                                <span className="inline-block px-4 py-2 bg-accent text-white text-[10px] font-semibold rounded-full mb-4 tracking-widest uppercase">{selectedUni.location}</span>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight">{selectedUni.name}</h2>
                            </div>
                        </div>
                        <div className="p-12">
                            <p className="text-xl text-charcoal/60 font-normal leading-relaxed mb-10 whitespace-pre-line">{selectedUni.description}</p>
                            <div className="flex gap-4">
                                <button onClick={() => handleInterest(selectedUni)} className="px-10 py-5 bg-accent text-white font-medium rounded-2xl shadow-xl shadow-accent/20 hover:bg-blue-700 transition-all flex items-center gap-2">Register Interest <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg></button>
                                <a href={selectedUni.websiteUrl} target="_blank" rel="noopener noreferrer" className="px-10 py-5 border border-black/5 text-charcoal font-medium rounded-2xl hover:bg-gray-50 transition-all flex items-center gap-2">Official Website <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg></a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lead Form Styled */}
            {showLeadForm && (
                <div className="fixed inset-0 z-[70] bg-charcoal/40 backdrop-blur-md flex items-center justify-center p-6">
                    <div className="bg-white rounded-[2rem] p-10 max-w-lg w-full shadow-3xl animate-in zoom-in-95 duration-300">
                        <h3 className="text-3xl font-semibold text-charcoal mb-2">Almost There.</h3>
                        <p className="text-charcoal/50 font-normal mb-8 text-balance">Help us personalize your journey to {selectedUni?.name} with a few more details.</p>
                        <form id="uniLeadForm" onSubmit={handleLeadSubmit} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-medium text-charcoal/40 uppercase tracking-widest mb-2">Your Current Location</label>
                                <input type="text" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all" placeholder="e.g. Mumbai, India" value={leadFormData.location} onChange={(e) => setLeadFormData({ ...leadFormData, location: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium text-charcoal/40 uppercase tracking-widest mb-2">Qualifications</label>
                                <input type="text" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all" placeholder="e.g. Bachelor of Science" value={leadFormData.course} onChange={(e) => setLeadFormData({ ...leadFormData, course: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-[10px] font-medium text-charcoal/40 uppercase tracking-widest mb-2">Grade / Score</label>
                                <input type="text" required className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all" placeholder="e.g. 8.5 CGPA" value={leadFormData.percentage} onChange={(e) => setLeadFormData({ ...leadFormData, percentage: e.target.value })} />
                            </div>
                            <div className="pt-4 flex gap-4">
                                <button type="submit" className="flex-1 bg-accent text-white font-medium py-4 rounded-xl shadow-xl shadow-accent/20 hover:bg-blue-700 transition-all">Submit Interest</button>
                                <button type="button" onClick={() => setShowLeadForm(false)} className="px-8 py-4 text-charcoal/40 font-medium hover:text-charcoal transition-colors">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Universities;
