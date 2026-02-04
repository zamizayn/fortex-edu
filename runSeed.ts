import { collection, addDoc, getDocs, db } from './firebase.node.js';

// Course data based on images in /public/courses/
const courses = [
    {
        title: 'Allied Science',
        description: 'Explore diverse fields in allied health sciences including laboratory technology, radiology, and medical imaging. Build a rewarding career in healthcare support services.',
        imageUrl: '/courses/allied science.png'
    },
    {
        title: 'Aviation',
        description: 'Pursue your dreams of flying high with comprehensive aviation programs. From pilot training to aviation management, chart your course in the skies.',
        imageUrl: '/courses/aviation.png'
    },
    {
        title: 'Commerce',
        description: 'Master the fundamentals of business, accounting, and finance. Develop skills in economics, taxation, and corporate management for a successful business career.',
        imageUrl: '/courses/commerse.png'
    },
    {
        title: 'Designing',
        description: 'Unleash your creativity with programs in graphic design, fashion design, interior design, and more. Transform your artistic vision into a professional career.',
        imageUrl: '/courses/designing.png'
    },
    {
        title: 'Engineering',
        description: 'Build the future with cutting-edge engineering programs. From civil to computer science, mechanical to electrical - choose your path to innovation.',
        imageUrl: '/courses/engineering.png'
    },
    {
        title: 'General Degree',
        description: 'Pursue a well-rounded education with general degree programs in arts, science, and humanities. Develop critical thinking and diverse knowledge across disciplines.',
        imageUrl: '/courses/general degree.png'
    },
    {
        title: 'Law',
        description: 'Champion justice with comprehensive legal education. Prepare for a career in litigation, corporate law, or judicial services with expert guidance.',
        imageUrl: '/courses/law.png'
    },
    {
        title: 'Management',
        description: 'Lead with confidence through MBA and management programs. Develop strategic thinking, leadership skills, and business acumen for executive success.',
        imageUrl: '/courses/management.png'
    },
    {
        title: 'Medical',
        description: 'Embark on a noble journey in medicine. From MBBS to specialized medical programs, prepare to heal and serve humanity with excellence.',
        imageUrl: '/courses/medical.png'
    },
    {
        title: 'Paramedical',
        description: 'Join the frontline of healthcare with paramedical programs. Train in emergency medical services, nursing, and critical care support.',
        imageUrl: '/courses/paramedical.png'
    },
    {
        title: 'Pharmacy',
        description: 'Become a healthcare expert in pharmaceutical sciences. Study drug development, clinical pharmacy, and pharmaceutical management.',
        imageUrl: '/courses/pharmacy.png'
    },
    {
        title: 'Sports',
        description: 'Turn your passion for sports into a profession. Explore sports management, physical education, and sports science programs.',
        imageUrl: '/courses/sports.png'
    }
];

const seedCourses = async () => {
    try {
        console.log('Starting course seeding...');

        // Check if courses already exist
        const servicesRef = collection(db, 'services');
        const snapshot = await getDocs(servicesRef);

        if (snapshot.size > 0) {
            console.log(`Found ${snapshot.size} existing services. Skipping seeding to avoid duplicates.`);
            console.log('If you want to re-seed, please delete existing services first.');
            return;
        }

        // Add all courses
        for (const course of courses) {
            await addDoc(servicesRef, course);
            console.log(`✓ Added: ${course.title}`);
        }

        console.log(`\n✅ Successfully seeded ${courses.length} courses!`);
    } catch (error) {
        console.error('❌ Error seeding courses:', error);
        throw error;
    }
};

// Run the seeding function
seedCourses()
    .then(() => {
        console.log('\nSeeding completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\nSeeding failed:', error);
        process.exit(1);
    });
