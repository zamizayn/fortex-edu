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
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          {contactInfo.map((info, i) => (
            <motion.a
              key={i}
              href={info.link}
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
            </motion.a>
          ))}
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-white rounded-3xl p-8 md:p-12 shadow-xl"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              Send us a Message
            </h2>
            <p className="text-sm text-gray-600 mb-6 font-normal">
              Fill out the form below and we'll get back to you shortly
            </p>

            {showSuccess && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <p className="text-green-800 font-medium">
                  Message sent successfully! We'll contact you soon.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest ml-1">
                    Your Name *
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="John Smith"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest ml-1">
                    Phone Number *
                  </label>
                  <input
                    required
                    type="tel"
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                    placeholder="+91 XXXXX XXXXX"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest ml-1">
                  Area of Interest *
                </label>
                <select
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all cursor-pointer"
                  value={formData.subject}
                  onChange={e => setFormData({ ...formData, subject: e.target.value })}
                >
                  <option>B.Sc. Nursing Admissions</option>
                  <option>GNM Diploma Programs</option>
                  <option>International IT & Engineering</option>
                  <option>Allied Health Sciences</option>
                  <option>Other Programs</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-widest ml-1">
                  Your Message *
                </label>
                <textarea
                  required
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  placeholder="Tell us about your educational goals..."
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>

              <p className="text-center text-sm text-gray-500">
                🔒 Your information is secure and confidential
              </p>
            </form>
          </motion.div>

          {/* Map & Additional Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Map Placeholder */}
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl overflow-hidden shadow-lg h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-lg font-semibold text-gray-700">
                  Visit Our Office
                </p>
                <p className="text-gray-600">
                  Kalpetta, Wayanad, Kerala
                </p>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Business Hours
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Monday - Friday</span>
                  <span className="text-gray-600">9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="font-semibold text-gray-700">Saturday</span>
                  <span className="text-gray-600">10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Sunday</span>
                  <span className="text-red-600 font-semibold">Closed</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl p-8 shadow-lg text-white">
              <h3 className="text-2xl font-bold mb-4">
                Connect With Us
              </h3>
              <p className="mb-6 opacity-90">
                Follow us on social media for updates and insights
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl p-4 transition-all hover:scale-110 flex items-center gap-2"
                    title={social.name}
                  >
                    <span className="text-2xl">{social.icon}</span>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
