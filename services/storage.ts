
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a student document to Firebase Storage.
 * @param file The file to upload.
 * @param studentId The ID of the student.
 * @param docType The type of document (e.g., '10th_marksheet', 'passport').
 * @returns The download URL of the uploaded file.
 */
export const uploadStudentDocument = async (file: File, studentId: string, docType: string): Promise<string> => {
    try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${docType}.${fileExtension}`;
        const storageRef = ref(storage, `student_documents/${studentId}/${fileName}`);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error(`Error uploading ${docType}:`, error);
        throw error;
    }
};

/**
 * Uploads a hero banner image to Firebase Storage.
 * @param file The file to upload.
 * @param bannerNumber The slide number (1, 2, or 3).
 * @returns The download URL of the uploaded image.
 */
export const uploadBannerImage = async (file: File, bannerNumber: number): Promise<string> => {
    try {
        const fileExtension = file.name.split('.').pop();
        const fileName = `banner${bannerNumber}_${Date.now()}.${fileExtension}`;
        const storageRef = ref(storage, `banners/${fileName}`);

        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return downloadURL;
    } catch (error) {
        console.error(`Error uploading banner ${bannerNumber}:`, error);
        throw error;
    }
};
