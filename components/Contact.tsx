import React, { useEffect, useState } from 'react';
import { getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';
import { db, collection, addDoc, serverTimestamp } from '../firebase';
import { motion } from 'framer-motion';

const Contact: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'B.Sc. Nursing Admissions',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      setShowSuccess(true);
      setFormData({ name: '', phone: '', subject: 'B.Sc. Nursing Admissions', message: '' });
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error("Error sending inquiry:", error);
      alert("Failed to send inquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: '📞',
      title: 'Phone',
      value: settings?.contactPhone || '+91 70253 37762',
      link: `tel:${settings?.contactPhone || '+917025337762'}`,
    },
    {
      icon: '✉️',
      title: 'Email',
      value: settings?.contactEmail || 'info@fortex.edu',
      link: `mailto:${settings?.contactEmail || 'info@fortex.edu'}`,
    },
    {
      icon: '📍',
      title: 'Location',
      value: 'Kalpetta, Wayanad, Kerala — 673121',
      link: 'https://maps.google.com',
    },
    {
      icon: '🕘',
      title: 'Business Hours',
      value: 'Mon – Sat: 9:00 AM – 6:00 PM',
      link: undefined,
    },
  ];

  const socialLinks = [
    { name: 'Instagram', icon: '📷', href: '#' },
    { name: 'LinkedIn', icon: '💼', href: '#' },
    { name: 'Facebook', icon: '👥', href: '#' },
  ];

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Hero Section with Background Image - extends to top */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden pt-0">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50 z-10" />
          <img
            src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?q=80&w=1200&auto=format&fit=crop"
            alt="Contact Us"
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
          <p className="text-xs md:text-sm font-semibold text-purple-400 uppercase tracking-wider mb-3">
            Get In Touch
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 leading-tight">
            Let's Chart Your Career
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-xl mx-auto font-normal">
            Our specialists are ready to help you navigate the complexities of admissions
          </p>
        </motion.div>
      </div>

      {/* Decorative Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-16 md:py-24">
        {/* Removed old header - now using image hero above */}

        {/* Contact Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-4 gap-6 mb-16"
        >
          {contactInfo.map((info, i) => {
            const Tag = info.link ? motion.a : motion.div;
            return (
              <Tag
                key={i}
                {...(info.link ? { href: info.link } : {})}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 text-center group"
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {info.icon}
                </div>
                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">
                  {info.title}
                </h3>
                <p className="text-base font-semibold text-gray-900">
                  {info.value}
                </p>
              </Tag>
            );
          })}
        </motion.div>

        {/* Statistics Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-semibold text-charcoal mb-4">
              Our Impact in Numbers
            </h2>
            <p className="text-base md:text-lg text-charcoal/60 max-w-2xl mx-auto">
              Trusted by thousands of students and partnered with hundreds of institutions worldwide
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {/* Stat 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">
                1.5K+
              </div>
              <div className="text-sm md:text-base text-charcoal/70 font-medium">
                Courses
              </div>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">
                100%
              </div>
              <div className="text-sm md:text-base text-charcoal/70 font-medium">
                Satisfaction Rate
              </div>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">
                5K+
              </div>
              <div className="text-sm md:text-base text-charcoal/70 font-medium">
                Enrolled Students
              </div>
            </motion.div>

            {/* Stat 4 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-100"
            >
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">
                350+
              </div>
              <div className="text-sm md:text-base text-charcoal/70 font-medium">
                Affiliated Universities
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Main Content Grid */}

      </div>
    </div>
  );
};

export default Contact;
