import React, { useEffect, useState } from 'react';
import { User, Service, College, University, Lead, SiteSettings, Consultation, EducationInsight, Inquiry, Event, Review } from '../types';
import { db, collection, getDocs, addDoc, deleteDoc, updateDoc, doc, query, orderBy, limit, startAfter, getCountFromServer, QueryDocumentSnapshot, DocumentData } from '../firebase';
import { getSiteSettings, saveSiteSettings } from '../services/db';
import { uploadBannerImage } from '../services/storage';
import { seedCourses } from '../seedCourses';
import * as XLSX from 'xlsx';
import ApplicationForm from './ApplicationForm';

interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout }) => {
    const [activeTab, setActiveTab] = useState('students');
    const [loading, setLoading] = useState(false);

    // Data State
    const [students, setStudents] = useState<User[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [colleges, setColleges] = useState<College[]>([]);
    const [universities, setUniversities] = useState<University[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [educationInsights, setEducationInsights] = useState<EducationInsight[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
    const [studentApplicationData, setStudentApplicationData] = useState<any | null>(null);
    const [loadingApplication, setLoadingApplication] = useState(false);
    const [isAddingDetails, setIsAddingDetails] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);
    const [lastDocs, setLastDocs] = useState<{ [key: string]: QueryDocumentSnapshot<DocumentData>[] }>({}); // Store array of last docs for each page to enable prev/next
    const [totalItems, setTotalItems] = useState<{ [key: string]: number }>({});
    const [pageHistory, setPageHistory] = useState<{ [key: string]: QueryDocumentSnapshot<DocumentData>[] }>({}); // Track history for 'Back' buttons if needed, or just rely on index access into a master list if small enough.
    // Actually, for simple prev/next with startAfter:
    // Page 1: startAfter(null)
    // Page 2: startAfter(lastDocOfPage1)
    // Page 3: startAfter(lastDocOfPage2)
    // We will store an array of "last documents" for each page index.
    // lastDocs[tab][pageIndex] = last doc of that page.
    // To fetch Page N, we look at lastDocs[tab][N-1] as the cursor.

    const fetchTotalCount = async (collectionName: string) => {
        try {
            const coll = collection(db, collectionName);
            const snapshot = await getCountFromServer(coll);
            setTotalItems(prev => ({ ...prev, [collectionName]: snapshot.data().count }));
        } catch (error) {
            console.error('Error fetching count:', error);
        }
    };

    const fetchPaginatedData = async (collectionName: string, page: number) => {
        setLoading(true);
        try {
            let q;
            const isTimeOrdered = ['leads', 'consultations', 'inquiries'].includes(collectionName);

            if (isTimeOrdered) {
                q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), limit(itemsPerPage));
            } else {
                q = query(collection(db, collectionName), limit(itemsPerPage));
            }

            // To fetch Page N (1-based), we need the cursor from Page N-1.
            // Page 1: No cursor.
            // Page 2: Cursor is the last doc of Page 1.
            const previousPageLastDoc = lastDocs[collectionName]?.[page - 1];

            if (page > 1 && previousPageLastDoc) {
                if (isTimeOrdered) {
                    q = query(collection(db, collectionName), orderBy('createdAt', 'desc'), startAfter(previousPageLastDoc), limit(itemsPerPage));
                } else {
                    q = query(collection(db, collectionName), startAfter(previousPageLastDoc), limit(itemsPerPage));
                }
            }

            const snapshot = await getDocs(q);

            // Update lastDocs for THIS page
            const newLastDoc = snapshot.docs[snapshot.docs.length - 1];
            if (newLastDoc) {
                setLastDocs(prev => {
                    const tabDocs = prev[collectionName] || [];
                    tabDocs[page] = newLastDoc; // Store for next page use
                    return { ...prev, [collectionName]: tabDocs };
                });
            }

            const data = snapshot.docs.map(doc => ({ ...(doc.data() as Record<string, any>), id: doc.id } as any));

            switch (collectionName) {
                case 'students': setStudents(data as User[]); break;
                case 'leads': setLeads(data.map(d => ({ ...d, createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date() } as Lead))); break;
                case 'services': setServices(data as Service[]); break;
                case 'colleges': setColleges(data as College[]); break;
                case 'universities': setUniversities(data as University[]); break;
                case 'education-insights': setEducationInsights(data as EducationInsight[]); break;
                case 'consultations': setConsultations(data.map(d => ({ ...d, createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date() } as Consultation))); break;
                case 'inquiries': setInquiries(data as Inquiry[]); break;
                case 'events': setEvents(data as Event[]); break;
                case 'reviews': setReviews(data.map(d => ({ ...d, createdAt: d.createdAt?.toDate ? d.createdAt.toDate() : new Date() } as Review))); break;
            }

        } catch (error: any) {
            console.error('Error fetching paginated data:', error);
            if (error?.code === 'failed-precondition') {
                console.warn('Missing index for sort. Fetching without sort temporarily.');
                try {
                    const q = query(collection(db, collectionName), limit(itemsPerPage));
                    const snapshot = await getDocs(q);
                    const data = snapshot.docs.map(doc => ({ ...(doc.data() as Record<string, any>), id: doc.id } as any));
                    // Update state similarly... but simplified for fallback
                    switch (collectionName) {
                        case 'services': setServices(data as Service[]); break;
                        case 'colleges': setColleges(data as College[]); break;
                        // ... others if needed, but services/colleges are main concern
                    }
                } catch (retryError) {
                    console.error("Retry failed:", retryError);
                }
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage === currentPage) return;
        const collectionMap: { [key: string]: string } = {
            'students': 'students',
            'leads': 'leads',
            'services': 'services',
            'colleges': 'colleges',
            'universities': 'universities',
            'education-insights': 'education-insights',
            'consultation': 'consultations',
            'inquiries': 'inquiries',
            'events': 'events',
            'reviews': 'reviews'
        };
        const collName = collectionMap[activeTab];
        if (collName) {
            fetchPaginatedData(collName, newPage);
            setCurrentPage(newPage);
        }
    };


    const downloadLeadsExcel = () => {
        const data = leads.map(lead => ({
            "Student Name": lead.studentName,
            "Email": lead.studentEmail,
            "Phone": lead.studentPhone || 'N/A',
            "Location": lead.studentLocation || 'N/A',
            "Last Course": lead.lastAttendedCourse || 'N/A',
            "Percentage": lead.percentage || 'N/A',
            "Type": lead.type || 'college',
            "Institution": lead.collegeName || lead.universityName || 'N/A',
            "Date": lead.createdAt instanceof Date ? lead.createdAt.toLocaleDateString() : 'N/A'
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Leads");
        XLSX.writeFile(wb, "leads_report.xlsx");
    };

    // Fetch Data based on active tab and for sidebar badges
    // Fetch Data based on active tab and for sidebar badges
    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                // Fetch counts for sidebar badges
                // We do not need full data for badges if we just want counts, but current UI might need data for "Unread" logic?
                // The current code fetched all leads/inquiries/consultations just for badges. 
                // For now, let's keep fetching "Page 1" of these for badges? 
                // Wait, if badges rely on "unread count" of ALL items, we actually need to run a count query with where('read', '==', false).
                // Existing code: fetched ALL docs and mapped them. This is expensive.
                // Optimally: use getCountFromServer(query(..., where('read', '==', false))).
                // But for "Total" count in sidebar badges, let's stick to fetchTotalCount logic or keep generic fetch?
                // The user asked for cursor pagination. Loading ALL leads just to count unread is inefficient but replacing it is out of scope?
                // Let's assume we fetch page 1 for active tab, and maybe separate count queries for badges later.
                // To minimize breakage, we will NOT fetch all leads/consultations anymore.
                // We will just fetch counts. If sidebar needs "unread count", we ideally add `fetchUnreadCount`.
                // For this refactor, let's stick to paginated data for the MAIN VIEW.

                const collectionMap: { [key: string]: string } = {
                    'students': 'students',
                    'leads': 'leads',
                    'services': 'services',
                    'colleges': 'colleges',
                    'universities': 'universities',
                    'education-insights': 'education-insights',
                    'consultation': 'consultations',
                    'inquiries': 'inquiries',
                    'events': 'events',
                    'reviews': 'reviews'
                };

                const targetColl = collectionMap[activeTab];
                if (targetColl) {
                    await fetchTotalCount(targetColl);
                    await fetchPaginatedData(targetColl, 1);
                } else if (activeTab === 'sections' || activeTab === 'general') {
                    const settings = await getSiteSettings();
                    setSiteSettings(settings);
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };

        // Reset state on tab change
        setCurrentPage(1);
        setLastDocs({});
        setSelectedStudent(null);
        setStudentApplicationData(null);
        setIsAddingDetails(false);
        initData();
    }, [activeTab]);

    // Fetch application data when a student is selected
    useEffect(() => {
        const fetchApplicationData = async () => {
            if (!selectedStudent) {
                setStudentApplicationData(null);
                return;
            }

            setLoadingApplication(true);
            try {
                const appDocRef = doc(db, 'applications', selectedStudent.id);
                const appSnapshot = await getDocs(query(collection(db, 'applications')));
                const appDoc = appSnapshot.docs.find(d => d.id === selectedStudent.id);

                if (appDoc) {
                    setStudentApplicationData(appDoc.data());
                } else {
                    setStudentApplicationData(null);
                }
            } catch (error) {
                console.error('Error fetching application:', error);
                setStudentApplicationData(null);
            } finally {
                setLoadingApplication(false);
            }
        };

        fetchApplicationData();
    }, [selectedStudent]);

    // Reset pagination when switching tabs


    const handleSettingsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (siteSettings) {
                await saveSiteSettings(siteSettings);
                alert("Site settings updated successfully!");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings.");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (collectionName: string, id: string) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteDoc(doc(db, collectionName, id));
                // Optimistic update
                if (collectionName === 'services') setServices(prev => prev.filter(item => item.id !== id));
                if (collectionName === 'colleges') setColleges(prev => prev.filter(item => item.id !== id));
                if (collectionName === 'universities') setUniversities(prev => prev.filter(item => item.id !== id));
                if (collectionName === 'leads') setLeads(prev => prev.filter(item => item.id !== id));
                if (collectionName === 'consultations') setConsultations(prev => prev.filter(item => item.id !== id));
                if (collectionName === 'education-insights') setEducationInsights(prev => prev.filter(item => item.id !== id));
                if (collectionName === 'events') setEvents(prev => prev.filter(item => item.id !== id));
            } catch (error) {
                console.error("Error deleting document:", error);
                alert("Failed to delete item.");
            }
        }
    };

    const handleDeleteInquiry = async (id: string) => {
        if (!confirm('Are you sure you want to delete this inquiry?')) return;
        try {
            await deleteDoc(doc(db, 'inquiries', id));
            setInquiries(prev => prev.filter(i => i.id !== id));
        } catch (error) {
            console.error(error);
            alert('Failed to delete');
        }
    };

    const handleMarkAsRead = async (collectionName: string, id: string) => {
        try {
            await updateDoc(doc(db, collectionName, id), { read: true });
            if (collectionName === 'leads') {
                setLeads(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
            } else if (collectionName === 'consultations') {
                setConsultations(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
            } else if (collectionName === 'inquiries') {
                setInquiries(prev => prev.map(item => item.id === id ? { ...item, read: true } : item));
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const dataToSave = { ...formData };
        if (!editingId) {
            dataToSave.createdAt = new Date();
        }

        try {
            if (activeTab === 'services') {
                if (editingId) {
                    await updateDoc(doc(db, 'services', editingId), dataToSave);
                    setServices(prev => prev.map(item => item.id === editingId ? { ...item, ...dataToSave } : item));
                } else {
                    const docRef = await addDoc(collection(db, 'services'), dataToSave);
                    setServices(prev => [{ ...dataToSave, id: docRef.id } as Service, ...prev]);
                }
            } else if (activeTab === 'colleges') {
                if (editingId) {
                    await updateDoc(doc(db, 'colleges', editingId), dataToSave);
                    setColleges(prev => prev.map(item => item.id === editingId ? { ...item, ...dataToSave } : item));
                } else {
                    const docRef = await addDoc(collection(db, 'colleges'), dataToSave);
                    setColleges(prev => [{ ...dataToSave, id: docRef.id } as College, ...prev]);
                }
            } else if (activeTab === 'universities') {
                if (editingId) {
                    await updateDoc(doc(db, 'universities', editingId), dataToSave);
                    setUniversities(prev => prev.map(item => item.id === editingId ? { ...item, ...dataToSave } : item));
                } else {
                    const docRef = await addDoc(collection(db, 'universities'), dataToSave);
                    setUniversities(prev => [{ ...dataToSave, id: docRef.id } as University, ...prev]);
                }
            } else if (activeTab === 'education-insights') {
                if (editingId) {
                    await updateDoc(doc(db, 'education-insights', editingId), dataToSave);
                    setEducationInsights(prev => prev.map(item => item.id === editingId ? { ...item, ...dataToSave } : item));
                } else {
                    const docRef = await addDoc(collection(db, 'education-insights'), dataToSave);
                    setEducationInsights(prev => [{ ...dataToSave, id: docRef.id } as EducationInsight, ...prev]);
                }
            } else if (activeTab === 'events') {
                if (editingId) {
                    await updateDoc(doc(db, 'events', editingId), dataToSave);
                    setEvents(prev => prev.map(item => item.id === editingId ? { ...item, ...dataToSave } : item));
                } else {
                    const docRef = await addDoc(collection(db, 'events'), dataToSave);
                    setEvents(prev => [{ ...dataToSave, id: docRef.id } as Event, ...prev]);
                }
            } else if (activeTab === 'reviews') {
                if (editingId) {
                    await updateDoc(doc(db, 'reviews', editingId), dataToSave);
                    setReviews(prev => prev.map(item => item.id === editingId ? { ...item, ...dataToSave } : item));
                } else {
                    const docRef = await addDoc(collection(db, 'reviews'), dataToSave);
                    setReviews(prev => [{ ...dataToSave, id: docRef.id } as Review, ...prev]);
                }
            }
            setIsAdding(false);
            setEditingId(null);
            setFormData({});
        } catch (error) {
            console.error("Error saving document:", error);
            alert("Failed to save item. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, imageType: 'logo' | 'hero1' | 'hero2' | 'hero3') => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (max 750KB for base64 in Firestore)
            if (file.size > 750 * 1024) {
                alert('File size should be less than 750KB to ensure storage stability');
                return;
            }

            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            setLoading(true);
            try {
                // Convert to base64
                const reader = new FileReader();
                reader.onloadend = async () => { // Made onloadend async
                    const base64String = reader.result as string;
                    if (imageType === 'logo') {
                        setSiteSettings(prev => ({ ...prev, logoUrl: base64String }));
                    } else if (imageType === 'hero1') {
                        const url = await uploadBannerImage(file, 1); // Assuming uploadBannerImage is defined elsewhere
                        setSiteSettings(prev => prev ? ({ ...prev, heroBanner1Image: url }) : null);
                    } else if (imageType === 'hero2') {
                        const url = await uploadBannerImage(file, 2);
                        setSiteSettings(prev => prev ? ({ ...prev, heroBanner2Image: url }) : null);
                    } else if (imageType === 'hero3') {
                        const url = await uploadBannerImage(file, 3);
                        setSiteSettings(prev => prev ? ({ ...prev, heroBanner3Image: url }) : null);
                    }
                    setLoading(false);
                };
                reader.onerror = () => {
                    alert('Failed to read file');
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error uploading logo:", error);
                alert("Failed to upload logo.");
                setLoading(false);
            }
        }
    };

    const handleServiceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 750 * 1024) {
                alert('File size should be less than 750KB to ensure storage stability');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            setLoading(true);
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({ ...prev, imageUrl: base64String }));
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Failed to upload image.");
                setLoading(false);
            }
        }
    };

    const handleCollegeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 750 * 1024) {
                alert('File size should be less than 750KB to ensure storage stability');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            setLoading(true);
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({ ...prev, imageUrl: base64String }));
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Failed to upload image.");
                setLoading(false);
            }
        }
    };

    const handleUniversityImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 750 * 1024) {
                alert('File size should be less than 750KB to ensure storage stability');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            setLoading(true);
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({ ...prev, imageUrl: base64String }));
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error uploading image:", error);
                alert("Failed to upload image.");
                setLoading(false);
            }
        }
    };

    const handleAboutImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 750 * 1024) {
                alert('File size should be less than 750KB to ensure storage stability');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            setLoading(true);
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setSiteSettings(prev => prev ? ({ ...prev, aboutImageUrl: base64String }) : null);
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error uploading about image:", error);
                alert("Failed to upload image.");
                setLoading(false);
            }
        }
    };

    const handleEventImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 750 * 1024) {
                alert('File size should be less than 750KB to ensure storage stability');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            setLoading(true);
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({ ...prev, imageUrl: base64String }));
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error uploading event image:", error);
                alert("Failed to upload image.");
                setLoading(false);
            }
        }
    };

    const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 750 * 1024) {
                alert('File size should be less than 750KB to ensure storage stability');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            setLoading(true);
            try {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64String = reader.result as string;
                    setFormData(prev => ({ ...prev, imageUrl: base64String }));
                    setLoading(false);
                };
                reader.readAsDataURL(file);
            } catch (error) {
                console.error("Error uploading review image:", error);
                alert("Failed to upload image.");
                setLoading(false);
            }
        }
    };

    const getYoutubeId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const PaginationControls = () => {
        const collectionMap: { [key: string]: string } = {
            'students': 'students',
            'leads': 'leads',
            'services': 'services',
            'colleges': 'colleges',
            'universities': 'universities',
            'education-insights': 'education-insights',
            'consultation': 'consultations',
            'inquiries': 'inquiries',
            'events': 'events'
        };
        const currentCollection = collectionMap[activeTab];
        const count = totalItems[currentCollection] || 0;

        // Fallback for collections where we might just check array length if totalItems not yet populated (though fetchPaginatedData should populate it via fetchTotalCount)
        // Actually, leads/students etc length is just PAGE length now. So we rely on totalItems.

        const totalPages = Math.ceil(count / itemsPerPage);

        if (totalPages <= 1) return null;

        return (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                        </p>
                    </div>
                    <div>
                        <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <span className="sr-only">Previous</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Simple Page Display - just show current page and total */}
                            {/* Since strict cursor pagination makes jumping to arbitrary pages hard without storing all cursors,
                                we typically only allow Prev/Next. 
                                However, if we want jump, we need to have visited the pages or fetch cursors. 
                                For simplicity with Firestore Cursors:
                                - We only support Prev/Next cleanly unless we cache all doc snapshots. 
                                - My implementation stores 'lastDocs' in a map by page number.
                                - So we CAN jump to any page IF we have the cursor for (targetPage - 1).
                                - If we jump forward 2 pages, we don't have the intermediate cursor.
                                - So we should STRICTLY restrict to Next/Prev or pages we have visited.
                                - For now: Allow only Prev/Next buttons for robustness.
                            */}

                            <button
                                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage >= totalPages}
                                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <span className="sr-only">Next</span>
                                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading && !isAdding) {
            return (
                <div className="p-12 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading...</p>
                </div>
            );
        }

        switch (activeTab) {
            case 'students':
                const currentStudents = students;

                // Student Detail View
                if (selectedStudent) {
                    if (isAddingDetails) {
                        return (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300 p-6">
                                <ApplicationForm
                                    user={selectedStudent}
                                    isAdmin={true}
                                    onBack={async () => {
                                        setIsAddingDetails(false);
                                        // Trigger a refresh of application data
                                        const appSnapshot = await getDocs(query(collection(db, 'applications')));
                                        const appDoc = appSnapshot.docs.find(d => d.id === selectedStudent.id);
                                        if (appDoc) {
                                            setStudentApplicationData(appDoc.data());
                                        }
                                    }}
                                />
                            </div>
                        );
                    }
                    return (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-4">
                                <button
                                    onClick={() => { setSelectedStudent(null); setStudentApplicationData(null); }}
                                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                    Back to List
                                </button>
                                <div className="w-px h-6 bg-gray-200" />
                                <h2 className="text-lg font-semibold text-gray-800">Student Details & Application</h2>
                            </div>
                            <div className="p-6 md:p-8 space-y-8">
                                {/* Profile Header */}
                                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                    <img
                                        className="h-20 w-20 rounded-full border-2 border-gray-200 object-cover shadow-md"
                                        src={selectedStudent.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedStudent.name)}&background=6366f1&color=fff&size=128`}
                                        alt={selectedStudent.name}
                                    />
                                    <div className="text-center sm:text-left flex-1">
                                        <h3 className="text-2xl font-bold text-gray-900">{selectedStudent.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{selectedStudent.email}</p>
                                        <div className="flex gap-2 mt-2 justify-center sm:justify-start">
                                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active Student</span>
                                            {studentApplicationData && (
                                                <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${studentApplicationData.status === 'submitted' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    Application: {studentApplicationData.status === 'submitted' ? 'Submitted' : 'Draft'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {loadingApplication ? (
                                    <div className="text-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                        <p className="text-sm text-gray-500">Loading application data...</p>
                                    </div>
                                ) : studentApplicationData ? (
                                    <>
                                        {/* Application Form Data */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-4">
                                            <div>
                                                <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 Application Form Submitted</h4>
                                                <p className="text-xs text-blue-700">
                                                    This student has submitted their application form. All details are shown below.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setIsAddingDetails(true)}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                Edit Application
                                            </button>
                                        </div>

                                        {/* Student Details Section */}
                                        {studentApplicationData.studentDetails && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">👤 Student Details</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {[
                                                        { label: 'Full Name', value: studentApplicationData.studentDetails.fullName },
                                                        { label: 'Gender', value: studentApplicationData.studentDetails.gender },
                                                        { label: 'Date of Birth', value: studentApplicationData.studentDetails.dob },
                                                        { label: 'Age', value: studentApplicationData.studentDetails.age },
                                                        { label: 'Nationality', value: studentApplicationData.studentDetails.nationality },
                                                        { label: 'Religion', value: studentApplicationData.studentDetails.religion },
                                                        { label: 'Community', value: studentApplicationData.studentDetails.community },
                                                        { label: 'Caste', value: studentApplicationData.studentDetails.caste },
                                                        { label: 'Aadhaar Number', value: studentApplicationData.studentDetails.aadhaarNumber },
                                                        { label: 'Mobile', value: studentApplicationData.studentDetails.studentMobile },
                                                        { label: 'Email', value: studentApplicationData.studentDetails.studentEmail },
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                            <p className="text-sm font-medium text-gray-800 mt-1 break-words">{item.value || 'Not provided'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Parent/Guardian Details */}
                                        {studentApplicationData.parentDetails && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">👨‍👩‍👧 Parent/Guardian Details</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {[
                                                        { label: "Father's Name", value: studentApplicationData.parentDetails.fatherName },
                                                        { label: "Father's Mobile", value: studentApplicationData.parentDetails.fatherMobile },
                                                        { label: "Father's Occupation", value: studentApplicationData.parentDetails.fatherOccupation },
                                                        { label: "Mother's Name", value: studentApplicationData.parentDetails.motherName },
                                                        { label: "Mother's Mobile", value: studentApplicationData.parentDetails.motherMobile },
                                                        { label: "Mother's Occupation", value: studentApplicationData.parentDetails.motherOccupation },
                                                        { label: 'Annual Income', value: studentApplicationData.parentDetails.annualIncome },
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                            <p className="text-sm font-medium text-gray-800 mt-1 break-words">{item.value || 'Not provided'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Address Details */}
                                        {studentApplicationData.addressDetails && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">🏠 Address Details</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {[
                                                        { label: 'House/Flat No.', value: studentApplicationData.addressDetails.houseNo },
                                                        { label: 'Street/Locality', value: studentApplicationData.addressDetails.street },
                                                        { label: 'Post Office', value: studentApplicationData.addressDetails.postOffice },
                                                        { label: 'District', value: studentApplicationData.addressDetails.district },
                                                        { label: 'State', value: studentApplicationData.addressDetails.state },
                                                        { label: 'PIN Code', value: studentApplicationData.addressDetails.pinCode },
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                            <p className="text-sm font-medium text-gray-800 mt-1 break-words">{item.value || 'Not provided'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Academic Details */}
                                        {studentApplicationData.academicDetails && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">📚 Academic Details</h4>

                                                {/* 10th Standard */}
                                                <div className="mb-6">
                                                    <h5 className="text-xs font-semibold text-gray-600 mb-3">10th Standard</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {[
                                                            { label: 'School Name', value: studentApplicationData.academicDetails.tenth?.schoolName },
                                                            { label: 'Place', value: studentApplicationData.academicDetails.tenth?.place },
                                                            { label: 'Board', value: studentApplicationData.academicDetails.tenth?.board },
                                                            { label: 'Year of Passing', value: studentApplicationData.academicDetails.tenth?.yearOfPassing },
                                                            { label: 'Percentage', value: studentApplicationData.academicDetails.tenth?.percentage },
                                                        ].map((item, i) => (
                                                            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                                <p className="text-sm font-medium text-gray-800 mt-1 break-words">{item.value || 'Not provided'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* +2 Standard */}
                                                <div>
                                                    <h5 className="text-xs font-semibold text-gray-600 mb-3">+2 / Equivalent</h5>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                        {[
                                                            { label: 'College Name', value: studentApplicationData.academicDetails.plusTwo?.collegeName },
                                                            { label: 'Stream', value: studentApplicationData.academicDetails.plusTwo?.stream === 'Other' ? studentApplicationData.academicDetails.plusTwo?.otherStream : studentApplicationData.academicDetails.plusTwo?.stream },
                                                            { label: 'Board', value: studentApplicationData.academicDetails.plusTwo?.board },
                                                            { label: 'Year of Passing', value: studentApplicationData.academicDetails.plusTwo?.yearOfPassing },
                                                            { label: 'Percentage', value: studentApplicationData.academicDetails.plusTwo?.percentage },
                                                        ].map((item, i) => (
                                                            <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                                <p className="text-sm font-medium text-gray-800 mt-1 break-words">{item.value || 'Not provided'}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* UG Standard */}
                                                {studentApplicationData.academicDetails.ug && studentApplicationData.academicDetails.ug.degreeName && (
                                                    <div className="mt-6">
                                                        <h5 className="text-xs font-semibold text-gray-600 mb-3">Undergraduate</h5>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                            {[
                                                                { label: 'Degree Name', value: studentApplicationData.academicDetails.ug.degreeName },
                                                                { label: 'College Name', value: studentApplicationData.academicDetails.ug.collegeName },
                                                                { label: 'University Name', value: studentApplicationData.academicDetails.ug.universityName },
                                                                { label: 'Year of Passing', value: studentApplicationData.academicDetails.ug.yearOfPassing },
                                                                { label: 'Percentage', value: studentApplicationData.academicDetails.ug.percentage },
                                                            ].map((item, i) => (
                                                                <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                                    <p className="text-sm font-medium text-gray-800 mt-1 break-words">{item.value || 'Not provided'}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Course Preference */}
                                        {studentApplicationData.coursePreference && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">🎓 Course Preference</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Course Applying For</p>
                                                        <p className="text-sm font-medium text-gray-800 mt-1">{studentApplicationData.coursePreference.courseApplyingFor || 'Not provided'}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Preferred Location</p>
                                                        <p className="text-sm font-medium text-gray-800 mt-1">{studentApplicationData.coursePreference.preferredLocation || 'Not provided'}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mode of Admission</p>
                                                        <p className="text-sm font-medium text-gray-800 mt-1">{studentApplicationData.coursePreference.modeOfAdmission || 'Not provided'}</p>
                                                    </div>
                                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 sm:col-span-2">
                                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Preferred Colleges</p>
                                                        <p className="text-sm font-medium text-gray-800 mt-1 whitespace-pre-line">{studentApplicationData.coursePreference.preferredColleges || 'Not provided'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Additional Information */}
                                        {studentApplicationData.additionalInfo && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">ℹ️ Additional Information</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {[
                                                        { label: 'Entrance Exam Appeared', value: studentApplicationData.additionalInfo.entranceExamAppeared },
                                                        { label: 'Exam Name & Score', value: studentApplicationData.additionalInfo.examNameAndScore },
                                                        { label: 'Gap in Studies', value: studentApplicationData.additionalInfo.gapInStudies },
                                                        { label: 'Gap Reason', value: studentApplicationData.additionalInfo.gapReason },
                                                    ].map((item, i) => (
                                                        <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{item.label}</p>
                                                            <p className="text-sm font-medium text-gray-800 mt-1 break-words">{item.value || 'Not provided'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Documents */}
                                        {studentApplicationData.documents && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">📄 Uploaded Documents</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {[
                                                        { key: 'sslcCertificate', label: 'SSLC / 10th Certificate' },
                                                        { key: 'plusTwoCertificate', label: '+2 Certificate' },
                                                        { key: 'aadhaarCard', label: 'Aadhaar Card' },
                                                        { key: 'passportPhoto', label: 'Passport Photo' },
                                                        { key: 'transferCertificate', label: 'Transfer Certificate' },
                                                        { key: 'migrationCertificate', label: 'Migration Certificate' },
                                                    ].map((doc) => {
                                                        const docData = studentApplicationData.documents[doc.key];
                                                        return (
                                                            <div key={doc.key} className={`flex items-center justify-between bg-gray-50 rounded-xl p-4 border ${docData ? 'border-green-200 bg-green-50' : 'border-gray-100'
                                                                } transition-colors`}>
                                                                <div className="flex items-center gap-3 min-w-0">
                                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${docData ? 'bg-green-100' : 'bg-gray-100'
                                                                        }`}>
                                                                        {docData ? (
                                                                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                            </svg>
                                                                        ) : (
                                                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                            </svg>
                                                                        )}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="text-sm font-medium text-gray-800 truncate">{doc.label}</p>
                                                                        <p className="text-xs text-gray-400">{docData ? docData.name : 'Not uploaded'}</p>
                                                                    </div>
                                                                </div>
                                                                {docData && (
                                                                    <a
                                                                        href={docData.url}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium flex-shrink-0 ml-3"
                                                                    >
                                                                        View
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Declaration */}
                                        {studentApplicationData.declaration && (
                                            <div>
                                                <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">✍️ Declaration</h4>
                                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Place</p>
                                                            <p className="text-sm font-medium text-gray-800 mt-1">{studentApplicationData.declaration.place || 'Not provided'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Date</p>
                                                            <p className="text-sm font-medium text-gray-800 mt-1">{studentApplicationData.declaration.date || 'Not provided'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {studentApplicationData.declaration.agreed ? (
                                                            <>
                                                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="text-sm font-medium text-green-800">Student has agreed to the declaration</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-gray-600">Declaration not agreed</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                                        <svg className="w-12 h-12 text-yellow-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <h4 className="text-sm font-semibold text-yellow-900 mb-2">No Application Submitted</h4>
                                        <p className="text-xs text-yellow-700 mb-4">
                                            This student has not submitted their application form yet.
                                        </p>
                                        <button
                                            onClick={() => setIsAddingDetails(true)}
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            Add Student Details
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }

                // Student List View
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-gray-800">Registered Students</h2>
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                                {totalItems['students'] || students.length} Total
                            </span>
                        </div>
                        {students.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No students registered yet.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student Profile</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Contact Info</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {currentStudents.map((student) => (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => { setSelectedStudent(student); setIsAddingDetails(false); }}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <img
                                                            className="h-10 w-10 rounded-full border border-gray-200 object-cover"
                                                            src={student.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`}
                                                            alt=""
                                                        />
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                                                            <div className="text-xs text-gray-500">ID: {student.id.slice(0, 8)}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{student.email}</div>
                                                    {student.mobile && <div className="text-xs text-gray-400">{student.mobile}</div>}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button onClick={(e) => { e.stopPropagation(); setSelectedStudent(student); }} className="text-blue-600 hover:text-blue-900 font-medium">View Details</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <PaginationControls />
                    </div>
                );

            case 'leads':
                const currentLeads = leads;

                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">College Leads</h2>
                                <span className="text-xs text-gray-500">
                                    Page {currentPage} of {Math.ceil((totalItems['leads'] || leads.length) / itemsPerPage)}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={downloadLeadsExcel}
                                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Export Excel
                                </button>
                                <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2.5 py-1.5 rounded-full flex items-center">
                                    {totalItems['leads'] || leads.length} Total
                                </span>
                            </div>
                        </div>
                        {leads.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No leads generated yet.</div>
                        ) : (
                            <div className="flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Details</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Institution</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {currentLeads.map((lead) => (
                                                <tr key={lead.id} className={`hover:bg-gray-50 transition-colors ${!lead.read ? 'bg-blue-50 font-semibold' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <img
                                                                className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                                                                src={lead.studentPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(lead.studentName)}&background=random`}
                                                                alt=""
                                                            />
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                                                    {lead.studentName}
                                                                    {!lead.read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                                                </div>
                                                                <div className="text-xs text-gray-500">{lead.studentEmail}</div>
                                                                <div className="text-xs text-gray-500">{lead.studentPhone || 'No Phone'}</div>
                                                                <div className="text-xs text-gray-400 mt-0.5">{lead.studentLocation || 'Location N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{lead.lastAttendedCourse || 'N/A'}</div>
                                                        <div className="text-xs text-gray-500">{lead.percentage ? `${lead.percentage}` : 'Percentage N/A'}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.type === 'university' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                                                            {lead.type ? (lead.type.charAt(0).toUpperCase() + lead.type.slice(1)) : 'College'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-blue-900">{lead.collegeName || lead.universityName}</div>
                                                        <div className="text-xs text-blue-500">ID: {lead.collegeId || lead.universityId}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-600">
                                                            {lead.createdAt instanceof Date ? lead.createdAt.toLocaleDateString() : 'Just now'}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex gap-2">
                                                        <button
                                                            onClick={() => handleDelete('leads', lead.id)}
                                                            className="text-red-600 hover:text-red-900 font-medium"
                                                        >
                                                            Remove
                                                        </button>
                                                        {!lead.read && (
                                                            <button
                                                                onClick={() => handleMarkAsRead('leads', lead.id)}
                                                                className="text-blue-600 hover:text-blue-900 font-medium"
                                                            >
                                                                Mark Read
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <PaginationControls />
                            </div>
                        )}
                    </div>
                );

            case 'services':
                const currentServices = services;

                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Manage Services</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={async () => {
                                        if (confirm('This will add 12 courses to your services. Continue?')) {
                                            setLoading(true);
                                            await seedCourses();
                                            // Refresh services list
                                            await fetchPaginatedData('services', 1);
                                            setLoading(false);
                                            alert('Courses added successfully!');
                                        }
                                    }}
                                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Seed Courses
                                </button>
                                <button
                                    onClick={() => { setIsAdding(!isAdding); setFormData({}); setEditingId(null); }}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                                >
                                    {isAdding ? 'Cancel' : '+ Add Service'}
                                </button>
                            </div>
                        </div>

                        {isAdding && (
                            <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Title</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Career Counseling"
                                            value={formData.title || ''}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Image</label>
                                        <div className="flex items-center gap-4">
                                            {formData.imageUrl && (
                                                <img src={formData.imageUrl} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                                            )}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                                onChange={handleServiceImageUpload}
                                            />
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            required
                                            rows={3}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Brief description of the service..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 mt-2 pt-4 border-t border-gray-100">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Programs under this Course</label>
                                        <div className="flex gap-2 mb-3">
                                            <input
                                                type="text"
                                                id="newProgramInput"
                                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="e.g. B.Tech Computer Science"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = e.currentTarget.value.trim();
                                                        if (val) {
                                                            setFormData({ ...formData, programs: [...(formData.programs || []), val] });
                                                            e.currentTarget.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const input = document.getElementById('newProgramInput') as HTMLInputElement;
                                                    const val = input.value.trim();
                                                    if (val) {
                                                        setFormData({ ...formData, programs: [...(formData.programs || []), val] });
                                                        input.value = '';
                                                    }
                                                }}
                                                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 font-medium transition"
                                            >
                                                Add Program
                                            </button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(formData.programs || []).map((program: string, idx: number) => (
                                                <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                                    {program}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newPrograms = [...(formData.programs || [])];
                                                            newPrograms.splice(idx, 1);
                                                            setFormData({ ...formData, programs: newPrograms });
                                                        }}
                                                        className="text-gray-400 hover:text-red-500 focus:outline-none"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </span>
                                            ))}
                                            {(!formData.programs || formData.programs.length === 0) && (
                                                <span className="text-sm text-gray-400 italic">No programs added yet. Type a program name and click Add.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                                        Save Service
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentServices.map(service => (
                                <div key={service.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                                    <div className="h-48 overflow-hidden bg-gray-100">
                                        <img src={service.imageUrl} alt={service.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-gray-900 mb-2">{service.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{service.description}</p>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => {
                                                    setFormData(service);
                                                    setEditingId(service.id);
                                                    setIsAdding(true);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="text-blue-600 text-sm font-medium hover:text-blue-800 flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete('services', service.id)}
                                                className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center gap-1"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!isAdding && services.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                    No services added yet. Click "Add Service" to get started.
                                </div>
                            )}
                        </div>
                        <PaginationControls />
                    </div>
                );

            case 'colleges':
                const currentColleges = colleges;

                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800">Affiliated Colleges</h2>
                            <button
                                onClick={() => { setIsAdding(!isAdding); setFormData({}); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                {isAdding ? 'Cancel' : '+ Add College'}
                            </button>
                        </div>

                        {isAdding && (
                            <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">College Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Oxford University"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. London, UK"
                                            value={formData.location || ''}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                        <input
                                            required
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://ox.ac.uk"
                                            value={formData.websiteUrl || ''}
                                            onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                required
                                                type="url"
                                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="https://example.com/campus.jpg"
                                                value={formData.imageUrl || ''}
                                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            />
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleCollegeImageUpload}
                                                    className="hidden"
                                                />
                                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    Upload
                                                </span>
                                            </label>
                                        </div>
                                        {formData.imageUrl && (
                                            <div className="mt-2">
                                                <img src={formData.imageUrl} alt="Preview" className="h-20 w-32 object-cover rounded border border-gray-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            required
                                            rows={3}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="About this college..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                                        Save College
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentColleges.map(college => (
                                <div key={college.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                                    <div className="h-48 overflow-hidden bg-gray-100 relative">
                                        <img src={college.imageUrl} alt={college.name} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                                            <p className="text-white font-medium flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {college.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{college.name}</h3>
                                        <a href={college.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline mb-3 block">{college.websiteUrl}</a>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{college.description}</p>
                                        <button
                                            onClick={() => handleDelete('colleges', college.id)}
                                            className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {!isAdding && colleges.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                    No colleges added yet. Click "Add College" to get started.
                                </div>
                            )}
                        </div>
                        <PaginationControls />
                    </div>
                );

            case 'general':
                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in duration-300">
                        <div className="px-8 py-6 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-800">General Website Content</h2>
                            <p className="text-sm text-gray-500 mt-1">Manage global content such as hero section, about details, and contact info.</p>
                        </div>

                        {siteSettings && (
                            <form onSubmit={handleSettingsSubmit} className="p-8 space-y-8">
                                {/* Theme Settings */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Theme & Branding</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website Logo</label>
                                            <div className="flex items-center gap-4">
                                                {siteSettings.logoUrl && (
                                                    <img src={siteSettings.logoUrl} alt="Logo Preview" className="h-10 w-10 object-contain rounded border border-gray-200 bg-gray-50" />
                                                )}
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="url"
                                                        placeholder="https://example.com/logo.png"
                                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                        value={siteSettings.logoUrl || ''}
                                                        onChange={e => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                                                    />
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handleImageUpload(e, 'logo')}
                                                            className="hidden"
                                                        />
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                            Upload
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Upload a logo from your computer or paste a URL. Recommended size: 200x200px or larger.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Hero Section */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Hero Section</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Title</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                value={siteSettings.heroTitle}
                                                onChange={e => setSiteSettings({ ...siteSettings, heroTitle: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hero Subtitle</label>
                                            <textarea
                                                rows={2}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                value={siteSettings.heroSubtitle}
                                                onChange={e => setSiteSettings({ ...siteSettings, heroSubtitle: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {/* Hero Banner Images */}
                                    <div className="space-y-6 pt-6 border-t border-gray-100">
                                        <h4 className="text-sm font-semibold text-gray-900">Hero Banners</h4>

                                        {/* Banner 1 */}
                                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                            <label className="block text-sm font-medium text-gray-700">Banner 1 (Slide 1)</label>
                                            {siteSettings.heroBanner1Image && (
                                                <img src={siteSettings.heroBanner1Image} alt="Banner 1 Preview" className="w-full max-w-md h-32 object-cover rounded border border-gray-200" />
                                            )}
                                            <div className="flex gap-4">
                                                <input
                                                    type="url"
                                                    placeholder="Paste image URL here..."
                                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    value={siteSettings.heroBanner1Image || ''}
                                                    onChange={e => setSiteSettings({ ...siteSettings, heroBanner1Image: e.target.value })}
                                                />
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, 'hero1')}
                                                        className="hidden"
                                                    />
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        Upload
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Banner 2 */}
                                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                            <label className="block text-sm font-medium text-gray-700">Banner 2 (Slide 2)</label>
                                            {siteSettings.heroBanner2Image && (
                                                <img src={siteSettings.heroBanner2Image} alt="Banner 2 Preview" className="w-full max-w-md h-32 object-cover rounded border border-gray-200" />
                                            )}
                                            <div className="flex gap-4">
                                                <input
                                                    type="url"
                                                    placeholder="Paste image URL here..."
                                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    value={siteSettings.heroBanner2Image || ''}
                                                    onChange={e => setSiteSettings({ ...siteSettings, heroBanner2Image: e.target.value })}
                                                />
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, 'hero2')}
                                                        className="hidden"
                                                    />
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        Upload
                                                    </span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Banner 3 */}
                                        <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
                                            <label className="block text-sm font-medium text-gray-700">Banner 3 (Slide 3)</label>
                                            {siteSettings.heroBanner3Image && (
                                                <img src={siteSettings.heroBanner3Image} alt="Banner 3 Preview" className="w-full max-w-md h-32 object-cover rounded border border-gray-200" />
                                            )}
                                            <div className="flex gap-4">
                                                <input
                                                    type="url"
                                                    placeholder="Paste image URL here..."
                                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    value={siteSettings.heroBanner3Image || ''}
                                                    onChange={e => setSiteSettings({ ...siteSettings, heroBanner3Image: e.target.value })}
                                                />
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageUpload(e, 'hero3')}
                                                        className="hidden"
                                                    />
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                        </svg>
                                                        Upload
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* About Section */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">About Section</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">About Title</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                value={siteSettings.aboutTitle}
                                                onChange={e => setSiteSettings({ ...siteSettings, aboutTitle: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">About Description</label>
                                            <textarea
                                                rows={4}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                value={siteSettings.aboutDescription}
                                                onChange={e => setSiteSettings({ ...siteSettings, aboutDescription: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">About Image</label>
                                            <div className="flex items-center gap-4">
                                                {siteSettings.aboutImageUrl && (
                                                    <img src={siteSettings.aboutImageUrl} alt="About Preview" className="h-12 w-12 object-cover rounded border border-gray-200" />
                                                )}
                                                <div className="flex-1 flex gap-2">
                                                    <input
                                                        type="url"
                                                        placeholder="Paste image URL here..."
                                                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                        value={siteSettings.aboutImageUrl || ''}
                                                        onChange={e => setSiteSettings({ ...siteSettings, aboutImageUrl: e.target.value })}
                                                    />
                                                    <label className="cursor-pointer">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleAboutImageUpload}
                                                            className="hidden"
                                                        />
                                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                            </svg>
                                                            Upload
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Contact Section */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                                            <input
                                                type="email"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                value={siteSettings.contactEmail}
                                                onChange={e => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                value={siteSettings.contactPhone}
                                                onChange={e => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Number</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="+91..."
                                                value={siteSettings.whatsappNumber}
                                                onChange={e => setSiteSettings({ ...siteSettings, whatsappNumber: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                value={siteSettings.address}
                                                onChange={e => setSiteSettings({ ...siteSettings, address: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* Social Media Section */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Social Media Links</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Instagram URL</label>
                                            <input
                                                type="url"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="https://instagram.com/..."
                                                value={siteSettings.instagram || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, instagram: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Facebook URL</label>
                                            <input
                                                type="url"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="https://facebook.com/..."
                                                value={siteSettings.facebook || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, facebook: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                                            <input
                                                type="url"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="https://linkedin.com/..."
                                                value={siteSettings.linkedin || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, linkedin: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Twitter/X URL</label>
                                            <input
                                                type="url"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="https://twitter.com/..."
                                                value={siteSettings.twitter || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, twitter: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Channel URL</label>
                                            <input
                                                type="url"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="https://youtube.com/..."
                                                value={siteSettings.youtubeUrl || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, youtubeUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                {/* EmailJS Configuration Section */}
                                <section className="space-y-4">
                                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">EmailJS Configuration (For OTP)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Service ID</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="service_xxxxxxxx"
                                                value={siteSettings.emailjsServiceId || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, emailjsServiceId: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Template ID</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="template_xxxxxxxx"
                                                value={siteSettings.emailjsTemplateId || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, emailjsTemplateId: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Public Key</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                placeholder="xxxxxxxxxxxxxxxxx"
                                                value={siteSettings.emailjsPublicKey || ''}
                                                onChange={e => setSiteSettings({ ...siteSettings, emailjsPublicKey: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </section>

                                <div className="pt-6 flex justify-end">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </form>
                        )
                        }
                    </div >
                );

            case 'universities':
                const currentUniversities = universities;

                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Partner Universities</h2>
                            <button
                                onClick={() => { setIsAdding(!isAdding); setFormData({}); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                {isAdding ? 'Cancel' : '+ Add University'}
                            </button>
                        </div>

                        {isAdding && (
                            <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">University Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Harvard University"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Cambridge, MA"
                                            value={formData.location || ''}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                                        <input
                                            required
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://harvard.edu"
                                            value={formData.websiteUrl || ''}
                                            onChange={e => setFormData({ ...formData, websiteUrl: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                required
                                                type="url"
                                                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="https://example.com/university.jpg"
                                                value={formData.imageUrl || ''}
                                                onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                            />
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleUniversityImageUpload}
                                                    className="hidden"
                                                />
                                                <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                    </svg>
                                                    Upload
                                                </span>
                                            </label>
                                        </div>
                                        {formData.imageUrl && (
                                            <div className="mt-2">
                                                <img src={formData.imageUrl} alt="Preview" className="h-20 w-32 object-cover rounded border border-gray-200" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            required
                                            rows={3}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="About this university..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                                        Save University
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentUniversities.map(uni => (
                                <div key={uni.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                                    <div className="h-48 overflow-hidden bg-gray-100 relative">
                                        <img src={uni.imageUrl} alt={uni.name} className="w-full h-full object-cover" />
                                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                                            <p className="text-white font-medium flex items-center gap-1">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                {uni.location}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <h3 className="font-semibold text-lg text-gray-900 mb-1">{uni.name}</h3>
                                        <a href={uni.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline mb-3 block">{uni.websiteUrl}</a>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">{uni.description}</p>
                                        <button
                                            onClick={() => handleDelete('universities', uni.id)}
                                            className="text-red-600 text-sm font-medium hover:text-red-800 flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {!isAdding && universities.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                    No universities added yet. Click "Add University" to get started.
                                </div>
                            )}
                        </div>
                        <PaginationControls />
                    </div>
                );

            case 'education-insights':
                const currentEducationInsights = educationInsights;

                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Education Insights (Videos)</h2>
                            <button
                                onClick={() => { setIsAdding(!isAdding); setFormData({}); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                {isAdding ? 'Cancel' : '+ Add Video'}
                            </button>
                        </div>

                        {isAdding && (
                            <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Video Title / Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Career in Nursing 2025"
                                            value={formData.name || ''}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">YouTube Link</label>
                                        <input
                                            required
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://youtube.com/watch?v=..."
                                            value={formData.youtubeLink || ''}
                                            onChange={e => setFormData({ ...formData, youtubeLink: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                                        Save Video
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentEducationInsights.map(item => {
                                const videoId = getYoutubeId(item.youtubeLink);
                                return (
                                    <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                                        <div className="aspect-video bg-gray-100 relative group">
                                            {videoId ? (
                                                <img
                                                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
                                                    <svg className="w-12 h-12 opacity-50" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition">
                                                <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className="text-white hover:underline text-sm font-bold flex items-center gap-2">
                                                    Open Link
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                </a>
                                            </div>
                                        </div>
                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-2">
                                                {item.serviceTag && (
                                                    <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase rounded-md mb-2">
                                                        {item.serviceTag}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-gray-900 mb-4 line-clamp-2">{item.name}</h3>

                                            <button
                                                onClick={() => handleDelete('education-insights', item.id)}
                                                className="w-full py-2 flex items-center justify-center gap-2 text-red-600 text-sm font-medium bg-red-50 rounded-lg hover:bg-red-100 transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                Delete Video
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {!isAdding && educationInsights.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                    No education insights added yet. Click "Add Video" to get started.
                                </div>
                            )}
                        </div>
                        <PaginationControls />
                    </div>
                );

            case 'inquiries':
                const currentInquiries = inquiries;

                return (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h2 className="text-xl font-semibold mb-4">Web Inquiries</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b text-sm text-gray-500 bg-gray-50">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Phone</th>
                                            <th className="p-4">Subject</th>
                                            <th className="p-4">Message</th>
                                            <th className="p-4">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentInquiries.length === 0 ? (
                                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">No inquiries found.</td></tr>
                                        ) : (
                                            currentInquiries.map(inq => (
                                                <tr key={inq.id} className={`border-b hover:bg-gray-50 text-sm ${!inq.read ? 'bg-blue-50 font-semibold' : ''}`}>
                                                    <td className="p-4 text-gray-500">{inq.createdAt?.toDate ? inq.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                                    <td className="p-4 font-medium flex items-center gap-2">
                                                        {inq.name}
                                                        {!inq.read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                                    </td>
                                                    <td className="p-4">{inq.phone}</td>
                                                    <td className="p-4 text-blue-600">{inq.subject}</td>
                                                    <td className="p-4 text-gray-600 max-w-xs truncate" title={inq.message}>{inq.message}</td>
                                                    <td className="p-4 flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); inq.id && handleDeleteInquiry(inq.id); }}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            Delete
                                                        </button>
                                                        {!inq.read && <button onClick={(e) => { e.stopPropagation(); inq.id && handleMarkAsRead('inquiries', inq.id); }} className="text-blue-500 hover:text-blue-700 text-xs">Mark Read</button>}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <PaginationControls />
                    </div>

                );
            case 'sections':
                const sections = [
                    { id: 'hero', name: 'Hero (Home)', description: 'The main landing area with the "Start Your Journey" button.' },
                    { id: 'about', name: 'About Us', description: 'Information about the agency and its mission.' },
                    { id: 'colleges', name: 'Affiliated Colleges', description: 'List of partner colleges.' },
                    { id: 'universities', name: 'Partner Universities', description: 'Searchable list of partner universities with lead generation.' },
                    { id: 'programs', name: 'Programs & Courses', description: 'Available courses and study paths.' },
                    { id: 'booking', name: 'Consultation Booking', description: 'Form for students to request callbacks.' },
                    { id: 'media', name: 'Education Insights (Media)', description: 'Video gallery section.' },
                    { id: 'events', name: 'Upcoming Events', description: 'List of upcoming events and webinars.' },
                    { id: 'admissions', name: 'Admissions Process', description: 'Step-by-step guide to applying.' },
                    { id: 'social', name: 'Social Feed', description: 'Latest updates from social media.' },
                    { id: 'contact', name: 'Contact Us', description: 'Footer contact form and address details.' },
                ];

                const toggleSection = (id: string) => {
                    if (!siteSettings) return;
                    const current = siteSettings.visibleSections || {};
                    const isVisible = current[id] !== false;
                    setSiteSettings({
                        ...siteSettings,
                        visibleSections: { ...current, [id]: !isVisible }
                    });
                };

                return (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Page Section Visibility</h2>
                                <p className="text-sm text-gray-500 mt-1">Toggle which sections appear on the main homepage.</p>
                            </div>
                            <button
                                onClick={handleSettingsSubmit}
                                disabled={loading}
                                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-semibold shadow-lg shadow-blue-600/20 text-sm"
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sections.map(section => {
                                const isVisible = siteSettings?.visibleSections?.[section.id] !== false;
                                return (
                                    <div key={section.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${isVisible ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50'}`}>
                                        <label className="relative inline-flex items-center cursor-pointer mt-1">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={isVisible}
                                                onChange={() => toggleSection(section.id)}
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{section.name}</h4>
                                            <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'consultation':
                const currentConsultations = consultations;

                return (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Consultation Requests</h2>
                        <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Student Name</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Contact</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Interest</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Program</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Comments</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Last Course</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Score</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentConsultations.map(consultation => (
                                        <tr key={consultation.id} className={`hover:bg-gray-50/50 transition ${!consultation.read ? 'bg-blue-50 font-semibold' : ''}`}>
                                            <td className="p-4">
                                                <p className="font-semibold text-gray-900 flex items-center gap-2">
                                                    {consultation.name}
                                                    {!consultation.read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-medium text-gray-600">{consultation.phone}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {consultation.interest}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm font-medium text-charcoal">{consultation.selectedProgram || ''}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-500 line-clamp-1 max-w-[200px]">
                                                    {consultation.comment || ''}
                                                </p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-600">{consultation.lastAttendedCourse || '-'}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-600">{consultation.percentage ? `${consultation.percentage}` : '-'}</p>
                                            </td>
                                            <td className="p-4 flex gap-2">
                                                <button
                                                    onClick={() => setSelectedConsultation(consultation)}
                                                    className="text-blue-500 hover:text-blue-700 text-xs font-bold uppercase tracking-wider"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => handleDelete('consultations', consultation.id!)}
                                                    className="text-red-500 hover:text-red-700 text-xs font-bold uppercase tracking-wider"
                                                >
                                                    Archive
                                                </button>
                                                {!consultation.read && (
                                                    <button
                                                        onClick={() => handleMarkAsRead('consultations', consultation.id!)}
                                                        className="text-blue-600 hover:text-blue-900 text-xs font-bold uppercase tracking-wider"
                                                    >
                                                        Mark Read
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {consultations.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-gray-500">
                                                No consultation requests yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>

                            <PaginationControls />
                        </div>
                    </div>

                );


            case 'help':
                return (
                    <div className="space-y-8 max-w-5xl mx-auto pb-12">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-lg animate-in fade-in duration-500">
                            <h2 className="text-3xl font-semibold mb-2">Admin Dashboard Guide</h2>
                            <p className="text-blue-100 text-lg">
                                Master the Fortex Education control panel with these detailed instructions.
                            </p>
                        </div>

                        <div className="grid gap-8 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                            {/* 1. User Data & Leads */}
                            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                    <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">User Data & Leads</h3>
                                </div>
                                <div className="p-6 grid md:grid-cols-2 gap-8">
                                    <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            Students Tab
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            Lists all users who have signed up on the website.
                                            <br />
                                            <strong>Key Action:</strong> Monitor the total number of registered users compared to leads generated.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors border border-green-100 bg-green-50/30">
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                            Leads Tab (Priority)
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            Tracks students confirming interest in specific colleges/universities.
                                        </p>
                                        <ul className="mt-2 text-sm text-gray-700 space-y-1 list-disc pl-4">
                                            <li><strong>Unread Indicators:</strong> New leads appear with a blue dot and bold text.</li>
                                            <li><strong>Export:</strong> Click "Export Excel" to download data for offline processing.</li>
                                            <li><strong>Details:</strong> View Phone, Email, Location, and Grade percentage.</li>
                                        </ul>
                                    </div>
                                    <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                            Consultations
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            Manage "Book a Consultation" requests.
                                            <br />
                                            <strong>Action:</strong> Call the student on the provided number, then click the "Mark Read" button (or the row itself) to clear the notification.
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                            Inquiries
                                        </h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            General messages from the "Contact Us" footer form.
                                            <br />
                                            <strong>Action:</strong> Review subject and message, reply via email, and mark as read.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* 2. Content Management */}
                            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                    <div className="bg-purple-100 text-purple-600 p-2 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">Content Management</h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                            <h4 className="font-bold text-gray-900 mb-2">Affiliated Colleges & Universities</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                                These tabs control the listings on the main "Colleges" and "Universities" pages.
                                            </p>
                                            <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                                                <li><strong>Add New:</strong> Click the "+ Add College/University" button. Fill in the Name, Location, Description, and use a public URL for the image.</li>
                                                <li><strong>Delete:</strong> Use the trash icon to remove an institution.</li>
                                            </ol>
                                        </div>
                                        <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                            <h4 className="font-bold text-gray-900 mb-2">Education Insights (Videos)</h4>
                                            <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                                Manage the video gallery section.
                                            </p>
                                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                                                <li>Paste a full YouTube URL (e.g., <code>https://www.youtube.com/watch?v=...</code>).</li>
                                                <li>The system will automatically extract the Thumbnail.</li>
                                                <li>Assign a category (e.g., "Career Guidance") for filtering.</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 3. Site Configuration */}
                            <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-center gap-3">
                                    <div className="bg-gray-100 text-gray-600 p-2 rounded-lg">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900">Site Configuration</h3>
                                </div>
                                <div className="p-6 grid md:grid-cols-2 gap-8">
                                    <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <h4 className="font-semibold text-gray-900 mb-2">Page Control</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                                            Turn sections of the homepage ON or OFF instantly.
                                        </p>
                                        <div className="bg-gray-50 rounded p-3 border border-gray-100 text-sm">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-8 h-4 bg-green-500 rounded-full relative shadow-sm">
                                                    <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                                                </div>
                                                <span className="text-gray-700 font-medium">Green = Visible</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-4 bg-gray-300 rounded-full relative shadow-sm">
                                                    <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full"></div>
                                                </div>
                                                <span className="text-gray-500 font-medium">Grey = Hidden</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 rounded-lg hover:bg-gray-50 transition-colors">
                                        <h4 className="font-semibold text-gray-900 mb-2">General Settings</h4>
                                        <p className="text-gray-600 text-sm leading-relaxed">
                                            Search Engine Optimization (SEO) & Branding.
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                                            <li><strong>Hero Title/Subtitle:</strong> The first text users see.</li>
                                            <li><strong>Contact Info:</strong> Updates footer, contact page, and WhatsApp button.</li>
                                            <li><strong>Social Links:</strong> Updates footer icons.</li>
                                            <li><strong>Logo URL:</strong> Updates the navbar logo.</li>
                                        </ul>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                );

            case 'events':
                const currentEvents = events;

                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Upcoming Events</h2>
                            <button
                                onClick={() => { setIsAdding(!isAdding); setFormData({}); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                {isAdding ? 'Cancel' : '+ Add Event'}
                            </button>
                        </div>

                        {isAdding && (
                            <form onSubmit={handleAddSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Nursing Career Webinar"
                                            value={formData.title || ''}
                                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. May 24, 2025"
                                            value={formData.date || ''}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. 10:00 AM"
                                            value={formData.time || ''}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Zoom / Office"
                                            value={formData.location || ''}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={formData.type || ''}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            <option value="">Select Type</option>
                                            <option value="Webinar">Webinar</option>
                                            <option value="Orientation">Orientation</option>
                                            <option value="Class">Class</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Registration Link (Optional)</label>
                                        <input
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://..."
                                            value={formData.registrationLink || ''}
                                            onChange={e => setFormData({ ...formData, registrationLink: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Image</label>
                                        <div className="flex items-center gap-4">
                                            {formData.imageUrl && (
                                                <img src={formData.imageUrl} alt="Preview" className="h-12 w-12 object-cover rounded border border-gray-200" />
                                            )}
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="url"
                                                    placeholder="Paste image URL here..."
                                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    value={formData.imageUrl || ''}
                                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                                />
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleEventImageUpload}
                                                        className="hidden"
                                                    />
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                        Upload
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            rows={4}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Provide more details about the event..."
                                            value={formData.description || ''}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                                        Save Event
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentEvents.map(event => (
                                <div key={event.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
                                    <div className={`h-2 w-full ${event.type === 'Webinar' ? 'bg-purple-500' : event.type === 'Orientation' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                    {event.imageUrl && (
                                        <div className="h-40 overflow-hidden bg-gray-100">
                                            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="p-5">
                                        <span className={`inline-block px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-widest mb-3 ${event.type === 'Webinar' ? 'bg-purple-100 text-purple-600' : event.type === 'Orientation' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                            {event.type}
                                        </span>
                                        <h3 className="font-semibold text-lg text-gray-900 mb-2">{event.title}</h3>
                                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                {event.date}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                {event.time}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                                {event.location}
                                            </div>
                                        </div>

                                        <div className="flex mt-4 gap-3 pt-4 border-t border-gray-100">
                                            <button
                                                onClick={() => {
                                                    setFormData(event);
                                                    setEditingId(event.id);
                                                    setIsAdding(true);
                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                }}
                                                className="flex-1 text-center py-2 text-blue-600 text-sm font-medium hover:bg-blue-50 rounded-lg transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete('events', event.id)}
                                                className="flex-1 text-center py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {!isAdding && events.length === 0 && (
                                <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                    No upcoming events added yet.
                                </div>
                            )}
                        </div>
                        <PaginationControls />
                    </div>
                );

            case 'reviews':
                return (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-gray-800">Student Reviews</h2>
                            <button
                                onClick={() => { setIsAdding(!isAdding); setFormData({ rating: 5 }); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                {isAdding ? 'Cancel' : '+ Add Review'}
                            </button>
                        </div>

                        {isAdding && (
                            <form onSubmit={(e) => {
                                e.preventDefault();
                                handleAddSubmit(e);
                            }} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in slide-in-from-top-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. Sarah Johnson"
                                            value={formData.studentName || ''}
                                            onChange={e => setFormData({ ...formData, studentName: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Program</label>
                                        <input
                                            required
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="e.g. BSc Nursing"
                                            value={formData.program || ''}
                                            onChange={e => setFormData({ ...formData, program: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={formData.rating || 5}
                                            onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                                        >
                                            <option value="5">5 - Excellent</option>
                                            <option value="4">4 - Very Good</option>
                                            <option value="3">3 - Good</option>
                                            <option value="2">2 - Fair</option>
                                            <option value="1">1 - Poor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Photo</label>
                                        <div className="flex items-center gap-4">
                                            {formData.imageUrl && (
                                                <img src={formData.imageUrl} alt="Preview" className="h-10 w-10 object-cover rounded-full border border-gray-200" />
                                            )}
                                            <div className="flex-1 flex gap-2">
                                                <input
                                                    type="url"
                                                    placeholder="Paste URL here..."
                                                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    value={formData.imageUrl || ''}
                                                    onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                                />
                                                <label className="cursor-pointer">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleReviewImageUpload}
                                                        className="hidden"
                                                    />
                                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                                        Upload
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Testimonial</label>
                                        <textarea
                                            required
                                            rows={4}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="What did the student say about their experience?"
                                            value={formData.content || ''}
                                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-medium">
                                        Save Review
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {reviews.map(review => (
                                <div key={review.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition p-6 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
                                                {review.imageUrl ? (
                                                    <img src={review.imageUrl} alt={review.studentName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                                                        {review.studentName.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{review.studentName}</h3>
                                                <p className="text-xs text-blue-600 font-medium">{review.program}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex-grow">
                                        <p className="text-gray-600 text-sm italic leading-relaxed line-clamp-4">"{review.content}"</p>
                                    </div>

                                    <div className="flex mt-6 px-4 pt-4 border-t border-gray-100 -mx-6 mb-[-24px] pb-6 bg-gray-50/50">
                                        <button
                                            onClick={() => handleDelete('reviews', review.id!)}
                                            className="w-full text-center py-2 text-red-600 text-sm font-medium hover:bg-red-50 rounded-lg transition"
                                        >
                                            Delete Review
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {!isAdding && reviews.length === 0 && (
                                <div className="col-span-full py-16 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No reviews yet</h3>
                                    <p className="text-gray-500 mt-1 mb-4">Add your first student testimonial to showcase success stories.</p>
                                    <button
                                        onClick={() => { setIsAdding(true); setFormData({}); }}
                                        className="text-blue-600 font-medium hover:text-blue-800"
                                    >
                                        + Add Review
                                    </button>
                                </div>
                            )}
                        </div>
                        <PaginationControls />
                    </div>
                );

            default:
                return null;
        }
    };

    const unreadLeads = leads.filter(l => !l.read).length;
    const unreadConsultations = consultations.filter(c => !c.read).length;
    const unreadInquiries = inquiries.filter(i => !i.read).length;

    const navItems = [
        {
            id: 'students', label: 'Students', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            )
        },
        {
            id: 'leads', label: 'Leads', icon: (
                <div className="relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                    {unreadLeads > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
                </div>
            )
        },
        {
            id: 'services', label: 'Services', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            )
        },
        {
            id: 'colleges', label: 'Affiliated Colleges', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            )
        },
        {
            id: 'universities', label: 'Universities', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
            )
        },
        {
            id: 'consultation', label: 'Consultation Requests', icon: (
                <div className="relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {unreadConsultations > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
                </div>
            )
        },
        {
            id: 'education-insights', label: 'Education Insights', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )
        },
        {
            id: 'inquiries', label: 'Inquiries', icon: (
                <div className="relative">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    {unreadInquiries > 0 && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span>}
                </div>
            )
        },
        {
            id: 'events', label: 'Events', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            )
        },
        {
            id: 'reviews', label: 'Student Reviews', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>
            )
        },
        {
            id: 'general', label: 'General Settings', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )
        },
        {
            id: 'sections', label: 'Page Control', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
            )
        },
        {
            id: 'help', label: 'How to Use', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-900 text-white flex flex-col fixed inset-y-0 left-0 z-50">
                <div className="p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-semibold text-white">F</div>
                        <span className="text-lg font-semibold tracking-wide">Fortex Admin</span>
                    </div>
                </div>

                <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setIsAdding(false); setFormData({}); setCurrentPage(1); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${activeTab === item.id
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-800">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <img
                            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0D8ABC&color=fff`}
                            className="w-9 h-9 rounded-full bg-gray-700"
                            alt="Admin"
                        />
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{user.name}</p>
                            <p className="text-xs text-gray-400">Administrator</p>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-8">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 capitalize">{navItems.find(i => i.id === activeTab)?.label}</h1>
                        <p className="text-gray-500 text-sm mt-1">Manage and view your {activeTab} information here.</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-xs font-medium text-gray-600">System Online</span>
                    </div>
                </header>

                {renderContent()}
            </main>

            {/* Consultation Detail Modal */}
            {selectedConsultation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-charcoal/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div
                        className="bg-white w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-500"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-start">
                            <div className="space-y-1">
                                <h3 className="text-xl md:text-2xl font-bold text-charcoal">{selectedConsultation.name}</h3>
                                <p className="text-sm text-charcoal/40 font-medium tracking-wide uppercase">Enquiry Details</p>
                            </div>
                            <button
                                onClick={() => setSelectedConsultation(null)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-charcoal/40"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 md:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            {/* Academic Interest & Program */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest block">Academic Interest</label>
                                    <p className="text-base font-semibold text-charcoal bg-blue-50 px-3 py-1 rounded-lg inline-block">{selectedConsultation.interest}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest block">Selected Program</label>
                                    <p className="text-base font-semibold text-charcoal">{selectedConsultation.selectedProgram || 'Standard Consultancy'}</p>
                                </div>
                            </div>

                            {/* Contact & Date */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest block">Phone Number</label>
                                    <a href={`tel:${selectedConsultation.phone}`} className="text-base font-semibold text-accent hover:underline flex items-center gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                        {selectedConsultation.phone}
                                    </a>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest block">Submitted On</label>
                                    <p className="text-base font-semibold text-charcoal">
                                        {selectedConsultation.createdAt instanceof Date
                                            ? selectedConsultation.createdAt.toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: 'numeric',
                                                minute: '2-digit',
                                                hour12: true
                                            })
                                            : 'Just now'}
                                    </p>
                                </div>
                            </div>

                            {/* Academic History */}
                            {(selectedConsultation.lastAttendedCourse || selectedConsultation.percentage) && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-50">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest block">Last Attended Course</label>
                                        <p className="text-base font-semibold text-charcoal">{selectedConsultation.lastAttendedCourse || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest block">Score/Percentage</label>
                                        <p className="text-base font-semibold text-charcoal">{selectedConsultation.percentage || '-'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Comments */}
                            <div className="space-y-3 pt-6 border-t border-slate-50">
                                <label className="text-[10px] font-bold text-charcoal/30 uppercase tracking-widest block">Personalized Message</label>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-charcoal/70 text-base leading-relaxed">
                                    "{selectedConsultation.comment || 'No specific comment provided.'}"
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex justify-center items-center">
                            <button
                                onClick={() => setSelectedConsultation(null)}
                                className="px-12 py-3 bg-charcoal text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] active:scale-98 transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
