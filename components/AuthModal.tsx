import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { verifyAdminCredentials, saveStudentDetails, seedAdminUser } from '../services/db';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [loadingType, setLoadingType] = useState<'student' | 'admin' | null>(null);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingType('admin');
    setError(null);

    try {
      // Validation against Firestore 'users' collection
      const adminUser = await verifyAdminCredentials(username, password);

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
    setShowAdminForm(false);
    setUsername('');
    setPassword('');
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
            {showAdminForm ? 'Admin Access' : 'Portal Access'}
          </h3>
          <p className="text-gray-500 mb-8 px-4 text-sm">
            {showAdminForm ? 'Enter your credentials to continue.' : 'Sign in to access your admissions portal or administrative panel.'}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {!showAdminForm ? (
            <div className="space-y-3">
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
              </button>

              <div className="flex items-center my-4">
                <div className="flex-grow h-px bg-gray-100"></div>
                <span className="px-3 text-[10px] text-gray-400 font-medium uppercase">or</span>
                <div className="flex-grow h-px bg-gray-100"></div>
              </div>

              <button
                onClick={() => setShowAdminForm(true)}
                disabled={!!loadingType}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 text-white px-6 py-3.5 rounded-xl font-medium hover:bg-gray-800 transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
              >
                Administrator Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                onClick={() => { setShowAdminForm(false); setError(null); }}
                className="w-full text-gray-500 text-sm hover:text-gray-700 mt-2"
              >
                Back to options
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
