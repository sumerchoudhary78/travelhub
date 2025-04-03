'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FaRoute, FaMapMarkerAlt, FaCalendarAlt, FaEdit, FaTrash, FaSpinner, FaArrowLeft, FaGlobeAmericas, FaLock } from 'react-icons/fa';
import MapComponent from '../../components/MapComponent';
import ItineraryTimeline from '../../components/ItineraryTimeline';
import { formatDate, groupLocationsByDay, fetchItinerary, fetchItineraryLocations, deleteItinerary } from '../../utils/itineraryUtils';

export default function ItineraryDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const router = useRouter();
  const [itinerary, setItinerary] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState({ lat: 0, lng: 0 });

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const fetchItineraryData = async () => {
      setLoading(true);
      try {
        // Fetch itinerary details
        const itineraryRef = doc(db, 'itineraries', id);
        const itinerarySnap = await getDoc(itineraryRef);

        if (!itinerarySnap.exists()) {
          setError('Itinerary not found');
          setLoading(false);
          return;
        }

        const itineraryData = {
          id: itinerarySnap.id,
          ...itinerarySnap.data()
        };

        // Check if user has access to this itinerary
        if (itineraryData.userId !== currentUser.uid && !itineraryData.isPublic) {
          setError('You do not have permission to view this itinerary');
          setLoading(false);
          return;
        }

        setItinerary(itineraryData);

        // Fetch locations for this itinerary
        const locationsQuery = query(
          collection(db, 'itineraries', id, 'locations'),
          orderBy('day'),
          orderBy('order')
        );
        const locationsSnap = await getDocs(locationsQuery);
        const locationsData = locationsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLocations(locationsData);

        // Set map center to first location or default
        if (locationsData.length > 0 && locationsData[0].location) {
          setMapCenter({
            lat: locationsData[0].location.latitude,
            lng: locationsData[0].location.longitude
          });
        }
      } catch (error) {
        console.error('Error fetching itinerary:', error);
        setError('Failed to load itinerary details');
      } finally {
        setLoading(false);
      }
    };

    fetchItineraryData();
  }, [id, currentUser]);

  // We're using the formatDate function from itineraryUtils

  // Group locations by day using the utility function
  const locationsByDay = groupLocationsByDay(locations);

  // Handle itinerary deletion
  const handleDeleteItinerary = async () => {
    if (!confirm('Are you sure you want to delete this itinerary? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      await deleteItinerary(id);
      router.push('/itineraries');
    } catch (error) {
      console.error('Error deleting itinerary:', error);
      setError('Failed to delete itinerary. Please try again.');
      setDeleting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view itineraries</h1>
          <Link href="/auth/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <Link href="/itineraries" className="mt-2 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  if (!itinerary) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-700 dark:text-yellow-400">Itinerary not found</p>
          <Link href="/itineraries" className="mt-2 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = currentUser.uid === itinerary.userId;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link href="/itineraries" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mb-6">
        <FaArrowLeft className="mr-2" />
        Back to Itineraries
      </Link>

      {/* Itinerary header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mr-3">{itinerary.title}</h1>
              {itinerary.isPublic ? (
                <span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs px-2 py-1 rounded-full flex items-center">
                  <FaGlobeAmericas className="mr-1" />
                  Public
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full flex items-center">
                  <FaLock className="mr-1" />
                  Private
                </span>
              )}
            </div>

            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
              <FaCalendarAlt className="mr-2" />
              <span>{formatDate(itinerary.startDate)} - {formatDate(itinerary.endDate)}</span>
            </div>

            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {itinerary.description || 'No description provided.'}
            </p>
          </div>

          {isOwner && (
            <div className="flex space-x-2">
              <Link
                href={`/itineraries/${id}/edit`}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md flex items-center"
              >
                <FaEdit className="mr-1" />
                Edit
              </Link>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md flex items-center"
                onClick={handleDeleteItinerary}
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <FaSpinner className="animate-spin mr-1" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-1" />
                    Delete
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Map view */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 mb-6 h-[400px]">
        {locations.length > 0 ? (
          <MapComponent
            center={mapCenter}
            places={locations.map(loc => ({
              id: loc.id,
              name: loc.name,
              geometry: {
                location: {
                  lat: () => loc.location.latitude,
                  lng: () => loc.location.longitude
                }
              }
            }))}
            travelers={[]}
            selectedPlace={null}
            onSelectPlace={() => {}}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            No locations added to this itinerary
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-white flex items-center">
          <FaRoute className="mr-2 text-indigo-500" />
          Itinerary Timeline
        </h2>

        <ItineraryTimeline
          locations={locations}
          itineraryId={id}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
