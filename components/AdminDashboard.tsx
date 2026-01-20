import React, { useEffect, useState } from 'react';
import { User, Service, College, University, Lead, SiteSettings, Consultation, EducationInsight, Inquiry, Event } from '../types';
import { db, collection, getDocs, addDoc, deleteDoc, updateDoc, doc, storage, query, orderBy, limit, startAfter, getCountFromServer, QueryDocumentSnapshot, DocumentData } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getSiteSettings, saveSiteSettings } from '../services/db';
import * as XLSX from 'xlsx';

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

    // Form State
    const [isAdding, setIsAdding] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

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
            const isTimeOrdered = ['leads', 'consultations', 'inquiries', 'education-insights'].includes(collectionName);

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
            'events': 'events'
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
                    'events': 'events'
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
        initData();
    }, [activeTab]);

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

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLoading(true);
            try {
                const storageRef = ref(storage, `logos / ${Date.now()}_${file.name} `);
                await uploadBytes(storageRef, file);
                const url = await getDownloadURL(storageRef);
                setSiteSettings(prev => ({ ...prev, logoUrl: url }));
            } catch (error) {
                console.error("Error uploading logo:", error);
                alert("Failed to upload logo.");
            } finally {
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
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
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
                                                        </div >
                                                    </div >
                                                </td >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600">{student.email}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                        Active
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    <button className="text-blue-600 hover:text-blue-900 font-medium">View Details</button>
                                                </td>
                                            </tr >
                                        ))}
                                    </tbody >
                                </table >
                            </div >
                        )}
                        <PaginationControls />
                    </div >
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
                            <button
                                onClick={() => { setIsAdding(!isAdding); setFormData({}); setEditingId(null); }}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                            >
                                {isAdding ? 'Cancel' : '+ Add Service'}
                            </button>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                        <input
                                            required
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://example.com/image.jpg"
                                            value={formData.imageUrl || ''}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
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
                                        <input
                                            required
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://example.com/campus.jpg"
                                            value={formData.imageUrl || ''}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Website Logo URL</label>
                                            <div className="flex items-center gap-4">
                                                {siteSettings.logoUrl && (
                                                    <img src={siteSettings.logoUrl} alt="Logo Preview" className="h-10 w-10 object-contain rounded border border-gray-200 bg-gray-50" />
                                                )}
                                                <input
                                                    type="url"
                                                    placeholder="https://example.com/logo.png"
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    value={siteSettings.logoUrl || ''}
                                                    onChange={e => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Tip: Since file uploads require cloud storage, you can host your logo on a free service like Imgur or use a direct link from your existing website.
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
                                            <label className="block text-sm font-medium text-gray-700 mb-1">About Image URL</label>
                                            <div className="flex items-center gap-4">
                                                {siteSettings.aboutImageUrl && (
                                                    <img src={siteSettings.aboutImageUrl} alt="About Preview" className="h-12 w-12 object-cover rounded border border-gray-200" />
                                                )}
                                                <input
                                                    type="url"
                                                    placeholder="https://images.unsplash.com/photo-..."
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500"
                                                    value={siteSettings.aboutImageUrl || ''}
                                                    onChange={e => setSiteSettings({ ...siteSettings, aboutImageUrl: e.target.value })}
                                                />
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
                        )}
                    </div>
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
                                        <input
                                            required
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://example.com/university.jpg"
                                            value={formData.imageUrl || ''}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tag Service</label>
                                        <select
                                            required
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={formData.serviceTag || ''}
                                            onChange={e => setFormData({ ...formData, serviceTag: e.target.value })}
                                        >
                                            <option value="">Select a Service</option>
                                            {services.map(service => (
                                                <option key={service.id} value={service.title}>{service.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
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
                                                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-semibold uppercase rounded-md mb-2">
                                                    {item.serviceTag}
                                                </span>
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
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Last Course</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Score</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">Preferred Date</th>
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
                                                <p className="text-sm text-gray-600">{consultation.lastAttendedCourse || '-'}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-sm text-gray-600">{consultation.percentage ? `${consultation.percentage}` : '-'}</p>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                {consultation.date}
                                            </td>
                                            <td className="p-4 flex gap-2">
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Image URL</label>
                                        <input
                                            type="url"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="https://example.com/event-image.jpg"
                                            value={formData.imageUrl || ''}
                                            onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                                        />
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
        </div>
    );
};

export default AdminDashboard;
