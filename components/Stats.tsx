import React, { useEffect, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';

const Counter: React.FC<{ from?: number; to: number; duration?: number; decimals?: number }> = ({ from = 0, to, duration = 2, decimals = 0 }) => {
    const nodeRef = useRef<HTMLSpanElement>(null);
    const inView = useInView(nodeRef, { once: true, amount: 0.1 });

    useEffect(() => {
        if (inView) {
            const node = nodeRef.current;
            if (node) {
                // Small timeout to ensure stability on mobile
                const timeout = setTimeout(() => {
                    const controls = animate(from, to, {
                        duration: duration,
                        onUpdate(value) {
                            node.textContent = value.toFixed(decimals);
                        },
                        ease: "easeOut",
                    });
                }, 100);
                return () => clearTimeout(timeout);
            }
        }
    }, [from, to, duration, decimals, inView]);

    return <span ref={nodeRef}>{from.toFixed(decimals)}</span>;
};

const Stats: React.FC = () => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-20">
            {/* Stat 1 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="bg-gray-50/50 rounded-2xl p-6 md:p-8 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100"
            >
                <div className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2">
                    <Counter to={2.3} decimals={1} />K+
                </div>
                <div className="text-sm md:text-base text-gray-500 font-medium">
                    Courses
                </div>
            </motion.div>

            {/* Stat 2 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="bg-gray-50/50 rounded-2xl p-6 md:p-8 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100"
            >
                <div className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2">
                    <Counter to={100} />%
                </div>
                <div className="text-sm md:text-base text-gray-500 font-medium">
                    Satisfaction Rate
                </div>
            </motion.div>

            {/* Stat 3 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="bg-gray-50/50 rounded-2xl p-6 md:p-8 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100"
            >
                <div className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2">
                    <Counter to={5.9} decimals={1} />K+
                </div>
                <div className="text-sm md:text-base text-gray-500 font-medium">
                    Enrolled Students
                </div>
            </motion.div>

            {/* Stat 4 */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="bg-gray-50/50 rounded-2xl p-6 md:p-8 hover:bg-white hover:shadow-lg transition-all border border-transparent hover:border-gray-100"
            >
                <div className="text-3xl md:text-5xl font-semibold text-gray-900 mb-2">
                    <Counter to={100} />+
                </div>
                <div className="text-sm md:text-base text-gray-500 font-medium">
                    Affiliated Universities
                </div>
            </motion.div>

        </div>
    );
};

export default Stats;
