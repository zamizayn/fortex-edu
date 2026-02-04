import React from 'react';
import About from '../components/About';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { User, SiteSettings } from '../types';

interface AboutPageProps {
    user: User | null;
    onLogout: () => void;
    onLoginClick: () => void;
    siteSettings: SiteSettings | null;
}

const AboutPage: React.FC<AboutPageProps> = ({ user, onLogout, onLoginClick, siteSettings }) => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar
                activeSection="about"
                user={user}
                onLogout={onLogout}
                onLoginClick={onLoginClick}
                siteSettings={siteSettings}
            />
            <div>
                <About />
            </div>
            <Footer />
        </div>
    );
};

export default AboutPage;
