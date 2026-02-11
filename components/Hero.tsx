import React, { useEffect, useState } from 'react';
import { getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_SLIDES = [
  {
    id: 1,
    title: "Premium College Admissions Across India",
    description: "Fortex Education Consultancy specializes in securing admissions in top and recognized institutions across India. From career guidance to confirmed admission, we provide complete support to help students choose the right course and build a successful future.",
    subtitle: "KERALA’S NO.1 DOMESTIC ADMISSION CONSULTANCY",
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 2,
    title: "Choose the Right Course. Choose the Right College",
    description: "At Fortex Education, we provide personalized career guidance and complete admission support across India. Our mission is to help students make confident decisions that shape a strong academic and professional future.",
    subtitle: "YOUR CAREER STARTS HERE",
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
  },
  {
    id: 3,
    title: "Secure Your Seat in India’s Leading Colleges",
    description: "We guide students towards premium colleges across Kerala, Karnataka, Tamil Nadu, Telangana, and major education hubs in India. With expert counselling and transparent processes, Fortex makes admissions simple and stress-free.",
    subtitle: "INDIA ADMISSIONS EXPERTS",
    image: "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=2070&auto=format&fit=crop"
  }
];

interface HeroProps {
  siteSettings: SiteSettings | null;
}

const Hero: React.FC<HeroProps> = ({ siteSettings }) => {
  const [currentSlide, setCurrentSlide] = useState(0);


  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[60vh] md:min-h-screen flex items-center justify-center overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-black/50 z-10" />
          <motion.img
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 10, ease: "linear" }}
            src={HERO_SLIDES[currentSlide].image}
            alt={HERO_SLIDES[currentSlide].title}
            className="w-full h-full object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6 md:space-y-8"
          >
            <span className="text-accent-blue text-[10px] md:text-xs font-semibold uppercase tracking-[0.3em] bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-white inline-block">
              {HERO_SLIDES[currentSlide].subtitle}
            </span>

            <h1 className="text-3xl md:text-6xl font-semibold text-white leading-[1.15] tracking-tight text-balance">
              {HERO_SLIDES[currentSlide].title.split('.').map((part, i) => (
                <React.Fragment key={i}>
                  {part}{i === 0 && part && '.'}
                  {i === 0 && <br />}
                </React.Fragment>
              ))}
            </h1>

            <p className="text-sm md:text-lg text-white/80 font-normal max-w-2xl mx-auto text-balance leading-relaxed">
              {HERO_SLIDES[currentSlide].description}
            </p>

            <div className="pt-8 flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
              <div className="w-full md:flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-3 shadow-2xl">
                {/* <div className="flex-1 px-4 py-3 md:px-6 md:py-4 text-left w-full group">
                  <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest mb-1">Stay Updated</p>
                  <p className="text-white font-medium text-xs md:text-sm">Latest Career News</p>
                </div> */}
                {/* <div className="w-px h-8 bg-white/10 hidden md:block" /> */}
                <div className="flex-1 px-4 py-3 md:px-6 md:py-4 text-left w-full">
                  <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest mb-1">WhatsApp</p>
                  <p className="text-white font-medium text-xs md:text-sm">Stay Updated on the latest career updates - Join our WhatsApp Channel.</p>
                </div>
                <a
                  href={`https://wa.me/${siteSettings?.whatsappNumber || '917025337762'}?text=Hi, I am interested in joining your updates channel.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full md:w-auto px-8 py-4 bg-accent text-white font-semibold text-xs md:text-sm rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/40 min-h-[48px] flex items-center justify-center whitespace-nowrap"
                >
                  Join Now
                </a>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-30 hidden md:flex gap-3">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 transition-all duration-500 rounded-full ${currentSlide === index ? 'w-10 bg-white' : 'w-4 bg-white/30'
              }`}
          />
        ))}
      </div>

      {/* Side Label */}
      <div className="absolute bottom-10 left-10 z-20 hidden lg:block">
        <div className="flex items-center gap-4 text-white/60 text-sm">
          {/* <span className="font-medium">0{currentSlide + 1}</span> */}
          {/* <div className="w-8 h-px bg-white/20" /> */}
          {/* <span className="uppercase tracking-widest text-[10px]">Active Session</span> */}
        </div>
      </div>
    </div>
  );
};

export default Hero;
