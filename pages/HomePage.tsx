import React from 'react';
import Hero from '../components/Hero';
import Programs from '../components/Programs';
import Admissions from '../components/Admissions';
import SocialFeed from '../components/SocialFeed';
import ConsultationBooking from '../components/ConsultationBooking';
import VideoGallery from '../components/VideoGallery';
import AffiliatedColleges from '../components/AffiliatedColleges';
import Universities from '../components/Universities';
import Events from '../components/Events';
import Team from '../components/Team';
import Services from '../components/Services';
import Reviews from '../components/Reviews';
import { User, SiteSettings } from '../types';

interface HomePageProps {
    user: User | null;
    onLoginClick: () => void;
    siteSettings: SiteSettings | null;
    shouldOpenLogin?: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ user, onLoginClick, siteSettings, shouldOpenLogin }) => {
    const isVisible = (sectionId: string) => siteSettings?.visibleSections?.[sectionId] !== false;

    React.useEffect(() => {
        if (shouldOpenLogin && !user) {
            onLoginClick();
        }
    }, [shouldOpenLogin, user, onLoginClick]);

    return (
        <main>
            {isVisible('hero') && (
                <section id="home">
                    <Hero siteSettings={siteSettings} />
                </section>
            )}

            {isVisible('services') && (
                <Services />
            )}

            {isVisible('team') && (
                <Team members={siteSettings?.teamMembers} />
            )}

            {isVisible('colleges') && (
                <>
                    <AffiliatedColleges user={user} onLoginClick={onLoginClick} siteSettings={siteSettings} />
                </>
            )}

            {isVisible('universities') && <Universities />}

            {isVisible('programs') && <Programs />}

            {isVisible('reviews') && <Reviews />}

            {/* {isVisible('booking') && <ConsultationBooking />} */}

            {isVisible('media') && <VideoGallery />}

            {/* {isVisible('admissions') && <Admissions siteSettings={siteSettings} />} */}
            {/* {isVisible('social') && <SocialFeed siteSettings={siteSettings} />} */}
            {isVisible('events') && <Events />}
        </main>
    );
};

export default HomePage;
