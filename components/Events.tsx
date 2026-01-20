import React, { useEffect, useState } from 'react';
import { Event } from '../types';
import { db, collection, getDocs, query, orderBy } from '../firebase';

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const fetchedEvents = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Event));
        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return null;
  if (events.length === 0) return null;

  return (
    <section id="events" className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-32 bg-white">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-20 gap-8">
        <div className="space-y-4">
          <p className="text-[10px] font-medium text-accent uppercase tracking-[0.3em]">Institutional Pulse</p>
          <h3 className="text-4xl md:text-6xl font-semibold text-charcoal tracking-tight">Upcoming Events.</h3>
        </div>
        <button className="group flex items-center gap-4 px-8 py-4 bg-gray-50 rounded-2xl text-charcoal font-semibold text-sm transition-all hover:bg-charcoal hover:text-white">
          Full Calendar
          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-10">
        {events.map((event) => (
          <div key={event.id} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/5 border border-black/5 flex flex-col transition-all duration-500 hover:-translate-y-2">
            {event.imageUrl && (
              <div className="h-64 overflow-hidden bg-gray-50">
                <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
              </div>
            )}
            <div className="p-10 flex-1 flex flex-col">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-2 h-2 rounded-full bg-accent" />
                  <span className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest">{event.type}</span>
                </div>
                <h4 className="text-2xl font-semibold text-charcoal mb-4 group-hover:text-accent transition-colors leading-tight tracking-tight">
                  {event.title}
                </h4>
                {event.description && (
                  <p className="text-charcoal/50 text-sm font-normal mb-8 line-clamp-2 leading-relaxed">
                    {event.description}
                  </p>
                )}
                <div className="space-y-4 pt-6 border-t border-black/5">
                  <div className="flex items-center gap-3 text-xs font-medium text-charcoal/60 uppercase tracking-widest">
                    <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    {event.date}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-charcoal/60 uppercase tracking-widest">
                    <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {event.time}
                  </div>
                  <div className="flex items-center gap-3 text-xs font-medium text-charcoal/60 uppercase tracking-widest">
                    <svg className="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    {event.location}
                  </div>
                </div>
              </div>
              <div className="mt-10">
                {event.registrationLink ? (
                  <a
                    href={event.registrationLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-gray-50 text-charcoal py-5 rounded-2xl font-semibold text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all shadow-xl shadow-black/5"
                  >
                    Register Seat
                  </a>
                ) : (
                  <button disabled className="w-full bg-gray-50 text-charcoal/20 py-5 rounded-2xl font-semibold text-xs uppercase tracking-widest cursor-not-allowed">
                    Fully Booked
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Events;
