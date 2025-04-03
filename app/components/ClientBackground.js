'use client';

import dynamic from 'next/dynamic';

// Dynamically import the ThreeBackground component
const DynamicThreeBackground = dynamic(() => import('./DynamicThreeBackground'), {
  ssr: false,
  loading: () => null
});

export default function ClientBackground() {
  return <DynamicThreeBackground />;
}
