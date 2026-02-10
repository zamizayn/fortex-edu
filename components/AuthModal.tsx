import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { verifyAdminCredentials, saveStudentDetails, seedAdminUser } from '../services/db';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [view, setView] = useState<'login' | 'register' | 'admin'>('login');
  const [loadingType, setLoadingType] = useState<'student' | 'admin' | null>(null);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Admin Form States
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState<string | null>(null);

  // Seed admin user on component mount (or when modal opens)
  useEffect(() => {
    seedAdminUser();
  }, []);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setLoadingType('student');
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Save student details to Firestore
      const studentUser = await saveStudentDetails(result.user);

      onLogin(studentUser);
      onClose();
    } catch (err: any) {
      console.error('Google login error:', err);
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingType('student');
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      // Fetch/Save student details
      const studentUser = await saveStudentDetails(result.user);
      onLogin(studentUser);
      onClose();
    } catch (err: any) {
      console.error('Email login error:', err);
      setError('Invalid email or password.');
    } finally {
      setLoadingType(null);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingType('student');
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Save student details with extra info
      const studentUser = await saveStudentDetails(result.user, { name, mobile });
      onLogin(studentUser);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      // Detailed error logging for debugging
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered. Please try logging in.');
      } else {
        setError(`Registration failed: ${err.message}`);
      }
    } finally {
      setLoadingType(null);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingType('admin');
    setError(null);

    try {
      // Validation against Firestore 'users' collection
      const adminUser = await verifyAdminCredentials(adminUsername, adminPassword);

      if (adminUser) {
        onLogin(adminUser);
        onClose();
      } else {
        setError('Invalid username or password.');
      }
    } catch (err: any) {
      console.error('Admin login error:', err);
      setError('An error occurred during login. Please try again.');
    } finally {
      setLoadingType(null);
    }
  };

  const resetState = () => {
    setView('login');
    setEmail('');
    setPassword('');
    setName('');
    setMobile('');
    setAdminUsername('');
    setAdminPassword('');
    setShowPassword(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-8 text-center">
          <button
            onClick={() => { onClose(); resetState(); }}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h3 className="text-2xl font-semibold text-gray-900 mb-2">
            {view === 'admin' ? 'Admin Access' : view === 'register' ? 'Create Account' : 'Student Login'}
          </h3>
          <p className="text-gray-500 mb-8 px-4 text-sm">
            {view === 'admin' ? 'Enter your credentials to continue.' :
              view === 'register' ? 'Join us to start your global journey.' :
                'Sign in to access your admissions portal.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {/* LOGIN VIEW */}
          {view === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleEmailLogin} className="space-y-4 text-left">
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!!loadingType}
                  className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {loadingType === 'student' ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              {/* <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-gray-100"></div>
                <span className="px-3 text-[10px] text-gray-400 font-medium uppercase">or</span>
                <div className="flex-grow h-px bg-gray-100"></div>
              </div>

              <button
                onClick={handleGoogleLogin}
                disabled={!!loadingType}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 px-6 py-3.5 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
              >
                {loadingType === 'student' ? 'Connecting...' : (
                  <>
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                    Sign in with Google
                  </>
                )}
              </button> */}

              <div className="pt-4 text-sm text-gray-600">
                Don't have an account?{' '}
                <button onClick={() => { setView('register'); setError(null); }} className="text-blue-600 font-medium hover:underline">
                  Create one
                </button>
              </div>

              {/* <div className="text-center pt-2">
                <button onClick={() => { setView('admin'); setError(null); }} className="text-gray-400 text-xs hover:text-gray-600">Admin Login</button>
              </div> */}
            </div>
          )}

          {/* REGISTER VIEW */}
          {view === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter mobile number"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10"
                    placeholder="Create a password"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!!loadingType}
                className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 mt-2"
              >
                {loadingType === 'student' ? 'Creating Account...' : 'Register'}
              </button>

              <div className="pt-2 text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={() => { setView('login'); setError(null); }} className="text-blue-600 font-medium hover:underline">
                  Sign in instead
                </button>
              </div>
            </form>
          )}

          {/* ADMIN VIEW */}
          {view === 'admin' && (
            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter password"
                />
              </div>

              <button
                type="submit"
                disabled={!!loadingType}
                className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-md active:scale-[0.98] disabled:opacity-50 mt-4"
              >
                {loadingType === 'admin' ? 'Authenticating...' : 'Login'}
              </button>

              <button
                type="button"
                onClick={() => { setView('login'); setError(null); }}
                className="w-full text-gray-500 text-sm hover:text-gray-700 mt-2"
              >
                Back to student login
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
