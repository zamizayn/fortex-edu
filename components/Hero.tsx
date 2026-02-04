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
    <div className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white pt-20 md:pt-28">
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
          {/* Hero Heading */}
          <h1 className="mt-[60px] md:mt-[80px] text-3xl md:text-5xl font-semibold text-white leading-tight tracking-tight text-balance">
            Clear Guidance <br />
            for a <span className="text-white/80">Bright Future.</span>
          </h1>

          <p className="text-sm md:text-lg text-white/90 font-normal max-w-2xl mx-auto text-balance leading-relaxed">
            Expert guidance for admissions to India's top universities & colleges. We help you navigate your educational path with ease.
          </p>

          {/* Glassmorphic CTA Bar */}
          <div className="pt-12 flex flex-col md:flex-row items-center justify-center gap-6 max-w-4xl mx-auto">
            <div className="w-full md:flex-1 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-3 flex flex-col md:flex-row items-center gap-3 shadow-2xl">
              <div className="flex-1 px-6 py-4 text-left w-full">
                <p className="text-xs text-white/60 font-medium uppercase tracking-widest mb-2">Explore</p>
                <p className="text-white font-medium text-base">Find the right university/college for you or Find Your Ideal Campus </p>
              </div>
              <div className="w-px h-10 bg-white/10 hidden md:block" />
              <div className="flex-1 px-6 py-4 text-left w-full">
                <p className="text-xs text-white/60 font-medium uppercase tracking-widest mb-2">Programs</p>
                <p className="text-white font-medium text-base">Explore Career Streams</p>
              </div>
              <button className="w-full md:w-auto px-10 py-5 bg-accent text-white font-semibold text-sm md:text-base rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/40 min-h-[56px]">
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
