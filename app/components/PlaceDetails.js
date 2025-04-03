'use client';

import Image from 'next/image';
import { useState } from 'react';
import { FaStar, FaMapMarkerAlt, FaUsers, FaPhone, FaGlobe, FaClock, FaChevronDown, FaChevronUp } from 'react-icons/fa';

export default function PlaceDetails({ place }) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  if (!place) return null;

  // Placeholder for photos - will be replaced with actual Google Places photos
  const photos = place.photos || [];
  // Placeholder for reviews - will be replaced with actual Google Places reviews
  const reviews = place.reviews || [];

  return (
    <div>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{place.name}</h2>
          {place.vicinity && (
            <p className="text-gray-600 dark:text-gray-400 flex items-center mt-1">
              <FaMapMarkerAlt className="mr-2" />
              {place.vicinity}
            </p>
          )}
          {place.business_status && place.business_status !== 'OPERATIONAL' && (
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {place.business_status === 'CLOSED_PERMANENTLY' ? 'Permanently closed' :
               place.business_status === 'CLOSED_TEMPORARILY' ? 'Temporarily closed' :
               'Not operational'}
            </p>
          )}
        </div>

        {place.rating && (
          <div className="flex items-center bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-full">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="font-medium">{place.rating}</span>
            {place.user_ratings_total && (
              <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">
                ({place.user_ratings_total})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Traveler count */}
      {place.travelerCount > 0 && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <div className="flex items-center">
            <FaUsers className="text-blue-500 mr-2" />
            <span className="font-medium text-gray-900 dark:text-white">
              {place.travelerCount} {place.travelerCount === 1 ? 'traveler' : 'travelers'} currently here
            </span>
          </div>
        </div>
      )}

      {/* Photos section */}
      {photos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Photos</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.slice(0, showAllPhotos ? photos.length : 4).map((photo, index) => (
              <div key={index} className="relative h-40 rounded-lg overflow-hidden">
                <Image
                  src={photo.getUrl ? photo.getUrl() : '/placeholder-image.jpg'}
                  alt={`${place.name} photo ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
          {photos.length > 4 && (
            <button
              onClick={() => setShowAllPhotos(!showAllPhotos)}
              className="mt-4 text-indigo-600 dark:text-indigo-400 flex items-center"
            >
              {showAllPhotos ? (
                <>
                  <FaChevronUp className="mr-1" /> Show less
                </>
              ) : (
                <>
                  <FaChevronDown className="mr-1" /> Show all {photos.length} photos
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Contact and hours section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact info */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Contact</h3>
          <ul className="space-y-2">
            {place.formatted_phone_number && (
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaPhone className="mr-2" />
                <a href={`tel:${place.formatted_phone_number}`} className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  {place.formatted_phone_number}
                </a>
              </li>
            )}
            {place.website && (
              <li className="flex items-center text-gray-600 dark:text-gray-400">
                <FaGlobe className="mr-2" />
                <a href={place.website} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-600 dark:hover:text-indigo-400">
                  Visit website
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* Opening hours */}
        {place.opening_hours && (
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Opening Hours</h3>
            <div className="text-gray-600 dark:text-gray-400">
              {place.opening_hours.weekday_text ? (
                <ul className="space-y-1">
                  {place.opening_hours.weekday_text.map((day, index) => (
                    <li key={index} className="flex items-start">
                      <FaClock className="mr-2 mt-1" />
                      <span>{day}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="flex items-center">
                  <FaClock className="mr-2" />
                  {place.opening_hours.open_now ? 'Open now' : 'Closed now'}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reviews section */}
      {reviews.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Reviews</h3>
          <div className="space-y-4">
            {reviews.slice(0, showAllReviews ? reviews.length : 3).map((review, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    {review.profile_photo_url && (
                      <Image
                        src={review.profile_photo_url}
                        alt={review.author_name}
                        width={40}
                        height={40}
                        className="rounded-full mr-3"
                      />
                    )}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{review.author_name}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.time * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FaStar className="text-yellow-400 mr-1" />
                    <span>{review.rating}</span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{review.text}</p>
              </div>
            ))}
          </div>
          {reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="mt-4 text-indigo-600 dark:text-indigo-400 flex items-center"
            >
              {showAllReviews ? (
                <>
                  <FaChevronUp className="mr-1" /> Show less
                </>
              ) : (
                <>
                  <FaChevronDown className="mr-1" /> Show all {reviews.length} reviews
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
