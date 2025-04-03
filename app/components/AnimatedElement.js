'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Animation variants - Simplified and optimized
const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.4 } } // Reduced duration
  },
  slideUp: {
    hidden: { opacity: 0, y: 30 }, // Reduced distance
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  },
  slideRight: {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  },
  slideLeft: {
    hidden: { opacity: 0, x: 30 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } }
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 }, // Less scaling
    visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } }
  }
};

// Check if we should disable animations for performance reasons
const shouldDisableAnimations = () => {
  if (typeof window === 'undefined') return false;

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Check for low-end devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;
  const hasLowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

  return prefersReducedMotion || (isMobile && (hasLowMemory || hasLowCPU));
};

export default function AnimatedElement({
  children,
  animation = 'fadeIn',
  delay = 0,
  className = '',
  threshold = 0.1,
  triggerOnce = true
}) {
  // Only create one instance of the options object
  const options = useMemo(() => ({
    triggerOnce,
    threshold
  }), [triggerOnce, threshold]);

  const [ref, inView] = useInView(options);

  // Memoize the variant selection
  const selectedVariant = useMemo(() => {
    // If animations should be disabled, use a simple fade with very short duration
    if (typeof window !== 'undefined' && shouldDisableAnimations()) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.1 } }
      };
    }

    return variants[animation] || variants.fadeIn;
  }, [animation]);

  // If animations are disabled, just render children without animation
  if (typeof window !== 'undefined' && shouldDisableAnimations()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={selectedVariant}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
