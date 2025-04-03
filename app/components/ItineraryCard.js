'use client';

import Link from 'next/link';
import { FaRoute, FaCalendarAlt, FaGlobeAmericas, FaLock } from 'react-icons/fa';
import { formatDateRange } from '../utils/itineraryUtils';

export default function ItineraryCard({ itinerary, isOwner }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Cover image or placeholder */}
      <div className="h-48 bg-indigo-100 dark:bg-indigo-900 relative">
        {itinerary.coverImage ? (
          <img 
            src={itinerary.coverImage} 
            alt={itinerary.title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FaRoute className="text-indigo-500 text-5xl" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{itinerary.title}</h3>
        
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 flex items-center">
          <FaCalendarAlt className="mr-1" />
          {formatDateRange(itinerary.startDate, itinerary.endDate)}
        </p>
        
        <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
          {itinerary.description || 'No description provided.'}
        </p>
        
        <div className="flex justify-between items-center">
          <span className={`px-2 py-1 text-xs rounded-full flex items-center ${
            itinerary.isPublic 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {itinerary.isPublic ? (
              <>
                <FaGlobeAmericas className="mr-1" />
                Public
              </>
            ) : (
              <>
                <FaLock className="mr-1" />
                Private
              </>
            )}
          </span>
          
          <Link 
            href={`/itineraries/${itinerary.id}`}
            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
