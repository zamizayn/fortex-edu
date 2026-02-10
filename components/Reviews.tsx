import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Review } from '../types';
import { motion } from 'framer-motion';

const Reviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'), limit(10));
                const snapshot = await getDocs(q);
                const reviewData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Review[];
                setReviews(reviewData);
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReviews();
    }, []);

    useEffect(() => {
        if (reviews.length === 0) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % reviews.length);
        }, 5000);

        return () => clearInterval(timer);
    }, [reviews.length]);

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    if (loading) return null;
    if (reviews.length === 0) return null;

    return (
        <section id="reviews" className="py-20 bg-white relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute top-1/2 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="inline-block px-4 py-1.5 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm mb-4"
                    >
                        Success Stories
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-3xl md:text-5xl font-bold text-gray-900 mb-6"
                    >
                        What Our Students Say
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-gray-600 max-w-2xl mx-auto"
                    >
                        Real stories from learners who achieved their goals with Fortex.
                    </motion.p>
                </div>

                <div className="relative max-w-5xl mx-auto px-12">
                    {/* Navigation Buttons */}
                    <button
                        onClick={prev}
                        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg text-gray-400 hover:text-blue-600 hover:shadow-xl transition-all border border-gray-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-lg text-gray-400 hover:text-blue-600 hover:shadow-xl transition-all border border-gray-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    <div className="overflow-hidden">
                        <motion.div
                            animate={{ x: `-${currentIndex * 100}%` }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="flex"
                        >
                            {reviews.map((review) => (
                                <div key={review.id} className="w-full flex-shrink-0 px-4">
                                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100 relative h-full">
                                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                                            <div className="w-24 h-24 rounded-2xl bg-blue-50 overflow-hidden flex-shrink-0 border-4 border-white shadow-md">
                                                {review.imageUrl ? (
                                                    <img src={review.imageUrl} alt={review.studentName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-3xl">
                                                        {review.studentName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-center md:justify-start mb-4">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg key={i} className={`w-5 h-5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                </div>
                                                <p className="text-xl md:text-2xl text-gray-700 italic font-medium leading-relaxed mb-8">
                                                    "{review.content}"
                                                </p>
                                                <div>
                                                    <h3 className="font-bold text-xl text-gray-900 mb-1">{review.studentName}</h3>
                                                    <p className="text-blue-600 font-semibold">{review.program}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <svg className="absolute bottom-8 right-12 w-16 h-16 text-blue-50 opacity-20 pointer-events-none" fill="currentColor" viewBox="0 0 32 32">
                                            <path d="M10 8v8h6v-8h-6zm12 0v8h6v-8h-6zM10 24v-6h6v6h-6zm12 0v-6h6v6h-6z"></path>
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Dots */}
                    <div className="flex justify-center gap-2 mt-8">
                        {reviews.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentIndex(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === idx ? 'bg-blue-600 w-8' : 'bg-gray-300 hover:bg-gray-400'}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Reviews;
