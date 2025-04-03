'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FaGlobeAmericas } from 'react-icons/fa';

export default function LoadingAnimation() {
  // Memoize animation properties to prevent recreation on each render
  const iconAnimation = useMemo(() => ({
    scale: [1, 1.1, 1], // Reduced scale for better performance
    rotate: [0, 360],
  }), []);

  const iconTransition = useMemo(() => ({
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }), []);

  const textAnimation = useMemo(() => ({
    opacity: [0.5, 1, 0.5]
  }), []);

  const textTransition = useMemo(() => ({
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut"
  }), []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <motion.div
        animate={iconAnimation}
        transition={iconTransition}
        className="text-indigo-600 dark:text-indigo-400 mb-4"
      >
        <FaGlobeAmericas className="h-10 w-10" /> {/* Slightly smaller icon */}
      </motion.div>
      <motion.p
        animate={textAnimation}
        transition={textTransition}
        className="text-gray-600 dark:text-gray-300 font-medium"
      >
        Loading...
      </motion.p>
    </div>
  );
}
