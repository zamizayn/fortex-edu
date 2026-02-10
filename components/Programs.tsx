
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, db } from '../firebase';
import { Service } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Programs: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'services'));
        setServices(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service)));
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <section id="programs" className="py-8 md:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="mb-16">
          <p className="text-[10px] md:text-sm font-medium text-accent uppercase tracking-[0.3em] mb-4">Our Programs</p>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <h2 className="text-3xl md:text-5xl font-semibold text-charcoal tracking-tight text-balance">
              Explore Your <br /> Global Path.
            </h2>
            <div className="flex flex-col items-start md:items-end gap-4 md:gap-6">
              <p className="text-base md:text-xl text-charcoal/50 font-normal max-w-md leading-relaxed md:text-right">
                Tailored guidance for every step of your international educational journey.
              </p>
              <button
                onClick={() => navigate('/courses')}
                className="px-6 py-3 md:px-8 md:py-4 bg-charcoal text-white rounded-full font-bold text-xs md:text-sm tracking-widest uppercase hover:bg-black transition-all shadow-xl shadow-black/10 flex items-center gap-2"
              >
                <span>View All Programs</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
              </button>
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
          <div className="flex md:grid grid-cols-2 md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none gap-4 md:gap-8 pb-8 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 [-ms-overflow-style:'none'] [scrollbar-width:'none'] [&::-webkit-scrollbar]:hidden">
            {services.map((service) => (
              <motion.div
                layoutId={service.id}
                key={service.id}
                onClick={() => navigate(`/courses?category=${service.id}`)}
                className="relative min-w-[75vw] md:min-w-0 snap-center aspect-[4/5] rounded-3xl md:rounded-3xl overflow-hidden cursor-pointer group shadow-2xl shadow-black/5"
              >
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Glass Details */}
                <div className="absolute bottom-6 left-8 right-8 p-4 md:p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl md:rounded-2xl transform transition-transform group-hover:-translate-y-2 flex flex-col items-center justify-center text-center">
                  <h4 className="text-2xl md:text-2xl font-semibold text-white mb-2 leading-tight">{service.title}</h4>
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
