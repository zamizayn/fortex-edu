import React, { useEffect, useState, useRef, useCallback } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Review } from '../types';
import { motion } from 'framer-motion';

const Reviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);
    const isPaused = useRef(false);
    const scrollPosition = useRef(0);

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

    // Duplicate reviews for seamless infinite scroll
    const displayReviews = reviews.length > 0 ? [...reviews, ...reviews] : [];

    const animate = useCallback(() => {
        if (!scrollRef.current || isPaused.current) {
            animationRef.current = requestAnimationFrame(animate);
            return;
        }

        scrollPosition.current += 0.5; // speed in px per frame

        const container = scrollRef.current;
        const halfWidth = container.scrollWidth / 2;

        // Reset seamlessly when we've scrolled past the first set
        if (scrollPosition.current >= halfWidth) {
            scrollPosition.current = 0;
        }

        container.scrollLeft = scrollPosition.current;
        animationRef.current = requestAnimationFrame(animate);
    }, []);

    useEffect(() => {
        if (reviews.length === 0) return;

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [reviews.length, animate]);

    const handleMouseEnter = () => {
        isPaused.current = true;
    };

    const handleMouseLeave = () => {
        isPaused.current = false;
        // Sync scroll position when resuming
        if (scrollRef.current) {
            scrollPosition.current = scrollRef.current.scrollLeft;
        }
    };

    if (loading) return null;
    if (reviews.length === 0) return null;

    return (
        <section id="reviews" className="py-14 bg-white relative overflow-hidden">
            {/* Decorative Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-60"></div>
                <div className="absolute top-1/2 right-0 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-60"></div>
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-10">

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-2xl md:text-4xl font-bold text-gray-900 mb-3"
                    >
                        What Our Students Say
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="text-base text-gray-600 max-w-xl mx-auto"
                    >
                        Real stories from learners who achieved their goals with Fortex.
                    </motion.p>
                </div>
            </div>

            {/* Horizontal scrolling list – full width, no container constraint */}
            <div className="relative">
                {/* Fade edges */}
                <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
                <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

                <div
                    ref={scrollRef}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    className="flex gap-5 overflow-x-hidden px-4 py-2"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {displayReviews.map((review, index) => (
                        <div
                            key={`${review.id}-${index}`}
                            className="flex-shrink-0 w-80 bg-white rounded-2xl p-5 shadow-md border border-gray-100 hover:shadow-lg transition-shadow duration-300 cursor-default"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-11 h-11 rounded-xl bg-blue-50 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                                    {review.imageUrl ? (
                                        <img src={review.imageUrl} alt={review.studentName} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                            {review.studentName.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-sm text-gray-900 truncate">{review.studentName}</h3>
                                    <p className="text-blue-600 text-xs font-medium truncate">{review.program}</p>
                                </div>
                            </div>

                            <div className="flex mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <svg key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                ))}
                            </div>

                            <p className="text-sm text-gray-600 italic leading-relaxed line-clamp-3">
                                "{review.content}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Reviews;
