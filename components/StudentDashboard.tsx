import React, { useState, useEffect } from 'react';
import { User, SiteSettings } from '../types';
import { useNavigate } from 'react-router-dom';
import { uploadStudentDocument } from '../services/storage';
import { updateStudentProfile } from '../services/db';
import { db, doc, onSnapshot } from '../firebase';
import { motion, AnimatePresence } from 'framer-motion';
import ApplicationForm from './ApplicationForm';

interface StudentDashboardProps {
    user: User | null;
    onLogout: () => void;
    siteSettings: SiteSettings | null;
}

type ViewType = 'dashboard' | 'profile' | 'update' | 'application';

// --- External Components ---
// Defined outside to prevent re-mounting on parent re-renders

const SidebarItem = ({ view, label, icon, active, onClick }: { view: ViewType, label: string, icon: React.ReactNode, active: boolean, onClick: (view: ViewType) => void }) => (
    <button
        onClick={() => onClick(view)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
            : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600'
            }`}
    >
        {icon}
        <span className="font-medium">{label}</span>
    </button>
);

const DataGroup = ({ label, value }: { label: string, value: string }) => (
    <div>
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-1">{label}</span>
        <span className="text-lg font-medium text-gray-900">{value}</span>
    </div>
);

const InputField = ({ label, name, value, onChange, type = "text" }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
        />
    </div>
);


const StudentDashboard: React.FC<StudentDashboardProps> = ({ user: initialUser, onLogout, siteSettings }) => {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
    const [activeView, setActiveView] = useState<ViewType>('dashboard');
    const [loading, setLoading] = useState(false);

    // Dynamic Document Upload State
    const [newDocLabel, setNewDocLabel] = useState('');
    const [uploadingDoc, setUploadingDoc] = useState(false);

    // Initial form data - updated when currentUser changes
    const [formData, setFormData] = useState({
        name: currentUser?.name || '',
        mobile: currentUser?.mobile || '',
        dob: currentUser?.dob || '',
        gender: currentUser?.gender || '',
        address: currentUser?.address || '',
    });

    // Real-time listener for user data updates
    useEffect(() => {
        if (!initialUser?.id) return;

        const unsub = onSnapshot(doc(db, 'students', initialUser.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as User;
                setCurrentUser(data);
                // Update local storage to keep it fresh for reloads
                localStorage.setItem('fortex_user', JSON.stringify(data));

                // Update form data to reflect remote changes
                setFormData(prev => ({
                    ...prev,
                    name: data.name,
                    mobile: data.mobile || '',
                    dob: data.dob || '',
                    gender: data.gender || '',
                    address: data.address || '',
                }));
            }
        });

        return () => unsub();
    }, [initialUser?.id]);


    if (!currentUser) {
        navigate('/');
        return null; // Or loading spinner
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            if (currentUser) {
                await updateStudentProfile(currentUser.id, { ...formData });
                alert('Profile updated successfully!');
                // No reload needed, onSnapshot will update UI
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!newDocLabel.trim()) {
            alert('Please enter a document name first.');
            e.target.value = ''; // Reset file input
            return;
        }

        if (e.target.files && e.target.files[0]) {
            setUploadingDoc(true);
            try {
                const file = e.target.files[0];
                // Use the label as the docType for storage filename prefix
                const downloadUrl = await uploadStudentDocument(file, currentUser.id, newDocLabel.replace(/\s+/g, '_'));

                const newDocument = {
                    name: newDocLabel,
                    url: downloadUrl,
                    date: new Date().toISOString()
                };

                const currentDocs = currentUser.documents || [];
                const updatedDocs = [...currentDocs, newDocument];

                await updateStudentProfile(currentUser.id, { documents: updatedDocs });

                alert(`"${newDocLabel}" uploaded successfully!`);
                setNewDocLabel(''); // Reset label
                // No reload needed, onSnapshot will update UI
            } catch (error) {
                console.error(`Error uploading document:`, error);
                alert('Failed to upload document.');
            } finally {
                setUploadingDoc(false);
                e.target.value = ''; // Reset file input
            }
        }
    };

    // --- Render Helpers (Functions, not Components) ---

    // Using render functions instead of components to avoid unnecessary re-creation/remounting
    // which causes focus loss on inputs.

    const renderDashboardView = () => (
        <div className="h-full flex flex-col justify-center items-center text-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-2xl overflow-hidden mb-8">
                {currentUser.picture ? (
                    <img src={currentUser.picture} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold bg-gradient-to-br from-blue-400 to-purple-500 text-white">
                        {currentUser.name.charAt(0)}
                    </div>
                )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
                Welcome back, <span className="text-blue-600">{currentUser.name.split(' ')[0]}</span>!
            </h1>
            <p className="text-xl text-gray-500 max-w-lg">
                Your future starts here. Manage your profile and applications from this dashboard.
            </p>
        </div>
    );

    const renderProfileDetailsView = () => (
        <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-charcoal border-b border-gray-100 pb-4">My Profile</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <DataGroup label="Full Name" value={currentUser.name} />
                    <DataGroup label="Email Address" value={currentUser.email} />
                    <DataGroup label="Mobile Number" value={currentUser.mobile || 'Not set'} />
                </div>
                <div className="space-y-6">
                    <DataGroup label="Date of Birth" value={currentUser.dob || 'Not set'} />
                    <DataGroup label="Gender" value={currentUser.gender || 'Not set'} />
                    <DataGroup label="Address" value={currentUser.address || 'Not set'} />
                </div>
            </div>

            <div className="pt-8 border-t border-gray-100">
                <h3 className="text-lg font-semibold text-charcoal mb-4">Uploaded Documents</h3>
                {currentUser.documents && currentUser.documents.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {currentUser.documents.map((doc, index) => (
                            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                <div>
                                    <span className="text-sm font-medium text-gray-700 block">{doc.name}</span>
                                    <span className="text-xs text-gray-500">{new Date(doc.date).toLocaleDateString()}</span>
                                </div>
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs font-semibold text-green-600 bg-green-100 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                                >
                                    View
                                </a>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-sm italic">No documents uploaded yet.</p>
                )}
            </div>
        </div>
    );

    const renderUpdateProfileView = () => (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500">
            <h2 className="text-2xl font-bold text-charcoal border-b border-gray-100 pb-4 mb-8">Update Profile & Documents</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Form */}
                <div className="space-y-5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                    <h4 className="font-semibold text-gray-900 mb-2">Personal Details</h4>

                    <InputField label="Full Name" name="name" value={formData.name} onChange={handleInputChange as any} />
                    <InputField label="Mobile Number" name="mobile" value={formData.mobile} onChange={handleInputChange as any} type="tel" />
                    <InputField label="Date of Birth" name="dob" value={formData.dob} onChange={handleInputChange as any} type="date" />

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select
                            name="gender"
                            value={formData.gender}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50"
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50/50 resize-none"
                            placeholder="Enter your full address"
                        />
                    </div>

                    <button
                        onClick={handleSaveProfile}
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 mt-4"
                    >
                        {loading ? 'Saving Changes...' : 'Save Profile'}
                    </button>
                </div>

                {/* Uploads */}
                <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
                    <h4 className="font-semibold text-gray-900 mb-2">My Documents</h4>

                    {/* Add Document Form */}
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Add New Document</label>
                        <input
                            type="text"
                            placeholder="Document Name (e.g. Resume)"
                            value={newDocLabel}
                            onChange={(e) => setNewDocLabel(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        />
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="file"
                                    id="dynamic-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    disabled={uploadingDoc}
                                />
                                <label
                                    htmlFor="dynamic-upload"
                                    className={`w-full block text-center px-4 py-2 rounded-lg cursor-pointer transition-all border text-sm font-medium ${uploadingDoc
                                        ? 'bg-gray-100 text-gray-400 border-gray-200'
                                        : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                                        }`}
                                >
                                    {uploadingDoc ? 'Uploading...' : 'Select File & Upload'}
                                </label>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400">Supported formats: PDF, JPG, PNG.</p>
                    </div>

                    {/* List */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                        {currentUser.documents && currentUser.documents.length > 0 ? (
                            <div className="space-y-3">
                                {currentUser.documents.map((doc, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="shrink-0 p-2 rounded-full bg-blue-50 text-blue-600">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
                                                <p className="text-[10px] text-gray-500">{new Date(doc.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
                                        >
                                            View
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-gray-400 py-4">No documents uploaded.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-screen bg-white overflow-hidden flex flex-col">
            {/* Top Navbar - Fixed */}
            <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-6 py-3">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        {siteSettings?.logoUrl && (
                            <img src={siteSettings.logoUrl} alt="Fortex" className="h-9 w-auto" />
                        )}
                    </div>
                    {/* User Info & Logout */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                                {currentUser.name.charAt(0)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                        </div>
                        <button
                            onClick={onLogout}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            <span className="hidden sm:inline">Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Body below navbar */}
            <div className="flex flex-1 overflow-hidden pt-[60px]">
                {/* Sidebar (Desktop) */}
                <div className="w-64 bg-white border-r border-gray-100 flex-shrink-0 flex-col hidden md:flex">
                    <div className="p-6">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Menu</h2>
                        <div className="space-y-2">
                            <SidebarItem
                                view="dashboard"
                                label="Dashboard"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                                active={activeView === 'dashboard'}
                                onClick={setActiveView}
                            />
                            <SidebarItem
                                view="profile"
                                label="My Profile"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                active={activeView === 'profile'}
                                onClick={setActiveView}
                            />
                            <SidebarItem
                                view="update"
                                label="Update Profile"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                                active={activeView === 'update'}
                                onClick={setActiveView}
                            />
                            <SidebarItem
                                view="application"
                                label="Application Form"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                                active={activeView === 'application'}
                                onClick={setActiveView}
                            />
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-gray-500 hover:bg-red-50 hover:text-red-600 mt-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                <span className="font-medium">Sign Out</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Tab Bar (below top navbar) */}
                <div className="md:hidden fixed top-[60px] left-0 right-0 bg-white border-b border-gray-100 z-40 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                    <button onClick={() => setActiveView('dashboard')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeView === 'dashboard' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600'}`}>Dashboard</button>
                    <button onClick={() => setActiveView('profile')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeView === 'profile' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600'}`}>Profile</button>
                    <button onClick={() => setActiveView('update')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeView === 'update' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600'}`}>Update</button>
                    <button onClick={() => setActiveView('application')} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${activeView === 'application' ? 'bg-charcoal text-white' : 'bg-gray-100 text-gray-600'}`}>Application</button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-gray-50/50 p-6 md:p-12 pb-24 md:pb-12 mt-12 md:mt-0">
                    {activeView === 'dashboard' && renderDashboardView()}
                    {activeView === 'profile' && renderProfileDetailsView()}
                    {activeView === 'update' && renderUpdateProfileView()}
                    {activeView === 'application' && <ApplicationForm user={currentUser} onBack={() => setActiveView('dashboard')} />}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
