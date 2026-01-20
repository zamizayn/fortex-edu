import React, { useEffect, useState, useRef } from 'react';
import { getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';
import { motion } from 'framer-motion';

const Hero: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Immersive Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <img
          src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
          alt="Global Learning"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative z-20 max-w-5xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Empowering Your Educational Journey
          </div>

          {/* Hero Heading */}
          <h1 className="text-6xl md:text-8xl font-semibold text-white leading-tight tracking-tight text-balance">
            Your Future <br />
            STarts <span className="text-white/80">Everywhere.</span>
          </h1>

          <p className="text-xl md:text-2xl text-white/90 font-normal max-w-2xl mx-auto text-balance">
            Expert guidance for admissions to world-class universities. We help you navigate your global education path with ease.
          </p>

          {/* Glassmorphic CTA Bar */}
          <div className="pt-10 flex flex-col md:flex-row items-center justify-center gap-4 max-w-3xl mx-auto">
            <div className="w-full md:flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-2 flex flex-col md:flex-row items-center gap-2 shadow-2xl">
              <div className="flex-1 px-4 py-3 text-left">
                <p className="text-xs text-white/60 font-medium uppercase tracking-widest mb-1">Explore</p>
                <p className="text-white font-medium">What's your dream destination?</p>
              </div>
              <div className="w-px h-10 bg-white/10 hidden md:block" />
              <div className="flex-1 px-4 py-3 text-left">
                <p className="text-xs text-white/60 font-medium uppercase tracking-widest mb-1">Programs</p>
                <p className="text-white font-medium">Choose Your Path</p>
              </div>
              <button className="w-full md:w-auto px-8 py-4 bg-accent text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/40">
                Get Started
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Floating Elements (Subtle) */}
      <div className="absolute bottom-10 left-10 z-20 hidden lg:block">
        <div className="flex items-center gap-4 text-white/60 text-sm">
          <span className="font-medium">01</span>
          <div className="w-8 h-px bg-white/20" />
          <span>Consultation</span>
        </div>
      </div>
    </div>
  );
};

export default Hero;
