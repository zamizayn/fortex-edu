import React, { useEffect, useState } from 'react';
import { getSiteSettings } from '../services/db';
import { SiteSettings } from '../types';

const Footer: React.FC = () => {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSiteSettings();
      if (data) setSettings(data);
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-charcoal text-white py-24 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid md:grid-cols-4 gap-12 items-start">
          <div className="md:col-span-2 space-y-8">
            <h4 className="text-2xl font-semibold tracking-tight">FORTEXEDU</h4>
            <p className="text-white/40 text-sm font-normal leading-relaxed max-w-sm">
              Global education consultancy dedicated to guiding the next generation of leaders towards excellence in healthcare and technology.
            </p>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Connect</p>
            <div className="flex flex-col gap-3">
              <a href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Instagram</a>
              <a href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-sm font-medium text-white/60 hover:text-white transition-colors">Facebook</a>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest">Contact</p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-white/60">{settings?.contactEmail || 'info@fortex.edu'}</p>
              <p className="text-sm font-medium text-white/60">{settings?.contactPhone || '+91 70253 37762'}</p>
            </div>
          </div>
        </div>

        <div className="mt-32 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-medium text-white/20 uppercase tracking-widest">
            © {new Date().getFullYear()} Fortex Education Consultancy.
          </p>
          <div className="flex gap-8">
            <a href="#" className="text-[10px] font-medium text-white/20 uppercase tracking-widest hover:text-white transition-all">Privacy Policy</a>
            <a href="#" className="text-[10px] font-medium text-white/20 uppercase tracking-widest hover:text-white transition-all">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
