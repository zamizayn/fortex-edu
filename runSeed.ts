import { collection, addDoc, getDocs, deleteDoc, doc, db } from './firebase.node.js';

// Course data based on user requirements
const courses = [
    {
        title: 'Medical',
        description: 'Embark on a noble journey in medicine. From MBBS to specialized medical programs, prepare to heal and serve humanity with excellence.',
        imageUrl: '/courses/medical.png',
        programs: ['MBBS', 'BDS', 'BAMS', 'BUMS', 'BHMS', 'BSMS', 'BNYS']
    },
    {
        title: 'Allied Science',
        description: 'Explore diverse fields in agriculture, forestry, and dairy technology. Build a rewarding career in sustainable development and specialized science.',
        imageUrl: '/courses/allied science.png',
        programs: ['B.V.Sc & A.H', 'B.Sc Agriculture', 'B.Sc Forestry', 'B.Sc Fisheries', 'B.Sc Horticulture', 'B.Sc Sericulture', 'B.Sc Environmental Science', 'B.Sc Agri Business Management', 'B.Sc Community Science', 'B.Sc Dairy Technology']
    },
    {
        title: 'Paramedical',
        description: 'Join the frontline of healthcare with paramedical programs. Train in nursing, physiotherapy, and advanced medical laboratory technologies.',
        imageUrl: '/courses/paramedical.png',
        programs: ['B.Sc Nursing', 'BPT', 'DPT', 'BOT', 'BASLP', 'B.Sc MLT', 'B.Sc Radiology & Imaging Tech', 'B.Sc Radiotherapy Tech', 'B.Sc Operation Theatre Tech', 'B.Sc Anesthesia Tech', 'B.Sc Cardiac Care Tech', 'B.Sc Cardiovascular Tech', 'B.Sc Perfusion Tech', 'B.Sc Optometry', 'B.Sc Renal Dialysis Tech', 'B.Sc Physician Assistant', 'B.Sc Respiratory Care Tech', 'B.Sc Emergency Medicine Tech', 'B.Sc Nuclear Medicine Tech', 'B.Sc Neurophysiology Tech', 'B.Sc Forensic Science', 'B.Sc Prosthetics & Orthotics', 'B.Sc Clinical Psychology', 'B.Sc Nutrition & Dietetics']
    },
    {
        title: 'Engineering',
        description: 'Build the future with cutting-edge engineering programs. From AI & Data Science to Aerospace and Robotics - choose your path to innovation.',
        imageUrl: '/courses/engineering.png',
        programs: ['Computer Science & Engineering', 'Artificial Intelligence & Machine Learning', 'Data Science', 'Robotics', 'Internet of Things (loT)', 'Information Technology', 'Cyber Security', 'Aeronautical Engineering', 'Aerospace Engineering', 'Marine Engineering', 'Naval Architecture & Shipbuilding', 'Automobile Engineering', 'Mechatronics', 'Chemical Engineering', 'Fire & Safety Engineering', 'Nanotechnology', 'Industrial Engineering', 'Biotechnology', 'Food Technology', 'Dairy Technology', 'Agricultural Engineering', 'Biomedical Engineering', 'Electrical & Electronics Engineering', 'Electrical Engineering', 'Civil Engineering', 'Mechanical Engineering', 'Material Science & Engineering', 'Textile Engineering', 'Petroleum Engineering', 'B.Arch', 'D. Arch', 'B.Plan']
    },
    {
        title: 'Aviation',
        description: 'Pursue your dreams of flying high with comprehensive aviation and maritime programs. Chart your course in the skies or the deep seas.',
        imageUrl: '/courses/aviation.png',
        programs: ['Commercial Pilot License', 'B.Sc Aviation', 'B.Sc Nautical Science', 'BBA / B.Com Aviation Management', 'B.Sc Airport & Airline Management', 'B.Sc Cabin Crew & Hospitality Management', 'B.Sc Aircraft Maintenance Engineering', 'B.Sc Maritime Science', 'B.Sc Ship Building & Repair']
    },
    {
        title: 'Pharmacy',
        description: 'Become a healthcare expert in pharmaceutical sciences. Study drug development, clinical pharmacy, and pharmaceutical management.',
        imageUrl: '/courses/pharmacy.png',
        programs: ['D.Pharm', 'B.Pharm', 'Pharm D']
    },
    {
        title: 'Law',
        description: 'Champion justice with comprehensive legal education. Prepare for a career in litigation or corporate law with specialized integrated LLB programs.',
        imageUrl: '/courses/law.png',
        programs: ['BA LLB', 'BBA LLB', 'B.COM LLB', 'B.Sc LLB']
    },
    {
        title: 'Management',
        description: 'Lead with confidence through business and hotel management programs. Develop strategic thinking and leadership skills for executive success.',
        imageUrl: '/courses/management.png',
        programs: ['Bachelor of Business Administration', 'Bachelor of Management Studies', 'Bachelor of Business Management', 'Bachelor of Hotel Management', 'Bachelor of Event Management', 'BBA With Add On', 'Bachelor of International Business']
    },
    {
        title: 'Commerce',
        description: 'Master the fundamentals of commerce, finance, and accounting. Specialized programs for CA, ACCA, and Actuarial Science aspirants.',
        imageUrl: '/courses/commerse.png',
        programs: ['Bachelor of Commerce', 'B.Com in Accounting & Finance', 'B.Com in Banking & Insurance', 'B.Com in CMA', 'B.Com ACCA', 'B.Com in CA', 'Bachelor of Economics', 'Bachelor of Actuarial Science']
    },
    {
        title: 'Designing',
        description: 'Unleash your creativity with programs in design and media. From Fashion and Interior design to Animation and Film Production.',
        imageUrl: '/courses/designing.png',
        programs: ['B.Des-Fashion, Interior, Graphic Design, Product Design', 'BFA', 'B.Sc Animation & Multimedia', 'B.Sc Film & Television Production', 'B.Sc Visual Communication', 'B.Sc Gaming & VFX']
    },
    {
        title: 'Sports',
        description: 'Turn your passion for fitness into a profession. Explore physical education, sports science, and yoga & naturopathy.',
        imageUrl: '/courses/sports.png',
        programs: ['B.P.Ed (Bachelor of Physical Education)', 'B.Sc Sports Science', 'B.Sc Exercise & Fitness', 'B.Sc Yoga & Naturopathy']
    },
    {
        title: 'General Degree',
        description: 'Pursue a well-rounded education across diverse disciplines in arts and sciences. Critical thinking for a dynamic professional landscape.',
        imageUrl: '/courses/general degree.png',
        programs: ['BCA (ADD-ON)', 'B.Sc Physics', 'B.Sc Chemistry', 'B.Sc Mathematics', 'B.Sc Statistics', 'B.Sc Computer Science', 'B.Sc Electronics', 'B.Sc Biotechnology', 'B.Sc Microbiology', 'B.Sc Biochemistry', 'B.Sc Environmental Science', 'B.Sc Geology', 'B.Sc Geography', 'B.Sc Home Science', 'B.Sc Food Science & Technology', 'B.Sc Marine Science', 'B.Sc Genetics', 'B.A. English Literature', 'B.A. History', 'B.A. Political Science', 'B.A. Economics', 'B.A. Sociology', 'B.A. Psychology', 'B.A. Journalism & Mass Communication', 'B.A. Geography', 'B.A. Music', 'B.A. Dance', 'B.A. Film Studies', 'B.A. Linguistics', 'B.A. Foreign Languages', 'B.A. Tourism & Hospitality Management', 'B.A. International Relations', 'B.A. Visual Arts', 'B.A. Criminology & Criminal Justice']
    }
];

const seedCourses = async () => {
    try {
        console.log('🧹 Clearing existing services...');
        const servicesRef = collection(db, 'services');
        const snapshot = await getDocs(servicesRef);

        for (const docSnap of snapshot.docs) {
            await deleteDoc(doc(db, 'services', docSnap.id));
        }
        console.log(`✓ Cleared ${snapshot.size} existing services.`);

        console.log('\n🌱 Starting course seeding...');
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
