
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

// Student: Save Details on Login / Profile Update
export const saveStudentDetails = async (firebaseUser: FirebaseUser, details?: {
    name?: string;
    mobile?: string;
    gender?: string;
    dob?: string;
    address?: string;
    documents?: any;
}): Promise<User> => {
    const studentRef = doc(db, STUDENTS_COLLECTION, firebaseUser.uid);

    const studentData: any = {
        id: firebaseUser.uid,
        name: details?.name || firebaseUser.displayName || 'Student',
        email: firebaseUser.email || '',
        picture: firebaseUser.photoURL || null,
        role: 'student' as const,
        lastLogin: serverTimestamp(),
    };

    if (details?.mobile) studentData.mobile = details.mobile;
    if (details?.gender) studentData.gender = details.gender;
    if (details?.dob) studentData.dob = details.dob;
    if (details?.address) studentData.address = details.address;
    if (details?.documents) {
        studentData.documents = details.documents;
    }

    try {
        // Merge updates to preserve existing fields not being updated here
        // For documents, we need to be careful not to overwrite the entire map if we only update one
        // Ideally we would use updateDoc for specific fields, but setDoc with merge handles top-level merge well.
        // For nested objects like 'documents', setDoc with merge: true typically merges the top-level keys.
        // If we want to merge *inside* documents, we might need to fetch first or use dot notation update.
        // For simplicity here, we assume 'details.documents' contains the *new* state or we rely on merge behavior.
        // Actually, with setDoc({ documents: { ... } }, { merge: true }), it merges the 'documents' object into the existing doc.
        // But it *replaces* the 'documents' field if it exists with the new object provided in the map? 
        // No, setDoc with merge: true performs a deep merge on maps.

        await setDoc(studentRef, studentData, { merge: true });

        // Fetch the updated document to return complete user data
        const updatedDoc = await getDoc(studentRef);
        const data = updatedDoc.data();

        return {
            id: data?.id,
            name: data?.name,
            email: data?.email,
            picture: data?.picture,
            role: 'student',
            mobile: data?.mobile,
            address: data?.address,
            dob: data?.dob,
            gender: data?.gender,
            documents: data?.documents
        };
    } catch (error) {
        console.error('Error saving student details:', error);
        throw error;
    }
};

// Update Student Profile safely
export const updateStudentProfile = async (uid: string, data: Partial<User>): Promise<void> => {
    try {
        const studentRef = doc(db, STUDENTS_COLLECTION, uid);
        await setDoc(studentRef, data, { merge: true });
    } catch (error) {
        console.error('Error updating student profile:', error);
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

    // Seed Reviews
    try {
        const reviewsQuery = query(collection(db, 'reviews'));
        const reviewsSnapshot = await getDocs(reviewsQuery);

        if (reviewsSnapshot.empty) {
            const initialReviews = [
                {
                    studentName: "Sarah Johnson",
                    program: "BSc Nursing",
                    rating: 5,
                    content: "Fortex Education guided me through every step of the nursing admission process. Their team is incredibly supportive and knowledgeable!",
                    imageUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
                    createdAt: serverTimestamp()
                },
                {
                    studentName: "Michael Chen",
                    program: "MBA International",
                    rating: 5,
                    content: "I got into my dream university thanks to the personalized counseling. Highly recommend their services for study abroad aspirants.",
                    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
                    createdAt: serverTimestamp()
                },
                {
                    studentName: "Priya Patel",
                    program: "Computer Science",
                    rating: 4,
                    content: "Professional, transparent, and always available to answer my queries. Made the visa process seamless.",
                    imageUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=200&q=80",
                    createdAt: serverTimestamp()
                }
            ];

            for (const review of initialReviews) {
                await addDoc(collection(db, 'reviews'), review);
            }
            console.log("Seeded initial reviews.");
        }
    } catch (e) {
        console.error("Error seeding reviews:", e);
    }

    // Seeding disabled for other content for now to preserve state
    return;
};
