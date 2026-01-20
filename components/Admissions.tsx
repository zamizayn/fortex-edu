
import React from 'react';

const Admissions: React.FC = () => {
  const steps = [
    { title: 'Personal Consultation', desc: 'Engage with our senior consultants to map your educational potential and career goals.' },
    { title: 'Strategic Selection', desc: 'Narrow down the finest institutions that align with your aspirations and financial planning.' },
    { title: 'Portfolio Curation', desc: 'We assist in meticulously preparing your academic dossiers and necessary certifications.' },
    { title: 'Direct Enrollment', desc: 'Navigate the final enrollment phase with direct support from our institutional liasons.' },
  ];

  return (
    <section id="admissions" className="max-w-7xl mx-auto px-6 lg:px-12 py-12 md:py-32 bg-white">
      <div className="grid lg:grid-cols-2 gap-12 md:gap-32 items-start">
        <div className="space-y-12">
          <div className="space-y-4">
            <p className="text-[10px] font-medium text-accent uppercase tracking-[0.3em]">Pathway to Success</p>
            <h2 className="text-5xl font-semibold text-charcoal tracking-tight leading-tight">Your Journey, <br /> Orchestrated.</h2>
          </div>

          <div className="space-y-12">
            {steps.map((step, idx) => (
              <div key={idx} className="group flex gap-8">
                <div className="flex-shrink-0 w-12 h-12 bg-gray-50 text-charcoal/20 group-hover:bg-accent group-hover:text-white rounded-2xl flex items-center justify-center font-semibold text-lg transition-all border border-black/5">
                  {(idx + 1).toString().padStart(2, '0')}
                </div>
                <div>
                  <h4 className="font-semibold text-xl text-charcoal mb-2 group-hover:text-accent transition-colors">{step.title}</h4>
                  <p className="text-charcoal/50 font-normal leading-relaxed max-w-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-12 relative animate-in slide-in-from-right duration-1000">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />

          <div className="bg-charcoal rounded-[3rem] p-12 text-white shadow-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8">
              <div className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.588-5.946 0-6.56 5.338-11.891 11.905-11.891 3.181 0 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.481 8.414 0 6.561-5.338 11.892-11.906 11.892-2.003 0-3.974-.505-5.717-1.464l-6.275 1.67zm5.95-3.854l.437.26c1.42.842 3.056 1.286 4.73 1.286 5.093 0 9.237-4.143 9.237-9.237 0-2.466-.961-4.784-2.706-6.531-1.744-1.744-4.062-2.705-6.528-2.705-5.094 0-9.237 4.144-9.237 9.237 0 1.933.606 3.824 1.751 5.421l.241.336-1.003 3.662 3.798-1h-.02zm9.845-6.72c-.273-.136-1.615-.797-1.865-.89-.25-.091-.432-.136-.614.137-.182.273-.705.89-.864 1.072-.159.182-.318.204-.591.068-.273-.136-1.15-.424-2.191-1.353-.81-.722-1.355-1.614-1.514-1.886-.159-.182.012-.284.15-.422.124-.124.273-.318.409-.477l.136-.205c.136-.145.204-.25.3-.409.092-.159.045-.296-.023-.432-.068-.136-.614-1.477-.841-2.023-.222-.54-.443-.466-.614-.475l-.523-.009c-.182 0-.477.068-.727.341-.25.273-.955.932-.955 2.273 0 1.341.977 2.636 1.114 2.818.136.182 1.92 2.932 4.653 4.114.65.28 1.157.447 1.55.574.653.208 1.248.178 1.717.108.523-.078 1.614-.66 1.841-1.296.227-.636.227-1.182.159-1.296-.068-.114-.25-.182-.523-.318z" /></svg>
              </div>
            </div>
            <p className="text-[10px] font-medium text-accent uppercase tracking-widest mb-4">Fortex Learning Hub</p>
            <h4 className="text-3xl font-semibold mb-6 leading-tight">Elevate Your Knowledge. <br /> On WhatsApp.</h4>
            <p className="mb-10 text-white/50 font-normal leading-relaxed">
              Join our exclusive learning circles for real-time updates on nursing, allied health, and global educational trends.
            </p>
            <button className="w-full bg-accent text-white font-medium py-5 rounded-2xl shadow-2xl shadow-accent/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
              Join the Circle
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </button>
          </div>

          <div className="relative rounded-[3rem] overflow-hidden shadow-2xl group">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop"
              alt="Global Scholars"
              className="w-full h-80 object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
            />
            <div className="absolute inset-0 bg-accent/10 pointer-events-none" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Admissions;
