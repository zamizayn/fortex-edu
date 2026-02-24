import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { db, collection, doc, setDoc, getDoc, serverTimestamp } from '../firebase';
import { uploadStudentDocument } from '../services/storage';
import { motion, AnimatePresence } from 'framer-motion';

interface ApplicationFormProps {
    user: User;
    onBack: () => void;
    isAdmin?: boolean;
}

interface ApplicationData {
    // Student Details
    studentDetails: {
        fullName: string;
        gender: string;
        dob: string;
        age: string;
        nationality: string;
        religion: string;
        community: string;
        caste: string;
        aadhaarNumber: string;
        studentMobile: string;
        studentEmail: string;
    };
    // Parent Details
    parentDetails: {
        fatherName: string;
        fatherMobile: string;
        fatherOccupation: string;
        motherName: string;
        motherMobile: string;
        motherOccupation: string;
        annualIncome: string;
    };
    // Address Details
    addressDetails: {
        houseNo: string;
        street: string;
        postOffice: string;
        district: string;
        state: string;
        pinCode: string;
    };
    // Academic Details
    academicDetails: {
        tenth: {
            schoolName: string;
            place: string;
            board: string;
            yearOfPassing: string;
            percentage: string;
        };
        plusTwo: {
            collegeName: string;
            stream: string;
            board: string;
            yearOfPassing: string;
            percentage: string;
        };
    };
    // Course Preference
    coursePreference: {
        courseApplyingFor: string;
        preferredColleges: string;
        preferredLocation: string;
        modeOfAdmission: string;
    };
    // Additional Info
    additionalInfo: {
        entranceExamAppeared: string;
        examNameAndScore: string;
        gapInStudies: string;
        gapReason: string;
    };
    // Documents
    documents: {
        sslcCertificate: { url: string; name: string } | null;
        plusTwoCertificate: { url: string; name: string } | null;
        aadhaarCard: { url: string; name: string } | null;
        passportPhoto: { url: string; name: string } | null;
        transferCertificate: { url: string; name: string } | null;
        migrationCertificate: { url: string; name: string } | null;
    };
    // Declaration
    declaration: {
        place: string;
        date: string;
        agreed: boolean;
    };
}

const SECTIONS = [
    { id: 0, title: 'Student Details', icon: '👤' },
    { id: 1, title: 'Parent/Guardian Details', icon: '👨‍👩‍👧' },
    { id: 2, title: 'Address Details', icon: '🏠' },
    { id: 3, title: 'Academic Details', icon: '📚' },
    { id: 4, title: 'Course Preference', icon: '🎓' },
    { id: 5, title: 'Additional Information', icon: 'ℹ️' },
    { id: 6, title: 'Document Upload', icon: '📄' },
    { id: 7, title: 'Declaration', icon: '✍️' },
];

const ApplicationForm: React.FC<ApplicationFormProps> = ({ user, onBack, isAdmin }) => {
    const [currentSection, setCurrentSection] = useState(0);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);

    const [formData, setFormData] = useState<ApplicationData>({
        studentDetails: {
            fullName: user.name || '',
            gender: user.gender || '',
            dob: user.dob || '',
            age: '',
            nationality: '',
            religion: '',
            community: '',
            caste: '',
            aadhaarNumber: '',
            studentMobile: user.mobile || '',
            studentEmail: user.email || '',
        },
        parentDetails: {
            fatherName: '',
            fatherMobile: '',
            fatherOccupation: '',
            motherName: '',
            motherMobile: '',
            motherOccupation: '',
            annualIncome: '',
        },
        addressDetails: {
            houseNo: '',
            street: '',
            postOffice: '',
            district: '',
            state: '',
            pinCode: '',
        },
        academicDetails: {
            tenth: {
                schoolName: '',
                place: '',
                board: '',
                yearOfPassing: '',
                percentage: '',
            },
            plusTwo: {
                collegeName: '',
                stream: '',
                board: '',
                yearOfPassing: '',
                percentage: '',
            },
        },
        coursePreference: {
            courseApplyingFor: '',
            preferredColleges: '',
            preferredLocation: '',
            modeOfAdmission: '',
        },
        additionalInfo: {
            entranceExamAppeared: '',
            examNameAndScore: '',
            gapInStudies: '',
            gapReason: '',
        },
        documents: {
            sslcCertificate: null,
            plusTwoCertificate: null,
            aadhaarCard: null,
            passportPhoto: null,
            transferCertificate: null,
            migrationCertificate: null,
        },
        declaration: {
            place: '',
            date: new Date().toISOString().split('T')[0],
            agreed: false,
        },
    });

    // Load existing application data
    useEffect(() => {
        const loadApplication = async () => {
            try {
                const appDoc = await getDoc(doc(db, 'applications', user.id));
                if (appDoc.exists()) {
                    const data = appDoc.data() as any;
                    setFormData(data);
                    setCurrentSection(data.currentSection || 0);
                }
            } catch (error) {
                console.error('Error loading application:', error);
            }
        };
        loadApplication();
    }, [user.id]);

    // Auto-calculate age from DOB
    useEffect(() => {
        if (formData.studentDetails.dob) {
            const birthDate = new Date(formData.studentDetails.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            setFormData(prev => ({
                ...prev,
                studentDetails: { ...prev.studentDetails, age: age.toString() }
            }));
        }
    }, [formData.studentDetails.dob]);

    // Auto-save draft
    useEffect(() => {
        const autoSave = async () => {
            if (saving || isAdmin) return;
            setSaving(true);
            try {
                await setDoc(doc(db, 'applications', user.id), {
                    ...formData,
                    studentId: user.id,
                    studentName: user.name,
                    studentEmail: user.email,
                    status: 'draft',
                    currentSection,
                    updatedAt: serverTimestamp(),
                }, { merge: true });
            } catch (error) {
                console.error('Auto-save error:', error);
            } finally {
                setSaving(false);
            }
        };

        const timer = setTimeout(autoSave, 2000);
        return () => clearTimeout(timer);
    }, [formData, currentSection, user.id, user.name, user.email]);

    const handleInputChange = (section: keyof ApplicationData, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleNestedInputChange = (section: keyof ApplicationData, subsection: string, field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [subsection]: {
                    ...(prev[section] as any)[subsection],
                    [field]: value
                }
            }
        }));
    };

    const handleFileUpload = async (docType: keyof ApplicationData['documents'], file: File) => {
        setUploadingDoc(docType);
        try {
            const downloadUrl = await uploadStudentDocument(file, user.id, docType);
            setFormData(prev => ({
                ...prev,
                documents: {
                    ...prev.documents,
                    [docType]: { url: downloadUrl, name: file.name }
                }
            }));
            alert(`${docType} uploaded successfully!`);
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload document.');
        } finally {
            setUploadingDoc(null);
        }
    };

    const validateSection = (sectionId: number): boolean => {
        // Add validation logic for each section
        return true; // Simplified for now
    };

    const handleNext = () => {
        if (validateSection(currentSection)) {
            if (currentSection < SECTIONS.length - 1) {
                setCurrentSection(currentSection + 1);
            }
        }
    };

    const handlePrevious = () => {
        if (currentSection > 0) {
            setCurrentSection(currentSection - 1);
        }
    };

    const handleSubmit = async () => {
        if (!formData.declaration.place.trim() || !formData.declaration.date) {
            alert('Please fill in the Place and Date in the declaration section.');
            return;
        }

        if (!formData.declaration.agreed) {
            alert('Please agree to the declaration before submitting.');
            return;
        }

        setLoading(true);
        try {
            await setDoc(doc(db, 'applications', user.id), {
                ...formData,
                studentId: user.id,
                studentName: user.name,
                studentEmail: user.email,
                status: 'submitted',
                currentSection,
                submittedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            alert('Application submitted successfully!');
            onBack();
        } catch (error) {
            console.error('Submission error:', error);
            alert('Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    const progress = ((currentSection + 1) / SECTIONS.length) * 100;

    return (
        <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-charcoal mb-2">Student Application Form</h1>
                <p className="text-gray-600">Complete all sections to submit your application</p>
                {saving && <p className="text-xs text-blue-600 mt-2">💾 Auto-saving...</p>}
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Section Navigation */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-8">
                {SECTIONS.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => setCurrentSection(section.id)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all ${currentSection === section.id
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        <span className="mr-2">{section.icon}</span>
                        <span className="hidden md:inline">{section.title}</span>
                        <span className="md:hidden">{section.id + 1}</span>
                    </button>
                ))}
            </div>


            {/* Section content */}
            <div className="space-y-6">
                {/* Section 0: Student Details */}
                {currentSection === 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                            <input
                                type="text"
                                value={formData.studentDetails.fullName}
                                onChange={(e) => handleInputChange('studentDetails', 'fullName', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gender *</label>
                            <select
                                value={formData.studentDetails.gender}
                                onChange={(e) => handleInputChange('studentDetails', 'gender', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            >
                                <option value="">Select Gender</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth *</label>
                            <input
                                type="date"
                                value={formData.studentDetails.dob}
                                onChange={(e) => handleInputChange('studentDetails', 'dob', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                            <input
                                type="text"
                                value={formData.studentDetails.age}
                                readOnly
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Nationality *</label>
                            <input
                                type="text"
                                value={formData.studentDetails.nationality}
                                onChange={(e) => handleInputChange('studentDetails', 'nationality', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Religion *</label>
                            <input
                                type="text"
                                value={formData.studentDetails.religion}
                                onChange={(e) => handleInputChange('studentDetails', 'religion', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Community (Optional)</label>
                            <input
                                type="text"
                                value={formData.studentDetails.community}
                                onChange={(e) => handleInputChange('studentDetails', 'community', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Caste (Optional)</label>
                            <input
                                type="text"
                                value={formData.studentDetails.caste}
                                onChange={(e) => handleInputChange('studentDetails', 'caste', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Aadhaar Number *</label>
                            <input
                                type="text"
                                value={formData.studentDetails.aadhaarNumber}
                                onChange={(e) => handleInputChange('studentDetails', 'aadhaarNumber', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                maxLength={12}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Student Mobile *</label>
                            <input
                                type="tel"
                                value={formData.studentDetails.studentMobile}
                                onChange={(e) => handleInputChange('studentDetails', 'studentMobile', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Student Email *</label>
                            <input
                                type="email"
                                value={formData.studentDetails.studentEmail}
                                onChange={(e) => handleInputChange('studentDetails', 'studentEmail', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Section 1: Parent/Guardian Details */}
                {currentSection === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Father's Name *</label>
                            <input
                                type="text"
                                value={formData.parentDetails.fatherName}
                                onChange={(e) => handleInputChange('parentDetails', 'fatherName', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Father's Mobile *</label>
                            <input
                                type="tel"
                                value={formData.parentDetails.fatherMobile}
                                onChange={(e) => handleInputChange('parentDetails', 'fatherMobile', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Father's Occupation *</label>
                            <input
                                type="text"
                                value={formData.parentDetails.fatherOccupation}
                                onChange={(e) => handleInputChange('parentDetails', 'fatherOccupation', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Name *</label>
                            <input
                                type="text"
                                value={formData.parentDetails.motherName}
                                onChange={(e) => handleInputChange('parentDetails', 'motherName', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Mobile *</label>
                            <input
                                type="tel"
                                value={formData.parentDetails.motherMobile}
                                onChange={(e) => handleInputChange('parentDetails', 'motherMobile', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mother's Occupation *</label>
                            <input
                                type="text"
                                value={formData.parentDetails.motherOccupation}
                                onChange={(e) => handleInputChange('parentDetails', 'motherOccupation', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Annual Family Income (Optional)</label>
                            <input
                                type="text"
                                value={formData.parentDetails.annualIncome}
                                onChange={(e) => handleInputChange('parentDetails', 'annualIncome', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., 5,00,000"
                            />
                        </div>
                    </div>
                )}

                {/* Section 2: Address Details */}
                {currentSection === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">House Name / Flat No. *</label>
                            <input
                                type="text"
                                value={formData.addressDetails.houseNo}
                                onChange={(e) => handleInputChange('addressDetails', 'houseNo', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Street / Locality *</label>
                            <input
                                type="text"
                                value={formData.addressDetails.street}
                                onChange={(e) => handleInputChange('addressDetails', 'street', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Post Office *</label>
                            <input
                                type="text"
                                value={formData.addressDetails.postOffice}
                                onChange={(e) => handleInputChange('addressDetails', 'postOffice', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">District *</label>
                            <input
                                type="text"
                                value={formData.addressDetails.district}
                                onChange={(e) => handleInputChange('addressDetails', 'district', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                            <input
                                type="text"
                                value={formData.addressDetails.state}
                                onChange={(e) => handleInputChange('addressDetails', 'state', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">PIN Code *</label>
                            <input
                                type="text"
                                value={formData.addressDetails.pinCode}
                                onChange={(e) => handleInputChange('addressDetails', 'pinCode', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                maxLength={6}
                                required
                            />
                        </div>
                    </div>
                )}

                {/* Section 3: Academic Details */}
                {currentSection === 3 && (
                    <div className="space-y-8">
                        {/* 10th Standard */}
                        <div>
                            <h3 className="text-lg font-semibold text-charcoal mb-4 pb-2 border-b">10th Standard</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                                    <input
                                        type="text"
                                        value={formData.academicDetails.tenth.schoolName}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'tenth', 'schoolName', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Place *</label>
                                    <input
                                        type="text"
                                        value={formData.academicDetails.tenth.place}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'tenth', 'place', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Board *</label>
                                    <select
                                        value={formData.academicDetails.tenth.board}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'tenth', 'board', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Select Board</option>
                                        <option value="CBSE">CBSE</option>
                                        <option value="ICSE">ICSE</option>
                                        <option value="State Board">State Board</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year of Passing *</label>
                                    <input
                                        type="text"
                                        value={formData.academicDetails.tenth.yearOfPassing}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'tenth', 'yearOfPassing', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., 2020"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks / Percentage *</label>
                                    <input
                                        type="text"
                                        value={formData.academicDetails.tenth.percentage}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'tenth', 'percentage', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., 85%"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* +2 / Equivalent */}
                        <div>
                            <h3 className="text-lg font-semibold text-charcoal mb-4 pb-2 border-b">+2 / Equivalent</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">School / College Name *</label>
                                    <input
                                        type="text"
                                        value={formData.academicDetails.plusTwo.collegeName}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'plusTwo', 'collegeName', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Stream *</label>
                                    <select
                                        value={formData.academicDetails.plusTwo.stream}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'plusTwo', 'stream', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Select Stream</option>
                                        <option value="Science">Science</option>
                                        <option value="Commerce">Commerce</option>
                                        <option value="Humanities">Humanities</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Board *</label>
                                    <select
                                        value={formData.academicDetails.plusTwo.board}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'plusTwo', 'board', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        required
                                    >
                                        <option value="">Select Board</option>
                                        <option value="CBSE">CBSE</option>
                                        <option value="ICSE">ICSE</option>
                                        <option value="State Board">State Board</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Year of Passing *</label>
                                    <input
                                        type="text"
                                        value={formData.academicDetails.plusTwo.yearOfPassing}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'plusTwo', 'yearOfPassing', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., 2022"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks / Percentage *</label>
                                    <input
                                        type="text"
                                        value={formData.academicDetails.plusTwo.percentage}
                                        onChange={(e) => handleNestedInputChange('academicDetails', 'plusTwo', 'percentage', e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                        placeholder="e.g., 75%"
                                        required
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Section 4: Course & College Preference */}
                {currentSection === 4 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Course Applying For *</label>
                            <input
                                type="text"
                                value={formData.coursePreference.courseApplyingFor}
                                onChange={(e) => handleInputChange('coursePreference', 'courseApplyingFor', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., MBBS, B.Tech Computer Science"
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred College(s) *</label>
                            <textarea
                                value={formData.coursePreference.preferredColleges}
                                onChange={(e) => handleInputChange('coursePreference', 'preferredColleges', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows={3}
                                placeholder="List your preferred colleges (one per line)"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Location (State / City) *</label>
                            <input
                                type="text"
                                value={formData.coursePreference.preferredLocation}
                                onChange={(e) => handleInputChange('coursePreference', 'preferredLocation', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., Karnataka, Bangalore"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Mode of Admission *</label>
                            <select
                                value={formData.coursePreference.modeOfAdmission}
                                onChange={(e) => handleInputChange('coursePreference', 'modeOfAdmission', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            >
                                <option value="">Select Mode</option>
                                <option value="Merit">Merit</option>
                                <option value="Management">Management</option>
                                <option value="NRI">NRI</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Section 5: Additional Information */}
                {currentSection === 5 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Entrance Exam Appeared (Optional)</label>
                            <select
                                value={formData.additionalInfo.entranceExamAppeared}
                                onChange={(e) => handleInputChange('additionalInfo', 'entranceExamAppeared', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Select Option</option>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Entrance Exam Name & Score</label>
                            <input
                                type="text"
                                value={formData.additionalInfo.examNameAndScore}
                                onChange={(e) => handleInputChange('additionalInfo', 'examNameAndScore', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., NEET - 650/720"
                                disabled={formData.additionalInfo.entranceExamAppeared !== 'Yes'}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Any Gap in Studies (Optional)</label>
                            <select
                                value={formData.additionalInfo.gapInStudies}
                                onChange={(e) => handleInputChange('additionalInfo', 'gapInStudies', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                            >
                                <option value="">Select Option</option>
                                <option value="No">No</option>
                                <option value="Yes">Yes</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">If Yes, Reason</label>
                            <input
                                type="text"
                                value={formData.additionalInfo.gapReason}
                                onChange={(e) => handleInputChange('additionalInfo', 'gapReason', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Explain the reason"
                                disabled={formData.additionalInfo.gapInStudies !== 'Yes'}
                            />
                        </div>
                    </div>
                )}

                {/* Section 6: Document Upload */}
                {currentSection === 6 && (
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 mb-4">Upload all required documents (PDF, JPG, PNG - Max 5MB each)</p>

                        {[
                            { key: 'sslcCertificate', label: 'SSLC / 10th Certificate', required: true },
                            { key: 'plusTwoCertificate', label: '+2 Certificate / +1 Mark List', required: true },
                            { key: 'aadhaarCard', label: 'Aadhaar Card', required: true },
                            { key: 'passportPhoto', label: 'Passport Size Photograph', required: true },
                            { key: 'transferCertificate', label: 'Transfer Certificate', required: false },
                            { key: 'migrationCertificate', label: 'Migration Certificate', required: false },
                        ].map((doc) => (
                            <div key={doc.key} className="p-4 border border-gray-200 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        {doc.label} {doc.required && <span className="text-red-500">*</span>}
                                    </label>
                                    {formData.documents[doc.key as keyof ApplicationData['documents']] && (
                                        <span className="text-xs text-green-600 flex items-center gap-1">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            Uploaded
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="file"
                                        id={doc.key}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 5 * 1024 * 1024) {
                                                    alert('File size must be less than 5MB');
                                                    e.target.value = '';
                                                    return;
                                                }
                                                handleFileUpload(doc.key as keyof ApplicationData['documents'], file);
                                            }
                                        }}
                                        className="hidden"
                                    />
                                    <label
                                        htmlFor={doc.key}
                                        className={`flex-1 px-4 py-2 text-center rounded-lg border cursor-pointer transition-all ${uploadingDoc === doc.key
                                            ? 'bg-gray-100 text-gray-400 border-gray-200'
                                            : 'bg-white border-gray-300 text-gray-700 hover:border-blue-500 hover:text-blue-600'
                                            }`}
                                    >
                                        {uploadingDoc === doc.key ? 'Uploading...' : 'Choose File'}
                                    </label>
                                    {formData.documents[doc.key as keyof ApplicationData['documents']] && (
                                        <a
                                            href={formData.documents[doc.key as keyof ApplicationData['documents']]?.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                                        >
                                            View
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Section 7: Declaration */}
                {currentSection === 7 && (
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                            <h3 className="text-lg font-semibold text-charcoal mb-4">Declaration</h3>
                            <p className="text-sm text-gray-700 leading-relaxed mb-4">
                                I hereby declare that all the information provided above is true and correct to the best of my knowledge.
                                I understand that admission is subject to eligibility and approval by the concerned institution.
                                Any false information may lead to cancellation of my application.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Place *</label>
                                <input
                                    type="text"
                                    value={formData.declaration.place}
                                    onChange={(e) => handleInputChange('declaration', 'place', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                                <input
                                    type="date"
                                    value={formData.declaration.date}
                                    onChange={(e) => handleInputChange('declaration', 'date', e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
                            <input
                                type="checkbox"
                                id="declaration-agree"
                                checked={formData.declaration.agreed}
                                onChange={(e) => handleInputChange('declaration', 'agreed', e.target.checked)}
                                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <label htmlFor="declaration-agree" className="text-sm text-gray-700 cursor-pointer">
                                I agree to the above declaration and confirm that all information provided is accurate.
                                I understand that this serves as my digital signature for this application.
                            </label>
                        </div>
                    </div>
                )}
            </div>


            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={currentSection === 0}
                    className="px-6 py-3 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                {currentSection === SECTIONS.length - 1 ? (
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                        {loading ? 'Submitting...' : 'Submit Application'}
                    </button>
                ) : (
                    <button
                        onClick={handleNext}
                        className="px-6 py-3 rounded-xl font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Next
                    </button>
                )}
            </div>
        </div>
    );
};

export default ApplicationForm;
