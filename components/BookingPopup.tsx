
import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, db } from '../firebase';
import { Service } from '../types';

const BookingPopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isBooked, setIsBooked] = useState(false);
    const [services, setServices] = useState<Service[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        date: '',
        course: '',
        lastAttendedCourse: '',
        percentage: ''
    });

    useEffect(() => {
        // Show popup after 3 seconds on load
        const timer = setTimeout(() => {
            setIsOpen(true);
        }, 2000);

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

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'consultations'), {
                name: formData.name,
                phone: formData.phone,
                date: formData.date,
                interest: formData.course,
                lastAttendedCourse: formData.lastAttendedCourse,
                percentage: formData.percentage,
                createdAt: serverTimestamp(),
                read: false
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
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4 animate-in fade-in duration-500">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/95 backdrop-blur-xl transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white rounded-[2.5rem] shadow-[0_35px_100px_-15px_rgba(0,0,0,0.6)] w-full max-w-4xl h-fit max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-6 right-6 z-30 bg-slate-100 hover:bg-slate-200 text-slate-500 p-2 rounded-full transition-all"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left Side: Visual/Promotion */}
                <div className="hidden md:flex w-1/3 bg-charcoal p-12 flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10 space-y-6">
                        <span className="text-accent text-[10px] font-medium uppercase tracking-[0.3em] block mb-2">Priority Career Access</span>
                        <h3 className="text-3xl font-semibold text-white leading-tight">Your Future <br /> Deserves Expert <br /> Strategy.</h3>
                        <p className="text-white/40 text-sm font-medium leading-relaxed">
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
                <div className="w-full md:w-2/3 p-10 md:p-14 bg-white overflow-y-auto">
                    {isBooked ? (
                        <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h4 className="text-2xl font-semibold text-charcoal tracking-tight">Strategy Confirmed</h4>
                            <p className="text-charcoal/40 font-medium uppercase tracking-widest text-[10px]">An expert will contact you shortly.</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <h4 className="text-2xl font-semibold text-charcoal mb-2 tracking-tight">Book Free Consultation</h4>
                                <p className="text-sm text-charcoal/40 font-medium">Please provide your details for a personalized session.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Full Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all text-sm"
                                            placeholder="John Smith"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Contact Number</label>
                                        <input
                                            required
                                            type="tel"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all text-sm"
                                            placeholder="+91"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Preferred Date</label>
                                        <input
                                            required
                                            type="date"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all text-sm"
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Career Goal</label>
                                        <select
                                            required
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all text-sm appearance-none cursor-pointer"
                                            value={formData.course}
                                            onChange={e => setFormData({ ...formData, course: e.target.value })}
                                        >
                                            <option value="" disabled>Select Pathway</option>
                                            {services.map(service => (
                                                <option key={service.id} value={service.title}>{service.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div className="space-y-2 text-charcoal">
                                        <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Last Exam Passed</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all text-sm"
                                            placeholder="e.g. 12th / Bachelors"
                                            value={formData.lastAttendedCourse}
                                            onChange={e => setFormData({ ...formData, lastAttendedCourse: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Marks (%)</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all text-sm"
                                            placeholder="e.g. 85%"
                                            value={formData.percentage}
                                            onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-charcoal text-white font-semibold py-5 rounded-[1.25rem] shadow-xl hover:bg-black transition-all mt-4 transform active:scale-[0.98] text-sm"
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
