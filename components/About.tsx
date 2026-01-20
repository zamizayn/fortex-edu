import React, { useEffect, useState } from 'react';
import { getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';
import { motion } from 'framer-motion';

const About: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const defaultContent = [
    "At Fortex Education Consultancy, we are committed to turning students’ academic aspirations into reality by providing expert guidance and seamless admission support to top universities and colleges across India.",
    "Our approach is built on transparency, trust, and student-centric solutions, making us one of the most reliable education consultancies in India.",
  ];

  const contentParagraphs = settings?.aboutDescription ? [settings.aboutDescription] : defaultContent;

  const stats = [
    { label: 'Experience', value: '12+' },
    { label: 'Partners', value: '1k+' },
    { label: 'Students', value: '6k+' },
  ];

  return (
    <div className="relative bg-white py-32 lg:py-48 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-24 items-center">

          {/* Visual Side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="relative"
          >
            <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-3xl bg-gray-50">
              <img
                src={settings?.aboutImageUrl || "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop"}
                alt="Education"
                className="w-full h-full object-cover transition-transform duration-1000"
              />
            </div>

            {/* Glassmorphic Badge */}
            <div className="absolute -bottom-10 -right-10 bg-white/70 backdrop-blur-2xl border border-white p-8 rounded-3xl shadow-2xl max-w-xs hidden md:block">
              <p className="text-sm font-medium text-accent uppercase tracking-widest mb-2">#1 Growth</p>
              <p className="text-xl font-medium text-charcoal leading-tight">Empowering a new generation of leaders.</p>
            </div>
          </motion.div>

          {/* Text Side */}
          <div className="space-y-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-xs font-medium text-accent uppercase tracking-[0.3em] mb-4">The Fortex Story</p>
              <h2 className="text-5xl md:text-6xl font-semibold text-charcoal leading-[1.05] tracking-tight text-balance">
                {settings?.aboutTitle || "Guiding You To Your Future Home."}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6 text-xl text-charcoal/70 font-normal leading-relaxed max-w-xl"
            >
              {contentParagraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-3 gap-8 pt-8 border-t border-black/5"
            >
              {stats.map((stat, i) => (
                <div key={i}>
                  <p className="text-3xl font-semibold text-charcoal mb-1">{stat.value}</p>
                  <p className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-sm font-medium text-charcoal group"
              >
                Learn More About Us
                <div className="w-8 h-px bg-charcoal/20 group-hover:w-12 transition-all duration-300" />
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;


