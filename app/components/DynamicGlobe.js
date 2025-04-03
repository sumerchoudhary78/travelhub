'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';

// 3D Globe component with performance optimizations
function Globe(props) {
  const meshRef = useRef();

  // Rotate the globe with optimized animation
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.001; // Reduced rotation speed
    }
  });

  // Memoize the material to prevent unnecessary re-renders
  const material = useMemo(() => ({
    color: "#6366f1",
    metalness: 0.5,
    roughness: 0.4,
    emissive: "#4338ca",
    emissiveIntensity: 0.2,
    wireframe: true
  }), []);

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.3}> {/* Reduced animation intensity */}
      <mesh ref={meshRef} {...props}>
        <sphereGeometry args={[1.5, 32, 32]} /> {/* Reduced geometry complexity */}
        <meshStandardMaterial {...material} />
      </mesh>
    </Float>
  );
}

export default function DynamicGlobe() {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]} // Limit resolution
        performance={{ min: 0.5 }} // Allow performance scaling
        frameloop="demand" // Only render when needed
      >
        <ambientLight intensity={0.5} />
        <Globe position={[0, 0, 0]} />
      </Canvas>
    </div>
  );
}
