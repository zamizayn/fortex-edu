
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, db } from '../firebase';
import { Service } from '../types';

interface BookingPopupProps {
    externalIsOpen?: boolean;
    onExternalClose?: () => void;
    initialCourse?: string;
    initialCategory?: string;
}

const BookingPopup: React.FC<BookingPopupProps> = ({ externalIsOpen, onExternalClose, initialCourse, initialCategory }) => {
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const [isBooked, setIsBooked] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        course: initialCourse || '',
        lastAttendedCourse: '',
        percentage: '',
        comment: ''
    });

    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            course: initialCategory || (services.length > 0 ? services[0].title : ''),
        }));
    }, [initialCourse, initialCategory, services]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'services'));
                const fetchedServices = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
                setServices(fetchedServices);
                if (fetchedServices.length > 0) {
                    setFormData(prev => ({ ...prev, course: fetchedServices[0].title }));
                }
            } catch (error) {
                console.error("Error fetching services:", error);
            }
        };
        fetchServices();
    }, []);

    const handleClose = () => {
        if (onExternalClose) {
            onExternalClose();
        } else {
            setInternalIsOpen(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'consultations'), {
                name: formData.name,
                phone: formData.phone,
                interest: formData.course,
                selectedProgram: initialCourse || null,
                lastAttendedCourse: formData.lastAttendedCourse,
                percentage: formData.percentage,
                comment: formData.comment,
                createdAt: serverTimestamp(),
                read: false,
                initialProgram: initialCourse || null
            });
            setIsBooked(true);
            setTimeout(() => {
                setIsBooked(false);
                handleClose();
            }, 3000);
        } catch (error) {
            console.error("Error booking consultation:", error);
            alert("Failed to book consultation. Please try again.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-end md:items-center justify-center animate-in fade-in duration-500">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-[0_35px_100px_-15px_rgba(0,0,0,0.6)] w-full max-w-3xl h-[85vh] md:h-fit max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-full md:slide-in-from-bottom-10 md:zoom-in-95 duration-700 flex flex-col md:flex-row">

                {/* Mobile Drag Handle */}
                <div className="md:hidden flex justify-center pt-4 pb-2">
                    <div className="w-12 h-1.5 bg-slate-100 rounded-full" />
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 md:top-6 md:right-6 z-30 bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-all min-w-[32px] min-h-[32px] md:min-w-[40px] md:min-h-[40px] flex items-center justify-center"
                >
                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left Side: Visual/Promotion */}
                <div className="hidden md:flex w-1/3 bg-charcoal p-12 flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 space-y-6">
                        <span className="text-accent text-[10px] font-medium uppercase tracking-[0.3em] block mb-2">Priority Career Access</span>
                        <h3 className="text-2xl md:text-3xl font-medium text-white leading-tight">Your Future <br /> Deserves Expert <br /> Strategy.</h3>
                        <p className="text-white/40 text-sm md:text-base font-normal leading-relaxed">
                            Join 6,000+ students who transformed their careers with Fortex guidance.
                        </p>
                        <div className="pt-8 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                                <span className="text-[10px] text-white/60 font-medium uppercase tracking-widest">Counselors Online</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Form */}
                <div className="w-full md:w-2/3 p-6 md:p-12 bg-white overflow-y-auto custom-scrollbar">
                    {isBooked ? (
                        <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h4 className="text-xl md:text-2xl font-normal text-charcoal tracking-tight">Strategy Confirmed</h4>
                            <p className="text-charcoal/40 font-normal uppercase tracking-widest text-[10px]">An expert will contact you shortly.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-xl md:text-2xl font-normal text-charcoal mb-1 tracking-tight">Book Free Consultation</h4>
                                <p className="hidden sm:block text-sm md:text-base text-charcoal/40 font-normal">Please provide your details for a personalized session.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Academic Context (Interest & Program) */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] md:text-base font-normal text-charcoal/40 uppercase tracking-widest ml-1">Academic Interest</label>
                                        <div className="relative">
                                            <select
                                                required
                                                disabled={!!initialCategory}
                                                className={`w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-charcoal font-normal focus:ring-2 focus:ring-accent transition-all text-xs md:text-base appearance-none cursor-pointer min-h-[38px] ${!!initialCategory ? 'opacity-70 cursor-not-allowed bg-slate-100' : ''}`}
                                                value={formData.course}
                                                onChange={e => setFormData({ ...formData, course: e.target.value })}
                                            >
                                                <option value="" disabled>Select Goal</option>
                                                {services.map(service => (
                                                    <option key={service.id} value={service.title}>{service.title}</option>
                                                ))}
                                            </select>
                                            {!initialCategory && (
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal/20">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {initialCourse && (
                                        <div className="p-4 bg-accent/5 rounded-2xl border border-accent/10 animate-in slide-in-from-top-2 duration-500">
                                            <label className="text-[10px] font-normal text-accent uppercase tracking-widest ml-1 mb-1 block">Selected Program</label>
                                            <p className="text-sm md:text-base font-semibold text-charcoal">{initialCourse}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] md:text-base font-normal text-charcoal/40 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-charcoal font-normal focus:ring-2 focus:ring-accent transition-all text-xs md:text-base min-h-[38px]"
                                            placeholder="John Smith"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] md:text-base font-normal text-charcoal/40 uppercase tracking-widest ml-1">Contact Number</label>
                                        <input
                                            required
                                            type="tel"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-charcoal font-normal focus:ring-2 focus:ring-accent transition-all text-xs md:text-base min-h-[38px]"
                                            placeholder="+91"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>


                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-1 text-charcoal">
                                        <label className="text-[10px] md:text-base font-normal text-charcoal/40 uppercase tracking-widest ml-1">Last Exam</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-charcoal font-normal focus:ring-2 focus:ring-accent transition-all text-xs md:text-base min-h-[38px]"
                                            placeholder="e.g. 12th"
                                            value={formData.lastAttendedCourse}
                                            onChange={e => setFormData({ ...formData, lastAttendedCourse: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] md:text-base font-normal text-charcoal/40 uppercase tracking-widest ml-1">Marks (%)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-charcoal font-normal focus:ring-2 focus:ring-accent transition-all text-xs md:text-base min-h-[38px]"
                                            placeholder="e.g. 85%"
                                            value={formData.percentage}
                                            onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] md:text-base font-normal text-charcoal/40 uppercase tracking-widest ml-1">Additional Comments (Optional)</label>
                                    <textarea
                                        rows={3}
                                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-2 text-charcoal font-normal focus:ring-2 focus:ring-accent transition-all text-xs md:text-base resize-none"
                                        placeholder="Tell us more about your career goals..."
                                        value={formData.comment}
                                        onChange={e => setFormData({ ...formData, comment: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-charcoal text-white font-normal py-2.5 rounded-xl shadow-xl hover:bg-black transition-all mt-2 transform active:scale-[0.98] text-xs md:text-base min-h-[44px]"
                                >
                                    Reserve My Slot
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingPopup;
