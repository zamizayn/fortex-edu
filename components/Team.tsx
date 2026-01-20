
import React from 'react';
import { motion } from 'framer-motion';
import { Linkedin, Twitter, Instagram } from 'lucide-react';

interface TeamMember {
    id: string;
    name: string;
    role: string;
    image: string;
    bio: string;
    socials: {
        linkedin?: string;
        twitter?: string;
        instagram?: string;
    };
}

const DEFAULT_MEMBERS: TeamMember[] = [
    {
        id: '1',
        name: 'Sarah Johnson',
        role: 'Co-Founder & Director',
        image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Pioneering innovative education paths for over 15 years.',
        socials: {
            linkedin: '#',
            twitter: '#',
            instagram: '#'
        }
    },
    {
        id: '2',
        name: 'Dr. Michael Chen',
        role: 'Head of Admissions',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Dedicated to helping students find their perfect academic fit.',
        socials: {
            linkedin: '#',
            twitter: '#'
        }
    },
    {
        id: '3',
        name: 'Emma Williams',
        role: 'Senior Career Counselor',
        image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Expert in global career trends and professional development.',
        socials: {
            linkedin: '#',
            instagram: '#'
        }
    },
    {
        id: '4',
        name: 'David Rodriguez',
        role: 'Student Support Manager',
        image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400&h=400',
        bio: 'Ensuring every student has a smooth and successful journey.',
        socials: {
            linkedin: '#',
            twitter: '#'
        }
    }
];

const Team: React.FC<{ members?: TeamMember[] }> = ({ members = DEFAULT_MEMBERS }) => {
    return (
        <section id="team" className="py-8 md:py-24 bg-white relative overflow-hidden">
            {/* Decorative Blobs */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center mb-16">
                    <motion.span
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-blue-600 font-semibold tracking-wider uppercase text-sm"
                    >
                        Experts Behind Fortex
                    </motion.span>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold mt-3 text-gray-900"
                    >
                        Meet Our Team
                    </motion.h2>
                    <motion.div
                        initial={{ scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="h-1 w-24 bg-blue-600 mx-auto mt-6 rounded-full origin-center"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {members.map((member, index) => (
                        <motion.div
                            key={member.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            className="group"
                        >
                            <div className="relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 flex flex-col h-full">
                                {/* Image Container with Overlay */}
                                <div className="relative h-64 overflow-hidden">
                                    <motion.img
                                        src={member.image}
                                        alt={member.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-4">
                                        {member.socials.linkedin && (
                                            <motion.a
                                                whileHover={{ y: -3 }}
                                                href={member.socials.linkedin}
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-blue-600 transition-colors"
                                            >
                                                <Linkedin size={20} />
                                            </motion.a>
                                        )}
                                        {member.socials.twitter && (
                                            <motion.a
                                                whileHover={{ y: -3 }}
                                                href={member.socials.twitter}
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-sky-500 transition-colors"
                                            >
                                                <Twitter size={20} />
                                            </motion.a>
                                        )}
                                        {member.socials.instagram && (
                                            <motion.a
                                                whileHover={{ y: -3 }}
                                                href={member.socials.instagram}
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-pink-500 transition-colors"
                                            >
                                                <Instagram size={20} />
                                            </motion.a>
                                        )}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-grow flex flex-col items-center text-center">
                                    <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                        {member.name}
                                    </h3>
                                    <p className="text-blue-600 font-medium text-sm mb-4">
                                        {member.role}
                                    </p>
                                    <p className="text-gray-600 text-sm italic">
                                        "{member.bio}"
                                    </p>
                                </div>

                                {/* Bottom Bar Gradient on Hover */}
                                <div className="h-1.5 w-full bg-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all duration-500" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;
