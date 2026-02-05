import React from 'react';
import Contact from '../components/Contact';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, SiteSettings } from '../types';

interface ContactPageProps {
    user: User | null;
    onLogout: () => void;
    onLoginClick: () => void;
    siteSettings: SiteSettings | null;
}

const ContactPage: React.FC<ContactPageProps> = ({ user, onLogout, onLoginClick, siteSettings }) => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar
                activeSection="contact"
                user={user}
                onLogout={onLogout}
                onLoginClick={onLoginClick}
                siteSettings={siteSettings}
            />
            <div>
                <Contact />
            </div>
            <Footer siteSettings={siteSettings} />
        </div>
    );
};

export default ContactPage;
