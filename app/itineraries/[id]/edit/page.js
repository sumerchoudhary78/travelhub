'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation'; // Import useParams
import Link from 'next/link';
import { useAuth } from '../../../lib/AuthContext';
import { doc, getDoc, updateDoc, collection, addDoc, deleteDoc, query, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { FaRoute, FaCalendarAlt, FaGlobeAmericas, FaLock, FaSave, FaArrowLeft, FaSpinner, FaPlus, FaTrash, FaMapMarkerAlt } from 'react-icons/fa';
import { trackLocationAdded, trackPublicItinerary } from '../../../utils/badgeUtils';

export default function EditItinerary() { // Remove 'params' from the function signature
  const { id } = useParams(); // Use the useParams hook to get the 'id'
  const { currentUser } = useAuth();
  const router = useRouter();

  // Itinerary state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState([]);
  const [showAddLocation, setShowAddLocation] = useState(false);

  // New location state
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDay, setNewLocationDay] = useState(0);
  const [newLocationDescription, setNewLocationDescription] = useState('');
  const [newLocationStartTime, setNewLocationStartTime] = useState('');
  const [newLocationEndTime, setNewLocationEndTime] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');

  // Calculate number of days in itinerary
  const daysCount = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1)
    : 1;

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

        const itineraryData = itinerarySnap.data();

        // Check if user is the owner
        if (itineraryData.userId !== currentUser.uid) {
          setError('You do not have permission to edit this itinerary');
          setLoading(false);
          return;
        }

        // Set form data
        setTitle(itineraryData.title || '');
        setDescription(itineraryData.description || '');
        setIsPublic(itineraryData.isPublic || false);

        // Format dates for input fields
        if (itineraryData.startDate) {
          const startDate = itineraryData.startDate.toDate ?
            itineraryData.startDate.toDate() :
            new Date(itineraryData.startDate);
          setStartDate(startDate.toISOString().split('T')[0]);
        }

        if (itineraryData.endDate) {
          const endDate = itineraryData.endDate.toDate ?
            itineraryData.endDate.toDate() :
            new Date(itineraryData.endDate);
          setEndDate(endDate.toISOString().split('T')[0]);
        }

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
      } catch (error) {
        console.error('Error fetching itinerary:', error);
        setError('Failed to load itinerary details');
      } finally {
        setLoading(false);
      }
    };

    fetchItineraryData();
  }, [id, currentUser]);

  const handleSaveItinerary = async (e) => {
    e.preventDefault();

    if (!title) {
      setError('Please enter a title for your itinerary');
      return;
    }

    if (!startDate || !endDate) {
      setError('Please specify start and end dates');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      setError('End date cannot be before start date');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Update itinerary document
      const itineraryRef = doc(db, 'itineraries', id);
      // Get current itinerary data to check if isPublic status changed
      const itineraryDoc = await getDoc(itineraryRef);
      const wasPublic = itineraryDoc.exists() ? itineraryDoc.data().isPublic || false : false;
      const isNowPublic = isPublic;

      await updateDoc(itineraryRef, {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isPublic,
        updatedAt: serverTimestamp()
      });

      // If itinerary is now public but wasn't before, track it for badges
      if (isNowPublic && !wasPublic) {
        await trackPublicItinerary(currentUser.uid);
      }

      // Redirect to the itinerary detail page
      router.push(`/itineraries/${id}`);
    } catch (error) {
      console.error('Error updating itinerary:', error);
      setError('Failed to update itinerary. Please try again.');
      setSaving(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();

    if (!newLocationName) {
      setError('Please enter a name for the location');
      return;
    }

    setSaving(true);
    setError('');

    try {
      // Get the highest order for the selected day
      const dayLocations = locations.filter(loc => loc.day === parseInt(newLocationDay));
      const highestOrder = dayLocations.length > 0
        ? Math.max(...dayLocations.map(loc => loc.order || 0))
        : -1;

      // Create new location document
      const locationData = {
        name: newLocationName,
        description: newLocationDescription,
        day: parseInt(newLocationDay),
        order: highestOrder + 1,
        startTime: newLocationStartTime,
        endTime: newLocationEndTime,
        address: newLocationAddress,
        // For simplicity, we're not setting actual coordinates here
        // In a real app, you would use Google Maps API to get coordinates
        location: { latitude: 0, longitude: 0 },
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'itineraries', id, 'locations'), locationData);

      // Track location added for badges
      await trackLocationAdded(currentUser.uid);

      // Reset form and refresh locations
      setNewLocationName('');
      setNewLocationDescription('');
      setNewLocationStartTime('');
      setNewLocationEndTime('');
      setNewLocationAddress('');
      setShowAddLocation(false);

      // Refresh locations list
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
    } catch (error) {
      console.error('Error adding location:', error);
      setError('Failed to add location. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'itineraries', id, 'locations', locationId));

      // Update local state
      setLocations(locations.filter(loc => loc.id !== locationId));
    } catch (error) {
      console.error('Error deleting location:', error);
      setError('Failed to delete location. Please try again.');
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to edit itineraries</h1>
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

  if (error && !title) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-700 dark:text-red-400">{error}</p>
          <Link href="/itineraries" className="mt-2 inline-block text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
            Back to Itineraries
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link href={`/itineraries/${id}`} className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mb-6">
        <FaArrowLeft className="mr-2" />
        Back to Itinerary
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
          <FaRoute className="mr-2 text-indigo-600" />
          Edit Itinerary
        </h1>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        <form onSubmit={handleSaveItinerary} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Itinerary Title*
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
              placeholder="e.g., Weekend in Paris"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
              placeholder="Describe your trip plans..."
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date*
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaCalendarAlt className="text-gray-400" />
                </div>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Make this itinerary public
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
              {isPublic ? (
                <>
                  <FaGlobeAmericas className="mr-1" />
                  Other travelers will be able to view this itinerary
                </>
              ) : (
                <>
                  <FaLock className="mr-1" />
                  Only you will be able to view this itinerary
                </>
              )}
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Locations Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FaRoute className="mr-2 text-indigo-500" />
            Itinerary Locations
          </h2>
          <button
            type="button"
            onClick={() => setShowAddLocation(!showAddLocation)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md flex items-center text-sm"
          >
            {showAddLocation ? 'Cancel' : (
              <>
                <FaPlus className="mr-1" />
                Add Location
              </>
            )}
          </button>
        </div>

        {/* Add Location Form */}
        {showAddLocation && (
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Add New Location</h3>
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="locationName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Location Name*
                  </label>
                  <input
                    type="text"
                    id="locationName"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                    placeholder="e.g., Eiffel Tower"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="locationDay" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Day*
                  </label>
                  <select
                    id="locationDay"
                    value={newLocationDay}
                    onChange={(e) => setNewLocationDay(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                    required
                  >
                    {Array.from({ length: daysCount }, (_, i) => (
                      <option key={i} value={i}>Day {i + 1}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="locationDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  id="locationDescription"
                  value={newLocationDescription}
                  onChange={(e) => setNewLocationDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                  placeholder="What will you do here?"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="locationStartTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    id="locationStartTime"
                    value={newLocationStartTime}
                    onChange={(e) => setNewLocationStartTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="locationEndTime" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    id="locationEndTime"
                    value={newLocationEndTime}
                    onChange={(e) => setNewLocationEndTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="locationAddress" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="locationAddress"
                  value={newLocationAddress}
                  onChange={(e) => setNewLocationAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-white"
                  placeholder="Enter location address"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md flex items-center text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus className="mr-2" />
                      Add to Itinerary
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Locations List */}
        {locations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No locations added to this itinerary yet.</p>
            <button
              type="button"
              onClick={() => setShowAddLocation(true)}
              className="mt-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              Add your first location
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {Array.from({ length: daysCount }, (_, dayIndex) => {
              const dayLocations = locations.filter(loc => loc.day === dayIndex);
              if (dayLocations.length === 0) return null;

              return (
                <div key={dayIndex} className="border-l-4 border-indigo-500 pl-4">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                    Day {dayIndex + 1}
                  </h3>
                  <div className="space-y-4">
                    {dayLocations.map((location) => (
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
                            <button
                              type="button"
                              onClick={() => handleDeleteLocation(location.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Delete location"
                            >
                              <FaTrash />
                            </button>
                          </div>

                          <p className="text-gray-700 dark:text-gray-300 mb-2">
                            {location.description || 'No description provided.'}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            {location.startTime && location.endTime && (
                              <span className="flex items-center">
                                <FaCalendarAlt className="mr-1" />
                                {location.startTime} - {location.endTime}
                              </span>
                            )}

                            {location.address && (
                              <span className="flex items-center">
                                <FaMapMarkerAlt className="mr-1" />
                                {location.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}