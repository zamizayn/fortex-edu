import React, { useEffect, useState } from 'react';
import { db, collection, query, orderBy, limit, getDocs } from '../firebase';
import { Event } from '../types';

const EventPopup: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [event, setEvent] = useState<Event | null>(null);

    useEffect(() => {
        const fetchLatestEvent = async () => {
            try {
                // Fetch only the most recent event
                const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'), limit(1));
                const snapshot = await getDocs(q);

                if (!snapshot.empty) {
                    const latestEvent = {
                        id: snapshot.docs[0].id,
                        ...snapshot.docs[0].data()
                    } as Event;
                    setEvent(latestEvent);

                    // Show popup after a short delay
                    setTimeout(() => setIsOpen(true), 800);
                }
            } catch (error) {
                console.error("Error fetching event for popup:", error);
            }
        };

        fetchLatestEvent();
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-in fade-in duration-500">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white rounded-[3rem] shadow-[0_35px_100px_-15px_rgba(0,0,0,0.6)] w-full max-w-5xl h-fit max-h-[90vh] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-700 transform transition-all flex flex-col md:flex-row">

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-8 right-8 z-30 bg-white/10 hover:bg-white/30 backdrop-blur-2xl text-white p-3 rounded-full transition-all border border-white/20 hover:rotate-90 shadow-2xl group"
                    title="Close"
                >
                    <svg className="w-8 min-w-8 h-8 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>

                {/* Left Side: Cinematic Visual */}
                <div className="w-full md:w-1/2 relative h-[300px] md:h-auto overflow-hidden group">
                    {event.imageUrl ? (
                        <img
                            src={event.imageUrl}
                            alt={event.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                        />
                    ) : (
                        <div className={`absolute inset-0 flex items-center justify-center ${event.type === 'Webinar' ? 'bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900' :
                            event.type === 'Orientation' ? 'bg-gradient-to-br from-blue-700 via-cyan-800 to-slate-900' :
                                'bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-900'
                            }`}>
                            <div className="text-white/10 scale-[3] blur-sm">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"></path></svg>
                            </div>
                        </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

                    <div className="absolute bottom-12 left-12 right-12 z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest shadow-2xl ${event.type === 'Webinar' ? 'bg-purple-500 text-white' :
                                event.type === 'Orientation' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-white'
                                }`}>
                                <span className="w-2 h-2 rounded-full bg-white animate-ping mr-2"></span>
                                {event.type}
                            </span>
                        </div>
                        <h3 className="text-white text-3xl md:text-4xl font-semibold leading-tight drop-shadow-2xl mb-2">{event.title}</h3>
                        <p className="text-white/70 text-base font-medium italic">Don't miss this opportunity</p>
                    </div>
                </div>

                {/* Right Side: Detailed Content */}
                <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-between bg-white overflow-y-auto">
                    <div>
                        <div className="flex justify-between items-start mb-12">
                            <div>
                                <h4 className="text-blue-600 text-sm font-medium uppercase tracking-[0.3em] mb-4">Event Highlight</h4>
                                <div className="h-1.5 w-20 bg-blue-600 rounded-full"></div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-12">
                            <div className="flex items-center gap-5 group">
                                <div className="p-5 bg-blue-50 rounded-3xl text-blue-600 h-16 w-16 min-w-[64px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-medium tracking-widest mb-1">Schedule</p>
                                    <p className="text-lg font-semibold text-slate-900 leading-tight">{event.date}</p>
                                    <p className="text-slate-500 font-medium">{event.time}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-5 group">
                                <div className="p-5 bg-emerald-50 rounded-3xl text-emerald-600 h-16 w-16 min-w-[64px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 uppercase font-medium tracking-widest mb-1">Location</p>
                                    <p className="text-lg font-semibold text-slate-900 leading-tight">{event.location}</p>
                                </div>
                            </div>
                        </div>

                        {/* Description Section */}
                        <div className="mb-12 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                            <h5 className="text-slate-900 font-semibold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path></svg>
                                Details
                            </h5>
                            <p className="text-slate-600 leading-relaxed text-base font-medium">
                                {event.description || "Join us for an insightful session where we explore global career opportunities and guidance."}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-stretch gap-4">
                        {event.registrationLink ? (
                            <a
                                href={event.registrationLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 group relative overflow-hidden bg-blue-600 text-white font-semibold py-5 rounded-[1.25rem] transition-all shadow-[0_20px_50px_-15px_rgba(37,99,235,0.4)] hover:shadow-[0_25px_60px_-15px_rgba(37,99,235,0.6)] hover:-translate-y-1 active:scale-[0.98] text-center text-lg flex items-center justify-center gap-3"
                            >
                                Register Now
                                <svg className="w-5 h-5 transition-transform group-hover:translate-x-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </a>
                        ) : (
                            <button disabled className="flex-1 block text-center bg-slate-100 text-slate-400 font-semibold py-5 rounded-[1.25rem] cursor-not-allowed text-lg border-2 border-slate-200">
                                Registration Closed
                            </button>
                        )}
                        <button
                            onClick={handleClose}
                            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-5 rounded-[1.25rem] transition-all active:scale-[0.98] text-center text-lg border-2 border-slate-200 shadow-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventPopup;
