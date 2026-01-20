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
    <footer className="bg-charcoal text-white  border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">


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
