'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../lib/AuthContext';
import { usePathname } from 'next/navigation';
import { FaHome, FaCompass, FaUser, FaComments, FaSignOutAlt, FaSignInAlt, FaRoute, FaUserFriends } from 'react-icons/fa';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-white/90 dark:bg-black/90 shadow-md backdrop-blur-sm' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">TravlrHub</span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link href="/" className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}>
              <div className="flex items-center gap-2">
                <FaHome />
                <span>Home</span>
              </div>
            </Link>

            <Link href="/explore" className={`px-3 py-2 rounded-md text-sm font-medium ${
              pathname === '/explore' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}>
              <div className="flex items-center gap-2">
                <FaCompass />
                <span>Explore</span>
              </div>
            </Link>

            {currentUser && (
              <>
                <Link href="/chat" className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/chat' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <FaComments />
                    <span>Chat</span>
                  </div>
                </Link>

                <Link href="/friends" className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith('/friends') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <FaUserFriends />
                    <span>Friends</span>
                  </div>
                </Link>

                <Link href="/itineraries" className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith('/itineraries') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <FaRoute />
                    <span>Itineraries</span>
                  </div>
                </Link>

                <Link href="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <FaUser />
                    <span>Profile</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <div className="flex items-center gap-2">
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </div>
                </button>
              </>
            )}

            {!currentUser && (
              <Link href="/auth/login" className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/auth/login' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}>
                <div className="flex items-center gap-2">
                  <FaSignInAlt />
                  <span>Login</span>
                </div>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            >
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden bg-white dark:bg-gray-900 shadow-lg`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link href="/" className={`block px-3 py-2 rounded-md text-base font-medium ${
            pathname === '/' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}>
            <div className="flex items-center gap-2">
              <FaHome />
              <span>Home</span>
            </div>
          </Link>

          <Link href="/explore" className={`block px-3 py-2 rounded-md text-base font-medium ${
            pathname === '/explore' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
          }`}>
            <div className="flex items-center gap-2">
              <FaCompass />
              <span>Explore</span>
            </div>
          </Link>

          {currentUser && (
            <>
              <Link href="/chat" className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/chat' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}>
                <div className="flex items-center gap-2">
                  <FaComments />
                  <span>Chat</span>
                </div>
              </Link>

              <Link href="/friends" className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname.startsWith('/friends') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}>
                <div className="flex items-center gap-2">
                  <FaUserFriends />
                  <span>Friends</span>
                </div>
              </Link>

              <Link href="/itineraries" className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname.startsWith('/itineraries') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}>
                <div className="flex items-center gap-2">
                  <FaRoute />
                  <span>Itineraries</span>
                </div>
              </Link>

              <Link href="/profile" className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === '/profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}>
                <div className="flex items-center gap-2">
                  <FaUser />
                  <span>Profile</span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
              >
                <div className="flex items-center gap-2">
                  <FaSignOutAlt />
                  <span>Logout</span>
                </div>
              </button>
            </>
          )}

          {!currentUser && (
            <Link href="/auth/login" className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/auth/login' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}>
              <div className="flex items-center gap-2">
                <FaSignInAlt />
                <span>Login</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
