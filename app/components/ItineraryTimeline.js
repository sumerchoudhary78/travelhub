'use client';

import Link from 'next/link';
import { FaRoute, FaMapMarkerAlt, FaClock } from 'react-icons/fa';
import { groupLocationsByDay } from '../utils/itineraryUtils';

export default function ItineraryTimeline({ locations, itineraryId, isOwner }) {
  // Group locations by day
  const locationsByDay = groupLocationsByDay(locations);
  
  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <FaMapMarkerAlt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <p>No locations added to this itinerary yet.</p>
        {isOwner && (
          <Link 
            href={`/itineraries/${itineraryId}/edit`}
            className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
          >
            Add locations
          </Link>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {Object.entries(locationsByDay).map(([day, dayLocations]) => (
        <div key={day} className="border-l-4 border-indigo-500 pl-4">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
            Day {parseInt(day) + 1}
          </h3>
          <div className="space-y-4">
            {dayLocations.map((location, index) => (
              <div 
                key={location.id} 
                className="relative pl-6 pb-4"
              >
                {/* Timeline connector */}
                <div className="absolute top-0 left-0 h-full w-px bg-gray-300 dark:bg-gray-700"></div>
                <div className="absolute top-1 left-0 w-2 h-2 rounded-full bg-indigo-500 -translate-x-1/2"></div>
                
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">{location.name}</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {location.startTime && location.endTime ? (
                        <div className="flex items-center">
                          <FaClock className="mr-1" />
                          {location.startTime} - {location.endTime}
                        </div>
                      ) : (
                        'No time specified'
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    {location.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <FaMapMarkerAlt className="mr-1" />
                    <span>
                      {location.address || 'Location pinned on map'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
