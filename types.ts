
export interface Program {
  id: string;
  name: string;
  duration: string;
  description: string;
  eligibility: string;
  outcomes: string[];
  careerPaths: string[];
  icon: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'Webinar' | 'Orientation' | 'Class';
  registrationLink?: string;
  imageUrl?: string;
  description?: string;
  createdAt?: any;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  youtubeId: string;
  category: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: 'student' | 'admin';
  createdAt?: any;
}

// Fixed missing interface SocialPost
export interface SocialPost {
  id: string;
  imageUrl: string;
  caption: string;
  likes: number;
}

export interface Service {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  programs?: string[];
  createdAt?: any;
}

export interface College {
  id: string;
  name: string;
  location: string;
  description: string;
  websiteUrl: string;
  imageUrl: string;
  createdAt?: any;
}

export interface University {
  id: string;
  name: string;
  location: string;
  description: string;
  websiteUrl: string;
  imageUrl: string;
  createdAt?: any;
}

export interface Lead {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPicture?: string;
  type: 'college' | 'university';
  collegeId?: string;
  collegeName?: string;
  universityId?: string;
  universityName?: string;
  createdAt: any; // Using any for Firestore Timestamp compatibility
  studentLocation?: string;
  lastAttendedCourse?: string;
  percentage?: string;
  read?: boolean;
  studentPhone?: string;
}

export interface SiteSettings {
  id?: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutDescription: string;
  aboutImageUrl?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  whatsappNumber: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  twitter?: string;
  youtubeUrl?: string; // For Video Gallery "View Channel" link
  themeColor?: string;
  logoUrl?: string;
  visibleSections?: { [key: string]: boolean };
  teamMembers?: {
    id: string;
    name: string;
    role: string;
    image: string;
    bio?: string;
    socials?: {
      linkedin?: string;
      twitter?: string;
      instagram?: string;
    };
  }[];
}

export interface Consultation {
  id?: string;
  name: string;
  phone: string;
  date?: string;
  interest: string;
  selectedProgram?: string;
  lastAttendedCourse?: string;
  percentage?: string;
  createdAt: any;
  comment?: string;
  read?: boolean;
}

export interface Inquiry {
  id?: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  createdAt: any;
  read?: boolean;
}

export interface EducationInsight {
  id: string;
  name: string;
  serviceTag: string;
  youtubeLink: string;
  createdAt?: any;
}

export interface Review {
  id?: string;
  studentName: string;
  program: string;
  rating: number; // 1-5 stars
  content: string;
  imageUrl?: string;
  createdAt: any;
}