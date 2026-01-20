
import { db, doc, setDoc, getDoc, collection, query, where, getDocs, serverTimestamp, auth, addDoc } from '../firebase';
import { User } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

// Collection References
const USERS_COLLECTION = 'users'; // For Admins
const STUDENTS_COLLECTION = 'students'; // For Students
const LEADS_COLLECTION = 'leads'; // For Leads

// ... existing code ...

// Lead: Save a new lead
export const saveLead = async (
    student: User,
    targetId: string,
    targetName: string,
    type: 'college' | 'university',
    details: { location: string; course: string; percentage: string; phone: string }
) => {
    try {
        const q = query(
            collection(db, LEADS_COLLECTION),
            where('studentId', '==', student.id),
            where(type === 'college' ? 'collegeId' : 'universityId', '==', targetId)
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            const leadData: any = {
                studentId: student.id,
                studentName: student.name,
                studentEmail: student.email,
                studentPicture: student.picture,
                type: type,
                createdAt: serverTimestamp(),
                studentLocation: details.location,
                lastAttendedCourse: details.course,
                percentage: details.percentage,
                studentPhone: details.phone
            };

            if (type === 'college') {
                leadData.collegeId = targetId;
                leadData.collegeName = targetName;
            } else {
                leadData.universityId = targetId;
                leadData.universityName = targetName;
            }

            await addDoc(collection(db, LEADS_COLLECTION), leadData);
            console.log('Lead saved successfully');
        }
    } catch (error) {
        console.error('Error saving lead:', error);
        throw error;
    }
};

// Admin: Seed the admin user if it doesn't exist
export const seedAdminUser = async () => {
    try {
        const adminQuery = query(collection(db, USERS_COLLECTION), where('username', '==', 'admin'));
        const snapshot = await getDocs(adminQuery);

        if (snapshot.empty) {
            // Create default admin
            await setDoc(doc(db, USERS_COLLECTION, 'admin_User'), {
                username: 'admin',
                password: 'admin', // Storing plain text as requested by user - NOT RECOMMENDED for production
                role: 'admin',
                name: 'Super Admin',
                createdAt: serverTimestamp()
            });
            console.log('Admin user seeded successfully');
        }
    } catch (error) {
        console.error('Error seeding admin user:', error);
    }
};

// Admin: Verify Credentials
export const verifyAdminCredentials = async (username: string, password: string): Promise<User | null> => {
    try {
        const q = query(
            collection(db, USERS_COLLECTION),
            where('username', '==', username),
            where('password', '==', password)
        );

        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const adminDoc = snapshot.docs[0].data();
            return {
                id: snapshot.docs[0].id,
                name: adminDoc.name || 'Admin',
                email: 'admin@fortex.edu', // Placeholder
                role: 'admin',
                picture: 'https://ui-avatars.com/api/?name=Admin&background=0D8ABC&color=fff'
            };
        }
        return null;
    } catch (error) {
        console.error('Error verifying admin:', error);
        throw error;
    }
};

// Student: Save Details on Login
export const saveStudentDetails = async (firebaseUser: FirebaseUser): Promise<User> => {
    const studentRef = doc(db, STUDENTS_COLLECTION, firebaseUser.uid);

    const studentData = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'Student',
        email: firebaseUser.email || '',
        picture: firebaseUser.photoURL || undefined,
        role: 'student' as const,
        lastLogin: serverTimestamp(),
        // We use merge: true so we don't overwrite existing profile data (like phone, grade, etc if added later)
        // but we ensure core identity info is up to date
    };

    try {
        // Check if user exists to preserve 'createdAt' if you wanted, but merge handles updates well.
        // We want to ensure the document exists.
        await setDoc(studentRef, studentData, { merge: true });

        // Return the application User type
        return {
            id: studentData.id,
            name: studentData.name,
            email: studentData.email,
            picture: studentData.picture,
            role: 'student'
        };
    } catch (error) {
        console.error('Error saving student details:', error);
        throw error;
    }
};

// Site Settings
export const getSiteSettings = async () => {
    try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data() as any;
        }
        return null;
    } catch (error) {
        console.error("Error fetching settings:", error);
        return null;
    }
};

export const saveSiteSettings = async (settings: any) => {
    try {
        await setDoc(doc(db, 'settings', 'general'), settings, { merge: true });
    } catch (error) {
        console.error("Error saving settings:", error);
        throw error;
    }
};
// Seed Content (Universities & Services & Events)
export const seedContent = async () => {
    try {
        const eventsQuery = query(collection(db, 'events'));
        const eventsSnapshot = await getDocs(eventsQuery);

        if (eventsSnapshot.empty) {

            console.log("Seeded sample event.");
        }
    } catch (e) {
        console.error("Error seeding content:", e);
    }

    // Seeding disabled for other content for now to preserve state
    return;
};
