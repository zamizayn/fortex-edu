import React, { useEffect, useState } from 'react';
import { getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';
import { db, collection, addDoc, serverTimestamp } from '../firebase';

const Contact: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    subject: 'B.Sc. Nursing Admissions',
    message: ''
  });
  const [loading, setLoading] = useState(false);

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
      alert("Inquiry sent successfully!");
      setFormData({ name: '', phone: '', subject: 'B.Sc. Nursing Admissions', message: '' });
    } catch (error) {
      console.error("Error sending inquiry:", error);
      alert("Failed to send inquiry.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="contact" className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-32 bg-gray-900 text-white">
      <div className="grid lg:grid-cols-2 gap-12 md:gap-32 items-start">
        {/* Left Side: Info */}
        <div className="space-y-6 md:space-y-16">
          <div className="space-y-6">
            <p className="text-xs font-medium text-accent uppercase tracking-[0.3em]">Reach Out</p>
            <h2 className="text-5xl md:text-7xl font-semibold text-white leading-tight tracking-tight text-balance">
              Let's Chart <br /> Your Career.
            </h2>
            <p className="text-xl text-white/50 font-normal max-w-sm leading-relaxed">
              Our specialists are ready to help you navigate the complexities of global admissions.
            </p>
          </div>

          <div className="space-y-12">
            <div className="space-y-12">
              <div className="space-y-4">
                <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">General Enquiries</p>
                <div className="space-y-2">
                  <p className="text-xl font-medium text-white">{settings?.contactPhone || '+91 70253 37762'}</p>
                  <p className="text-xl font-medium text-white">{settings?.contactEmail || 'info@fortex.edu'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">HQ Location</p>
                <p className="text-xl font-medium text-white leading-tight">
                  Kalpetta, Wayanad <br />
                  Kerala — 673121
                </p>
              </div>
            </div>

            <div className="pt-12 border-t border-white/5 flex gap-8">
              {['Instagram', 'LinkedIn', 'Facebook'].map(social => (
                <a key={social} href="#" className="text-xs font-medium text-white hover:text-accent transition-colors tracking-widest uppercase">{social}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="bg-white rounded-[3rem] p-12 md:p-16 shadow-3xl">
          <h3 className="text-3xl font-semibold text-charcoal mb-10">Start a Conversation.</h3>
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Your Name</label>
                <input
                  required
                  type="text"
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Phone Number</label>
                <input
                  required
                  type="tel"
                  className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all"
                  placeholder="+91"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Area of Interest</label>
              <select
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
              >
                <option>B.Sc. Nursing Admissions</option>
                <option>GNM Diploma Programs</option>
                <option>International IT & Eng</option>
                <option>Allied Health Sciences</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">How can we help?</label>
              <textarea
                required
                rows={4}
                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all resize-none"
                placeholder="Tell us about your dreams..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-charcoal text-white font-medium py-6 rounded-2xl shadow-2xl shadow-black/10 hover:bg-black transition-all transform active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? 'Sending Enquiry...' : 'Send Inquiry'}
            </button>
            <p className="text-center text-[10px] text-charcoal/30 font-medium uppercase tracking-widest">
              Secured by Fortex Privacy Protocols
            </p>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
