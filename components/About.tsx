import React, { useEffect, useState } from 'react';
import { getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';
import { motion } from 'framer-motion';
import Team from './Team';

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
    "At Fortex Education Consultancy, we are committed to turning students' academic aspirations into reality by providing expert guidance and seamless admission support to top universities and colleges across India.",
    "Our approach is built on transparency, trust, and student-centric solutions, making us one of the most reliable education consultancies in India.",
  ];

  const contentParagraphs = settings?.aboutDescription ? [settings.aboutDescription] : defaultContent;

  const stats = [
    { label: 'Years Experience', value: '12+', icon: '🎓' },
    { label: 'Partner Institutions', value: '1000+', icon: '🏛️' },
    { label: 'Students Placed', value: '6000+', icon: '👨‍🎓' },
  ];

  const values = [
    {
      title: 'Excellence',
      description: 'We strive for excellence in every aspect of our service delivery.',
      icon: '⭐',
    },
    {
      title: 'Integrity',
      description: 'Transparency and honesty form the foundation of our relationships.',
      icon: '🤝',
    },
    {
      title: 'Innovation',
      description: 'We continuously evolve to meet the changing needs of education.',
      icon: '💡',
    },
  ];

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Hero Section with Background Image - extends to top */}
      <div className="relative min-h-[85vh] lg:min-h-screen flex items-center justify-center overflow-hidden pt-0">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img
            src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?q=80&w=1200&auto=format&fit=crop"
            alt="About Us"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Hero Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-20 text-center px-6 max-w-4xl"
        >
          <p className="text-xs md:text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">
            About Fortex Education
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            {settings?.aboutTitle || "Guiding You To Your Future Home"}
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed font-normal">
            Empowering students to achieve their academic dreams through expert guidance and personalized support
          </p>
        </motion.div>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-16 md:py-24">
        {/* Removed old hero section - now using image hero above */}

        {/* Main Content Grid (Fortex History) */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-32">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src={settings?.aboutImageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"}
                alt="Education"
                className="w-full h-[400px] md:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            {/* Floating Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute -bottom-6 -right-6 bg-white rounded-2xl p-6 shadow-xl max-w-xs"
            >
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">
                #1 Consultancy
              </p>
              <p className="text-lg font-semibold text-gray-900">
                Trusted by thousands of students
              </p>
            </motion.div>
          </motion.div>

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="mb-6">
              <p className="text-[10px] md:text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
                Our Journey
              </p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                Fortex history
              </h2>
            </div>
            {contentParagraphs.map((paragraph, idx) => (
              <p key={idx} className="text-sm md:text-base text-gray-700 leading-relaxed font-normal">
                {paragraph}
              </p>
            ))}

            {/* Secondary Image in Journey Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="pt-6"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                <img
                  src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?q=80&w=1200&auto=format&fit=crop"
                  alt="Our Journey"
                  className="w-full h-48 md:h-64 object-cover"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-10 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="group relative bg-white rounded-3xl p-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] transition-all duration-500"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600" />
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                🚀
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                <p className="text-gray-600 leading-relaxed text-lg font-normal">
                  To empower students with the knowledge, resources, and guidance needed to make informed decisions about their educational journey and achieve their career aspirations.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="group relative bg-white rounded-3xl p-10 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] transition-all duration-500"
          >
            <div className="absolute top-0 left-0 w-2 h-full bg-purple-600" />
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
                👁️
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
                <p className="text-gray-600 leading-relaxed text-lg font-normal">
                  To be the most trusted and innovative education consultancy in India, recognized for transforming lives through quality education and personalized student support.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Meet Our Team */}
        <div className="mb-32">
          <Team />
        </div>

        {/* Stats Section */}
        {/* <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow text-center"
            >
              <div className="text-4xl mb-3">{stat.icon}</div>
              <p className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-[10px] md:text-xs font-medium text-gray-600 uppercase tracking-widest">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div> */}

        {/* Our Values Section */}


        {/* CTA Section */}

      </div>
    </div>
  );
};

export default About;
