'use client';

import { FaStar, FaMapMarkerAlt, FaUsers } from 'react-icons/fa';

export default function PlacesList({ places, onSelectPlace, selectedPlace }) {
  if (places.length === 0) {
    return (
      <div className="text-center py-8">
        <FaMapMarkerAlt className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No places found</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Try adjusting your search or location to find places.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
      {places.map((place) => (
        <div
          key={place.id}
          className={`p-4 rounded-lg cursor-pointer transition-all ${
            selectedPlace && selectedPlace.id === place.id
              ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
              : 'bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
          onClick={() => onSelectPlace(place)}
        >
          <h3 className="font-medium text-gray-900 dark:text-white">{place.name}</h3>

          {place.vicinity && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center">
              <FaMapMarkerAlt className="mr-1 h-3 w-3" />
              {place.vicinity}
            </p>
          )}

          {place.business_status && place.business_status !== 'OPERATIONAL' && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {place.business_status === 'CLOSED_PERMANENTLY' ? 'Permanently closed' :
               place.business_status === 'CLOSED_TEMPORARILY' ? 'Temporarily closed' :
               'Not operational'}
            </p>
          )}

          <div className="mt-2 flex items-center justify-between">
            {place.rating && (
              <div className="flex items-center">
                <FaStar className="text-yellow-400 h-4 w-4 mr-1" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {place.rating}
                </span>
                {place.user_ratings_total && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                    ({place.user_ratings_total})
                  </span>
                )}
              </div>
            )}

            {place.travelerCount > 0 && (
              <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                <FaUsers className="h-4 w-4 mr-1 text-indigo-500" />
                {place.travelerCount} {place.travelerCount === 1 ? 'traveler' : 'travelers'}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
