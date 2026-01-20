import React, { useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, db } from '../firebase';
import { Service } from '../types';

const ConsultationBooking: React.FC = () => {
  const [isBooked, setIsBooked] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    date: '',
    time: '',
    course: '',
    lastAttendedCourse: '',
    percentage: ''
  });

  React.useEffect(() => {
    const fetchServices = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'services'));
        const fetchedServices = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Service));
        setServices(fetchedServices);
        if (fetchedServices.length > 0) {
          setFormData(prev => ({ ...prev, course: fetchedServices[0].title }));
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      }
    };
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'consultations'), {
        name: formData.name,
        phone: formData.phone,
        date: formData.date,
        interest: formData.course,
        lastAttendedCourse: formData.lastAttendedCourse,
        percentage: formData.percentage,
        createdAt: serverTimestamp()
      });
      setIsBooked(true);
      setTimeout(() => setIsBooked(false), 5000);
      setFormData(prev => ({ ...prev, name: '', phone: '', date: '', lastAttendedCourse: '', percentage: '' }));
    } catch (error) {
      console.error("Error booking consultation:", error);
      alert("Failed to book consultation. Please try again.");
    }
  };

  return (
    <section id="booking" className="py-8 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="bg-charcoal rounded-[3rem] overflow-hidden shadow-3xl relative animate-in fade-in slide-in-from-bottom duration-1000">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-[120px]"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-[120px]"></div>

          <div className="relative grid lg:grid-cols-2 gap-20 items-center p-6 md:p-24 overflow-hidden">
            <div className="text-white space-y-10">
              <div className="space-y-4">
                <span className="inline-block py-2 px-6 rounded-full bg-white/5 border border-white/10 text-accent text-[10px] font-medium uppercase tracking-[0.3em]">
                  Priority Access
                </span>
                <h2 className="text-5xl md:text-7xl font-semibold leading-tight tracking-tight text-balance">
                  Master Your <br /> Global Path.
                </h2>
              </div>

              <p className="text-white/50 text-xl font-medium max-w-sm leading-relaxed">
                Secure an exclusive session with our leading strategists to curate your educational roadmap.
              </p>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all duration-500">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-white tracking-tight">Elite Strategic Guidance</p>
                    <p className="text-sm text-white/30 font-normal">Personalized 1:1 sessions with industry veterans.</p>
                  </div>
                </div>
                <div className="flex items-center gap-6 group">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-accent group-hover:border-accent transition-all duration-500">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="space-y-1">
                    <p className="font-medium text-white tracking-tight">Verification Assistance</p>
                    <p className="text-sm text-white/30 font-normal">Concierge-level support for global credentials.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 md:p-12 shadow-3xl">
              {isBooked ? (
                <div className="py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h4 className="text-3xl font-semibold text-charcoal tracking-tight">Strategy Confirmed</h4>
                  <p className="text-charcoal/40 font-medium uppercase tracking-widest text-[10px]">Our office will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
                  <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Full Name</label>
                      <input
                        required
                        type="text"
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all"
                        placeholder="Jane Doe"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Mobile Number</label>
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

                  <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Last Exam</label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all"
                        placeholder="e.g. Plus Two"
                        value={formData.lastAttendedCourse}
                        onChange={e => setFormData({ ...formData, lastAttendedCourse: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Percentage</label>
                      <input
                        type="text"
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all"
                        placeholder="e.g. 90%"
                        value={formData.percentage}
                        onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Preferred Date</label>
                      <input
                        required
                        type="date"
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5 md:space-y-3">
                      <label className="text-[10px] font-medium text-charcoal/40 uppercase tracking-widest ml-1">Aspiration</label>
                      <select
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-charcoal font-medium focus:ring-2 focus:ring-accent transition-all appearance-none cursor-pointer"
                        value={formData.course}
                        onChange={e => setFormData({ ...formData, course: e.target.value })}
                      >
                        <option value="" disabled>Select Pathway</option>
                        {services.map(service => (
                          <option key={service.id} value={service.title}>{service.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-charcoal text-white font-semibold py-6 rounded-2xl shadow-3xl hover:bg-black transition-all mt-4 transform active:scale-[0.98]"
                  >
                    Reserve Exclusive Slot
                  </button>
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <p className="text-[9px] text-charcoal/30 font-medium uppercase tracking-widest">Counselors currently active</p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ConsultationBooking;
