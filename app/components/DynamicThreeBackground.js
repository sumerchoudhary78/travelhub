'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the ThreeBackground component with no SSR
const ThreeBackground = dynamic(() => import('./ThreeBackground'), {
  ssr: false,
  loading: () => (
    <div className="fixed top-0 left-0 w-full h-full -z-10">
      <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
    </div>
  )
});

// Check if the browser can handle 3D rendering
function useCanRender3D() {
  const [canRender, setCanRender] = useState(true);
  
  useEffect(() => {
    try {
      // Try to create a WebGL context
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      // If we couldn't get a WebGL context, the browser doesn't support WebGL
      if (!gl) {
        setCanRender(false);
        return;
      }
      
      // Check for low-end devices
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 2;
      const hasLowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 2;
      
      // Disable 3D rendering on very low-end devices
      if (isMobile && (hasLowMemory || hasLowCPU)) {
        setCanRender(false);
      }
    } catch (e) {
      // If there was an error, assume the browser can't handle 3D
      setCanRender(false);
    }
  }, []);
  
  return canRender;
}

export default function DynamicThreeBackground(props) {
  const canRender3D = useCanRender3D();
  
  // If the browser can't handle 3D, render a simple gradient background
  if (!canRender3D) {
    return (
      <div className="fixed top-0 left-0 w-full h-full -z-10">
        <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
      </div>
    );
  }
  
  // Otherwise, render the Three.js background
  return <ThreeBackground {...props} />;
}
