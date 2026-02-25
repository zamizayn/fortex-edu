import React from 'react';
import { motion } from 'framer-motion';

const Services: React.FC = () => {
    const services = [
        {
            title: 'Personalized Counseling',
            description: 'Every student is unique, and so are their career aspirations. Our one-on-one counseling sessions help us understand your strengths, interests, and long-term goals. We provide tailored recommendations to guide you toward the best academic and career choices that align with your future ambitions.',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            color: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'University & College Selection',
            description: 'Choosing the right institution is crucial for academic and career growth. Based on your academic profile, preferences, and aspirations, we carefully map you to top universities and colleges across India, ensuring that you enroll in a program that maximizes your potential.',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            color: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'Seamless Application & Documentation Assistance',
            description: "The admission process can be overwhelming, but with Fortex, you don't have to worry! Our experts assist you in preparing, reviewing, and submitting all necessary documents, ensuring an error-free and hassle-free application experience.",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            color: 'bg-green-50 text-green-600'
        },
        {
            title: 'Scholarship & Financial Aid Guidance',
            description: 'Higher education is a valuable investment, and we strive to make it accessible. Our team provides in-depth guidance on scholarships, grants, and financial aid options, helping students secure funding and minimize educational expenses.',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            color: 'bg-amber-50 text-amber-600'
        },
        {
            title: 'Admission & Enrollment Support',
            description: 'From securing admissions to completing the enrollment process, we walk with you every step of the way. Our dedicated team ensures that you meet deadlines, submit all required paperwork, and smoothly transition into your chosen institution.',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
            ),
            color: 'bg-red-50 text-red-600'
        },
        {
            title: 'Scholarship',
            description: 'Unlock your potential with our dedicated scholarship assistance. We guide you through finding and applying for scholarships that match your academic achievements, minimizing your financial burden and empowering your education.',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
            ),
            color: 'bg-teal-50 text-teal-600'
        }
    ];

    return (
        <section id="services" className="py-24 bg-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[500px] h-[500px] bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-purple-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="container mx-auto px-6 relative z-10">
                <div className="grid lg:grid-cols-12 gap-12 items-start">
                    {/* Left Column: Content */}
                    <div className="lg:col-span-5 lg:sticky lg:top-24">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="text-left"
                        >
                            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-4 inline-block px-4 py-2 bg-blue-50 rounded-full">
                                Our Services
                            </h2>
                            <h3 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
                                Comprehensive Support for Your Academic Journey
                            </h3>
                            <p className="text-lg text-gray-600 leading-relaxed mb-8">
                                At Fortex Education Consultancy, we believe that choosing the right educational path is a life-changing decision. Our expert guidance ensures that students not only find the best universities in India but also receive personalized support at every step of their admission journey.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <a href="#contact" className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl">
                                    Get Started
                                </a>
                                <a href="#about" className="px-8 py-3 bg-white text-gray-700 font-semibold rounded-full border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
                                    Learn More
                                </a>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: Services Grid */}
                    <div className="lg:col-span-7">
                        <div className="grid md:grid-cols-2 gap-6">
                            {services.map((service, index) => (
                                <motion.div
                                    key={service.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transition-all duration-300 group"
                                >
                                    <div className={`w-14 h-14 rounded-xl ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                        {React.cloneElement(service.icon as React.ReactElement, { className: "w-6 h-6" })}
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                                        {service.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {service.description}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Services;
