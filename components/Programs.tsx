
import React, { useState, useEffect } from 'react';
import { collection, getDocs, db } from '../firebase';
import { Service } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const Programs: React.FC = () => {
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
            <p className="text-base md:text-xl text-charcoal/50 font-normal max-w-md leading-relaxed">
              Tailored guidance for every step of your international educational journey.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-3 gap-3 md:gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-[4/5] rounded-3xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3 md:gap-8">
            {services.map((service) => (
              <motion.div
                layoutId={service.id}
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="relative aspect-[4/5] rounded-xl md:rounded-3xl overflow-hidden cursor-pointer group shadow-2xl shadow-black/5"
              >
                <img
                  src={service.imageUrl}
                  alt={service.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                {/* Glass Details */}
                <div className="absolute bottom-2 left-2 right-2 md:bottom-6 md:left-6 md:right-6 p-3 md:p-8 bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg md:rounded-2xl transform transition-transform group-hover:-translate-y-2">
                  <h4 className="text-[10px] md:text-2xl font-semibold text-white mb-1 md:mb-2 leading-tight">{service.title}</h4>
                  <p className="text-[8px] md:text-base text-white/60 font-normal line-clamp-1 md:line-clamp-2 hidden sm:block">{service.description}</p>
                </div>

                {/* View Arrow */}
                <div className="absolute top-2 right-2 md:top-6 md:right-6 w-8 h-8 md:w-14 md:h-14 bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  <svg className="w-4 h-4 md:w-7 md:h-7 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
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
                  <p className="text-base md:text-xl text-charcoal/60 font-normal leading-relaxed mb-10">
                    {selectedService.description}
                  </p>
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
    </section>
  );
};

export default Programs;
