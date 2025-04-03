'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';

// Simplified sphere component with better performance
function AnimatedSphere({ position, color, speed }) {
  const meshRef = useRef();

  // Use a more efficient animation approach
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += speed * 0.005;
      meshRef.current.rotation.y += speed * 0.007;
    }
  });

  // Memoize the material to prevent unnecessary re-renders
  const material = useMemo(() => ({
    color: color,
    roughness: 0.5,
    metalness: 0.2,
  }), [color]);

  return (
    <mesh ref={meshRef} position={position}>
      <sphereGeometry args={[1, 32, 32]} /> {/* Reduced geometry complexity */}
      <meshStandardMaterial {...material} />
    </mesh>
  );
}

// Responsive camera adjustment
function ResponsiveCamera() {
  const { size, camera } = useThree();

  useEffect(() => {
    // Adjust camera position based on screen size
    camera.position.z = size.width < 768 ? 15 : 10;
    camera.updateProjectionMatrix();
  }, [size.width, camera]);

  return null;
}

// Detect if device is likely low-powered
function useIsLowPoweredDevice() {
  const [isLowPower, setIsLowPower] = useState(false);

  useEffect(() => {
    // Check for mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Check for low memory (if available)
    const hasLowMemory = navigator.deviceMemory && navigator.deviceMemory < 4;

    // Check for low CPU cores (if available)
    const hasLowCPU = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

    setIsLowPower(isMobile || hasLowMemory || hasLowCPU);
  }, []);

  return isLowPower;
}

export default function ThreeBackground({ className }) {
  const [isMounted, setIsMounted] = useState(false);
  const isLowPoweredDevice = useIsLowPoweredDevice();

  useEffect(() => {
    // Only mount on client-side
    setIsMounted(true);

    return () => {
      // Clean up any resources when component unmounts
      setIsMounted(false);
    };
  }, []);

  // Don't render 3D background on low-powered devices
  if (!isMounted || isLowPoweredDevice) {
    return (
      <div className={`fixed top-0 left-0 w-full h-full -z-10 ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20"></div>
      </div>
    );
  }

  return (
    <div className={`fixed top-0 left-0 w-full h-full -z-10 opacity-70 ${className}`}>
      <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }}> {/* Limit resolution and performance */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <ResponsiveCamera />
        <AnimatedSphere position={[-4, 2, -5]} color="#6366f1" speed={1.5} />
        <AnimatedSphere position={[4, -2, -2]} color="#8b5cf6" speed={1} />
        <AnimatedSphere position={[0, 0, -8]} color="#ec4899" speed={0.8} />
      </Canvas>
    </div>
  );
}
