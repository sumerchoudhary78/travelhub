'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../lib/AuthContext';
import { usePathname } from 'next/navigation';
import { FaHome, FaCompass, FaUser, FaComments, FaSignOutAlt, FaSignInAlt, FaRoute, FaUserFriends, FaGlobeAmericas } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

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

  // Animation variants - memoized to prevent recreation on each render
  const navbarVariants = useMemo(() => ({
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  }), []);

  const mobileMenuVariants = useMemo(() => ({
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
        when: 'beforeChildren'
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
        when: 'afterChildren',
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  }), []);

  const menuItemVariants = useMemo(() => ({
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.2 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  }), []);

  return (
    <motion.nav
      initial="hidden"
      animate="visible"
      variants={navbarVariants}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white dark:bg-gray-900 shadow-lg' : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center group">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center"
              >
                <FaGlobeAmericas className="h-6 w-6 text-indigo-600 dark:text-indigo-400 mr-2 group-hover:animate-spin-slow" />
                <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">TravlrHub</span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <NavLink href="/" icon={<FaHome />} label="Home" isActive={pathname === '/'} />
            <NavLink href="/explore" icon={<FaCompass />} label="Explore" isActive={pathname === '/explore'} />

            {currentUser && (
              <>
                <NavLink href="/chat" icon={<FaComments />} label="Chat" isActive={pathname === '/chat'} />
                <NavLink href="/friends" icon={<FaUserFriends />} label="Friends" isActive={pathname.startsWith('/friends')} />
                <NavLink href="/itineraries" icon={<FaRoute />} label="Itineraries" isActive={pathname.startsWith('/itineraries')} />
                <NavLink href="/profile" icon={<FaUser />} label="Profile" isActive={pathname === '/profile'} />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FaSignOutAlt />
                    <span>Logout</span>
                  </div>
                </motion.button>
              </>
            )}

            {!currentUser && (
              <NavLink href="/auth/login" icon={<FaSignInAlt />} label="Login" isActive={pathname === '/auth/login'} />
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
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
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu with animation */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            className="md:hidden bg-white dark:bg-gray-800 shadow-lg overflow-hidden border-t border-gray-200 dark:border-gray-700"
          >
            <div className="px-4 pt-3 pb-4 space-y-2 sm:px-5">
              <MobileNavLink href="/" icon={<FaHome />} label="Home" isActive={pathname === '/'} variants={menuItemVariants} />
              <MobileNavLink href="/explore" icon={<FaCompass />} label="Explore" isActive={pathname === '/explore'} variants={menuItemVariants} />

              {currentUser && (
                <>
                  <MobileNavLink href="/chat" icon={<FaComments />} label="Chat" isActive={pathname === '/chat'} variants={menuItemVariants} />
                  <MobileNavLink href="/friends" icon={<FaUserFriends />} label="Friends" isActive={pathname.startsWith('/friends')} variants={menuItemVariants} />
                  <MobileNavLink href="/itineraries" icon={<FaRoute />} label="Itineraries" isActive={pathname.startsWith('/itineraries')} variants={menuItemVariants} />
                  <MobileNavLink href="/profile" icon={<FaUser />} label="Profile" isActive={pathname === '/profile'} variants={menuItemVariants} />

                  <motion.button
                    variants={menuItemVariants}
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FaSignOutAlt />
                      <span>Logout</span>
                    </div>
                  </motion.button>
                </>
              )}

              {!currentUser && (
                <MobileNavLink href="/auth/login" icon={<FaSignInAlt />} label="Login" isActive={pathname === '/auth/login'} variants={menuItemVariants} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

// Desktop navigation link component
function NavLink({ href, icon, label, isActive }) {
  return (
    <Link href={href} className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'text-indigo-700 dark:text-indigo-300 font-semibold'
        : 'text-gray-800 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-300'
    }`}>
      <motion.div
        className="flex items-center gap-2"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {icon}
        <span>{label}</span>
      </motion.div>
    </Link>
  );
}

// Mobile navigation link component
function MobileNavLink({ href, icon, label, isActive, variants }) {
  return (
    <motion.div variants={variants}>
      <Link href={href} className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
        isActive
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
          : 'text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/30'
      }`}>
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
      </Link>
    </motion.div>
  );
}
