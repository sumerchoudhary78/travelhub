'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';

// Check if device is touch-based (to disable tilt effect on mobile)
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
};

export default function TiltCard({ children, className = '', glareEnabled = true, scale = 1.03, perspective = 800 }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on a mobile device once on mount
  useEffect(() => {
    setIsMobile(isTouchDevice());
  }, []);

  // Throttle mouse move handler for better performance
  const handleMouseMove = (e) => {
    if (!cardRef.current || isMobile) return;

    // Use requestAnimationFrame for smoother performance
    requestAnimationFrame(() => {
      const card = cardRef.current;
      const rect = card.getBoundingClientRect();

      // Calculate mouse position relative to card center
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;

      // Calculate rotation based on mouse position with reduced intensity
      const rotateY = mouseX / (rect.width / 2) * 5; // Reduced from 10 to 5
      const rotateX = -mouseY / (rect.height / 2) * 5;

      setRotation({ x: rotateX, y: rotateY });
    });
  };

  const handleMouseEnter = () => {
    if (isMobile) return;
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (isMobile) return;
    setIsHovered(false);
    setRotation({ x: 0, y: 0 });
  };

  // Memoize the style to prevent unnecessary re-renders
  const cardStyle = useMemo(() => ({
    perspective: `${perspective}px`,
  }), [perspective]);

  // If on mobile, just render the card without tilt effect
  if (isMobile) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
      animate={{
        rotateX: rotation.x,
        rotateY: rotation.y,
        scale: isHovered ? scale : 1,
        transition: { duration: 0.15 } // Reduced duration for better performance
      }}
    >
      {children}

      {/* Glare effect - only show on non-mobile devices */}
      {glareEnabled && isHovered && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent opacity-10 pointer-events-none"
          animate={{
            backgroundPosition: `${50 + rotation.y}% ${50 - rotation.x}%`, // Reduced multiplier
          }}
          transition={{ duration: 0.15 }}
        />
      )}
    </motion.div>
  );
}
