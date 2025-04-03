// --- START OF FILE page.js ---

'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore'; // Import getDoc
import { db } from '../lib/firebase'; // Import db
import { useAuth } from '../lib/AuthContext';
import { useUserLocation, fetchNearbyPlaces, fetchNearbyTravelers, fetchPlaceDetails, getTravelerCountAtPlace } from '../utils/locationUtils';
import MapComponent from '../components/MapComponent';
import PlacesList from '../components/PlacesList';
import PlaceDetails from '../components/PlaceDetails';
import TravelersList from '../components/TravelersList';
import { FaMapMarkedAlt, FaCompass, FaUsers, FaSpinner } from 'react-icons/fa';

export default function ExplorePage() {
  const { currentUser } = useAuth();
  const [userSharingPreference, setUserSharingPreference] = useState(false); // User's actual preference from DB
  const { location, error: locationError, loading: locationLoading } = useUserLocation(userSharingPreference); // Pass the preference
  const [places, setPlaces] = useState([]);
  const [nearbyTravelers, setNearbyTravelers] = useState([]);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [loadingTravelers, setLoadingTravelers] = useState(true); // Separate loading state for travelers
  const [mapCenter, setMapCenter] = useState(null);
  const [placesLoaded, setPlacesLoaded] = useState(false); // Keep this to prevent redundant place loads

  // Fetch user's sharing preference
  useEffect(() => {
    const fetchUserPreference = async () => {
      if (!currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserSharingPreference(userDoc.data().shareLocation || false);
          // console.log("User sharing preference:", userDoc.data().shareLocation);
        }
      } catch (error) {
        console.error("Error fetching user sharing preference:", error);
      }
    };
    fetchUserPreference();
  }, [currentUser]);

  // Set map center based on user location
  useEffect(() => {
    if (location) {
      setMapCenter({ lat: location.latitude, lng: location.longitude });
      // Note: locationLoading from useUserLocation indicates loading the *first* location
    }
    // If location becomes null (e.g., permissions revoked), reset map center?
    // else { setMapCenter(null); }
  }, [location]);

  // Load places function
  const loadPlaces = useCallback(async () => {
    // Requires location AND shouldn't run if already loaded unless forced
    if (!location || placesLoaded) return;

    // console.log("Attempting to load places...");
    try {
      setLoadingPlaces(true);
      // Fetch places using the current location
      const placesData = await fetchNearbyPlaces(location, 1500, 'tourist_attraction');

      if (!placesData || placesData.length === 0) {
        console.log('No tourist attractions found nearby.');
        setPlaces([]);
        setPlacesLoaded(true); // Mark as loaded even if empty
        setLoadingPlaces(false);
        return;
      }
      // console.log(`Found ${placesData.length} places.`);

      // Add traveler count to each place
      const placesWithTravelerCount = await Promise.all(
        placesData.map(async (place) => {
          // **FIXED:** Check for valid geometry and location before calling getTravelerCountAtPlace
          if (!place.geometry || !place.geometry.location || typeof place.geometry.location.lat !== 'function') {
            console.warn(`Place ${place.name || place.place_id} missing valid geometry. Skipping traveler count.`);
            return { ...place, travelerCount: 0 };
          }
          // Extract coordinates correctly
          const placeLocation = {
            latitude: place.geometry.location.lat(),
            longitude: place.geometry.location.lng()
          };

          try {
            const travelerCount = await getTravelerCountAtPlace(
              placeLocation, // Pass the correct location object
              0.1 // 100 meters radius
            );
            // console.log(`Traveler count for ${place.name}: ${travelerCount}`);
            return { ...place, travelerCount: travelerCount || 0 };
          } catch (error) {
            console.error(`Error getting traveler count for place ${place.name || place.place_id}:`, error);
            return { ...place, travelerCount: 0 };
          }
        })
      );

      setPlaces(placesWithTravelerCount);
      setPlacesLoaded(true); // Mark places as loaded
    } catch (error) {
      console.error('Error loading places:', error);
      setPlaces([]);
      // Consider setting placesLoaded = true even on error to prevent retries? Or allow retry?
      // setPlacesLoaded(true);
    } finally {
      setLoadingPlaces(false);
    }
    // Dependencies: location is crucial. placesLoaded prevents re-running after first success.
  }, [location, placesLoaded]); // Keep placesLoaded dependency


  // Load travelers function
  const loadTravelers = useCallback(async () => {
    // Requires location and current user ID
    if (!location || !currentUser) return;

    // console.log("Attempting to load travelers...");
    try {
      setLoadingTravelers(true);
      // **FIXED:** Pass currentUser.uid
      const travelersData = await fetchNearbyTravelers(location, currentUser.uid, 10); // 10km radius
      // console.log("Nearby travelers found:", travelersData);
      setNearbyTravelers(travelersData || []);
    } catch (error) {
      console.error('Error loading travelers:', error);
      setNearbyTravelers([]);
    } finally {
      setLoadingTravelers(false);
    }
    // Dependencies: location and currentUser are needed to perform the fetch.
  }, [location, currentUser]); // currentUser dependency added

  // Fetch nearby places when location is first available
  useEffect(() => {
    if (location && !placesLoaded) {
      loadPlaces();
    }
  }, [location, loadPlaces, placesLoaded]);

  // Fetch nearby travelers when location is available and setup refresh interval
  useEffect(() => {
    if (!location || !currentUser) {
      // If location or user becomes unavailable, clear travelers and stop interval
      setNearbyTravelers([]);
      setLoadingTravelers(false); // Stop loading indicator
      // Need a way to clear interval if it was already set
      return;
    };

    loadTravelers(); // Initial load

    // Set up interval to refresh travelers every 30 seconds
    const intervalId = setInterval(loadTravelers, 30000);

    // Cleanup interval on component unmount or when dependencies change
    return () => {
        // console.log("Clearing traveler refresh interval");
        clearInterval(intervalId);
    }
    // Re-run this effect if location or currentUser changes.
  }, [location, currentUser, loadTravelers]);

  // Fetch place details when a place is selected
  useEffect(() => {
    const loadPlaceDetails = async () => {
      // Use place_id which is consistent
      if (!selectedPlace || !selectedPlace.place_id) return;

      // Skip if we already have sufficient detailed info (e.g., website or opening_hours)
      if (selectedPlace.website || selectedPlace.opening_hours) return;

      // console.log("Fetching details for place:", selectedPlace.place_id);
      try {
        // Add temporary loading state for details?
        const details = await fetchPlaceDetails(selectedPlace.place_id);
        if (details) {
          // Merge details with existing state, preserving travelerCount
          setSelectedPlace(prevState => ({
              ...prevState, // Keep existing data like travelerCount
              ...details   // Add new details fetched
            }));
        } else {
            console.warn("Failed to fetch details for place:", selectedPlace.place_id);
            // Optionally handle failure e.g. show a message
        }
      } catch (error) {
        console.error('Error loading place details:', error);
      }
    };

    loadPlaceDetails();
    // Dependency: selectedPlace.place_id ensures it runs when the ID changes.
  }, [selectedPlace?.place_id, selectedPlace]);

  // Combined loading state for initial view
  const initialLoading = locationLoading || loadingPlaces || (loadingTravelers && nearbyTravelers.length === 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Explore Places & Connect
        </h1>

        {locationError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6" role="alert">
            <p><span className="font-bold">Location Error:</span> {locationError}</p>
            <p className="text-sm">Please ensure location services are enabled and permissions granted for this site.</p>
          </div>
        )}

        {/* Show a general loading indicator until map center is ready */}
        {locationLoading && !mapCenter && (
           <div className="flex items-center justify-center p-8">
                <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
                <span className="ml-3 text-lg text-gray-600 dark:text-gray-400">Finding your location...</span>
            </div>
        )}

        {/* Render map and lists once mapCenter is available */}
        {mapCenter && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left sidebar - Places list */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                  <FaCompass className="mr-2 text-indigo-600 dark:text-indigo-400" />
                  Nearby Places
                </h2>
                {loadingPlaces ? (
                  <div className="flex items-center justify-center p-8">
                    <FaSpinner className="animate-spin text-indigo-600 text-xl" />
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Loading places...</span>
                  </div>
                ) : (
                  <PlacesList
                    places={places}
                    onSelectPlace={setSelectedPlace}
                    selectedPlace={selectedPlace}
                  />
                )}
              </div>

              {/* Main content - Map */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 lg:col-span-2 h-[500px]">
                 {/* MapComponent handles its own loading internally once props are ready */}
                 <MapComponent
                    center={mapCenter}
                    places={places}
                    travelers={nearbyTravelers}
                    selectedPlace={selectedPlace}
                    onSelectPlace={setSelectedPlace}
                  />
              </div>
            </div>

            {/* Place details section */}
            {selectedPlace && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
                {/* PlaceDetails component expects a 'place' prop */}
                <PlaceDetails place={selectedPlace} />
              </div>
            )}

            {/* Nearby travelers section */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                <FaUsers className="mr-2 text-indigo-600 dark:text-indigo-400" />
                Nearby Travelers
              </h2>
              {loadingTravelers ? (
                <div className="flex items-center justify-center p-4">
                  <FaSpinner className="animate-spin text-indigo-600 text-xl" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading travelers...</span>
                </div>
              ) : (
                <TravelersList travelers={nearbyTravelers} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
// --- END OF FILE page.js ---