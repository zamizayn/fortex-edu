
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, db } from '../firebase';
import { Service } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import Stats from './Stats';

const Programs: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || loading || isPaused) return;

    const scrollInterval = setInterval(() => {
      if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth - 10) {
        scrollContainer.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        const firstChild = scrollContainer.firstElementChild as HTMLElement;
        if (firstChild) {
          const itemWidth = firstChild.offsetWidth;
          const gap = parseInt(window.getComputedStyle(scrollContainer).gap || '0');
          scrollContainer.scrollBy({ left: itemWidth + gap, behavior: 'smooth' });
        }
      }
    }, 3000);

    return () => clearInterval(scrollInterval);
  }, [loading, services, isPaused]);

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
          return (a.title || '').localeCompare(b.title || '');
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

  return (
    <section id="programs" className="py-8 md:py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Services Section */}
        <div className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Content */}
            <div className="text-left">

              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                Our Services
              </h3>
              <p className="text-sm md:text-base text-gray-700 leading-relaxed font-normal mb-8">
                At Fortex Education Consultancy, we believe that choosing the right educational path is a life-changing
                decision. Our expert guidance ensures that students not only find the best universities in India but also
                receive personalized support at every step of their admission journey. We offer comprehensive, end-to-end
                services that make the transition into higher education smooth, stress-free, and successful.
              </p>

            </div>

            {/* Right Column: Services Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {/* Item 1 */}
              <div className="flex flex-col items-center group">
                <div className="w-full bg-blue-50 p-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md mb-4 text-blue-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center leading-tight">Expert Counselling</h4>
                </div>
              </div>

              {/* Item 2 */}
              <div className="flex flex-col items-center group">
                <div className="w-full bg-purple-50 p-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md mb-4 text-purple-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center leading-tight">University Selection</h4>
                </div>
              </div>

              {/* Item 3 */}
              <div className="flex flex-col items-center group">
                <div className="w-full bg-green-50 p-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md mb-4 text-green-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center leading-tight">Application Support</h4>
                </div>
              </div>

              {/* Item 4 */}
              <div className="flex flex-col items-center group">
                <div className="w-full bg-amber-50 p-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md mb-4 text-amber-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center leading-tight">Financial Support</h4>
                </div>
              </div>

              {/* Item 5 */}
              <div className="flex flex-col items-center group">
                <div className="w-full bg-red-50 p-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md mb-4 text-red-600">
                    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center leading-tight">Enrollment Support</h4>
                </div>
              </div>

              {/* Item 6 */}
              <div className="flex flex-col items-center group">
                <div className="w-full bg-teal-50 p-6 rounded-3xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col items-center justify-center aspect-square">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-md mb-4 text-teal-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-gray-900 text-center leading-tight">Scholarships</h4>
                </div>
              </div>
            </div>
          </div>
        </div>


        <Stats />

        <div className="mb-16">
          <p className="text-[10px] md:text-sm font-medium text-accent uppercase tracking-[0.3em] mb-4">Our Programs</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-3xl md:text-5xl font-semibold text-charcoal tracking-tight text-balance">
              Find the Right Course <br /> for Your Future.
            </h2>
            <div className="flex flex-col items-start md:items-end gap-4 md:gap-6">
              <p className="text-base md:text-xl text-charcoal/50 font-normal max-w-md leading-relaxed md:text-right">
                Every student has a unique goal. At Fortex Education, we guide you through a wide variety of courses offered in leading Indian colleges.
              </p>
              {/* <button
                onClick={() => navigate('/courses')}
                className="px-6 py-3 md:px-8 md:py-4 bg-charcoal text-white rounded-full font-bold text-xs md:text-sm tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center gap-2"
              >
                <span>View All Programs</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button> */}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div
            ref={scrollRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onTouchStart={() => setIsPaused(true)}
            onTouchEnd={() => setIsPaused(false)}
            className="flex md:grid grid-cols-2 md:grid-cols-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 md:gap-8 pb-8 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden"
          >
            {services.map((service) => (
              <motion.div
                layoutId={service.id}
                key={service.id}
                onClick={() => navigate(`/courses?category=${service.id}`)}
                className="relative min-w-[75vw] md:min-w-0 snap-center aspect-[3/4] md:aspect-[4/3] rounded-3xl md:rounded-3xl overflow-hidden cursor-pointer group shadow-2xl shadow-black/5"
              >
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Glass Details */}
                <div className="absolute bottom-4 left-8 right-8 p-3 md:p-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-2xl transform transition-transform group-hover:-translate-y-2 flex flex-col items-center justify-center text-center">
                  <h4 className="text-xl md:text-xl font-semibold text-white mb-2 leading-tight">{service.title}</h4>
                  <p className="text-base md:text-base text-white/60 font-normal line-clamp-2 md:hidden">{service.description}</p>
                </div>

                {/* View Arrow */}
                <div className="absolute top-6 right-6 w-14 h-14 md:w-10 md:h-10 bg-white/20 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:translate-y-4 md:group-hover:opacity-100 md:group-hover:translate-y-0 transition-all duration-300 shadow-lg">
                  <svg className="w-7 h-7 md:w-5 md:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                </div>
              </motion.div>
            ))}


          </div>
        )}

        {/* Detail Overlay */}
        <AnimatePresence>
          {selectedService && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-charcoal/40 backdrop-blur-md flex items-center justify-center p-6"
              onClick={() => setSelectedService(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-[2.5rem] overflow-hidden max-w-3xl w-full shadow-3xl"
                onClick={e => e.stopPropagation()}
              >
                <div className="aspect-video relative">
                  <img
                    src={selectedService.imageUrl}
                    alt={selectedService.title}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setSelectedService(null)}
                    className="absolute top-6 right-6 w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white min-w-[56px] min-h-[56px]"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
                <div className="p-12">
                  <h3 className="text-2xl md:text-4xl font-semibold text-charcoal mb-8">{selectedService.title}</h3>
                  <p className="text-base md:text-xl text-charcoal/60 font-normal leading-relaxed mb-6">
                    {selectedService.description}
                  </p>

                  {selectedService.programs && selectedService.programs.length > 0 && (
                    <div className="mb-8">
                      <p className="text-xs font-bold text-charcoal uppercase tracking-widest mb-4">Included Programs</p>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                        {selectedService.programs.map((program, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-charcoal/70">
                            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                            {program}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <a
                      href="#contact"
                      onClick={() => setSelectedService(null)}
                      className="px-10 py-5 bg-accent text-white font-bold rounded-2xl shadow-xl shadow-accent/20 hover:bg-blue-700 transition-all text-base md:text-base min-h-[64px] flex items-center justify-center"
                    >
                      Discuss Your Future
                    </a>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="px-10 py-5 border border-black/5 text-charcoal font-bold rounded-2xl hover:bg-gray-50 transition-all text-base md:text-base min-h-[64px]"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section >
  );
};

export default Programs;
