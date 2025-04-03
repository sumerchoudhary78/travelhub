'use client';

import Link from 'next/link';
import ItineraryCard from './ItineraryCard';
import { FaRoute } from 'react-icons/fa';

export default function ItineraryList({ itineraries, title, icon, emptyMessage, createLink }) {
  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
        {icon}
        {title}
      </h2>
      
      {itineraries.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
          {createLink && (
            <Link href={createLink} className="mt-4 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
              Create your first itinerary
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itineraries.map(itinerary => (
            <ItineraryCard 
              key={itinerary.id} 
              itinerary={itinerary} 
              isOwner={createLink ? true : false} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
