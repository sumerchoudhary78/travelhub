'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatDistance } from '../utils/locationUtils';
import { FaUser, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

export default function TravelersList({ travelers }) {
  if (!travelers || travelers.length === 0) {
    return (
      <div className="text-center py-8">
        <FaUser className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No travelers nearby</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Be the first to explore this area!
        </p>
      </div>
    );
  }

  // Format the last active time
  const formatLastActive = (lastActive) => {
    if (!lastActive) return 'Unknown';
    
    const now = new Date();
    const diffMs = now - lastActive;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {travelers.map((traveler) => (
        <div key={traveler.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              {traveler.photoURL ? (
                <Image
                  src={traveler.photoURL}
                  alt={traveler.displayName || 'Traveler'}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                  <FaUser className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {traveler.displayName || 'Anonymous Traveler'}
              </p>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FaMapMarkerAlt className="flex-shrink-0 mr-1 h-3 w-3" />
                <span>{formatDistance(traveler.distance)} away</span>
              </div>
              {traveler.lastActive && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <FaClock className="flex-shrink-0 mr-1 h-3 w-3" />
                  <span>Active {formatLastActive(traveler.lastActive)}</span>
                </div>
              )}
            </div>
            <Link
              href={`/chat/${traveler.id}`}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/70 transition-colors"
            >
              Message
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
