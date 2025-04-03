// --- START OF FILE locationUtils.js ---

'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, GeoPoint, collection, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore'; // Added serverTimestamp
import { db } from '../lib/firebase';
import { useAuth } from '../lib/AuthContext';

// Custom hook to get and track user's location
// `shouldSharePreference` reflects the user's setting (e.g., from their profile)
export function useUserLocation(shouldSharePreference = false) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const watchIdRef = useRef(null);
  const isMountedRef = useRef(true); // Track mount status for async operations

  // Cleanup ref on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);


  useEffect(() => {
    // Function to update location in Firestore, only if sharing is enabled
    const updateUserLocationInFirestore = async (newLocation) => {
      // Only update if the user preference is true, user is logged in, and component is mounted
      if (!shouldSharePreference || !currentUser || !newLocation || !isMountedRef.current) {
        // console.log("Skipping Firestore update. Sharing:", shouldSharePreference, "User:", !!currentUser, "Location:", !!newLocation);
        return;
      }

      try {
        const userRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userRef, {
          location: new GeoPoint(newLocation.latitude, newLocation.longitude),
          lastLocationUpdate: serverTimestamp(), // Use server timestamp
          shareLocation: true // Explicitly ensure shareLocation is true when updating location
        });
        // console.log("Firestore location updated for", currentUser.uid);
      } catch (error) {
        console.error('Error updating location in Firestore:', error);
      }
    };

    // Start watching location
    const startWatchingLocation = () => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser.');
        if (isMountedRef.current) setLoading(false);
        return;
      }

      // Clear any existing watch
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (isMountedRef.current) setLoading(true);

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          if (!isMountedRef.current) return; // Don't update state if unmounted

          const { latitude, longitude } = position.coords;
          const newLocation = { latitude, longitude };
          // console.log("New location received:", newLocation);

          setLocation(newLocation);
          setError(null);
          setLoading(false);

          // Attempt to update Firestore based on user's preference
          updateUserLocationInFirestore(newLocation);
        },
        (err) => {
          if (!isMountedRef.current) return;
          console.error("Geolocation watch error:", err);
          // Handle specific errors
          if (err.code === err.PERMISSION_DENIED) {
              setError("Location permission denied. Please enable it in your browser settings.");
          } else {
              setError(`Error getting location: ${err.message}`);
          }
          setLocation(null); // Clear location on error
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000, // Increased timeout
          maximumAge: 10000 // Use cached position up to 10 seconds old
        }
      );
    };

    startWatchingLocation();

    // Cleanup handled by the initial useEffect with isMountedRef

  }, [shouldSharePreference, currentUser]); // Depend on preference and user status

  // No need for the separate updateUserLocation function outside the hook scope

  return { location, error, loading };
}

// Calculate distance between two coordinates in kilometers
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Format distance for display
export function formatDistance(distance) {
  if (distance === Infinity || isNaN(distance) || distance < 0) return "N/A";
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

// --- Google Maps Utilities --- (Keep as is, seems okay)
let mapServiceInstance = null;

const getMapServiceContainer = () => {
    if (typeof document === 'undefined') return null;
    let mapDiv = document.getElementById('map-service-container');
    if (!mapDiv) {
        mapDiv = document.createElement('div');
        mapDiv.id = 'map-service-container';
        mapDiv.style.display = 'none';
        document.body.appendChild(mapDiv);
    }
    return mapDiv;
}

const getPlacesService = () => {
    if (typeof window === 'undefined' || !window.google || !window.google.maps || !window.google.maps.places) {
        console.error("Google Maps Places library not loaded.");
        return null;
    }
    if (!mapServiceInstance) {
        const mapDiv = getMapServiceContainer();
        if(mapDiv) {
            const map = new window.google.maps.Map(mapDiv, { center: {lat: 0, lng: 0}, zoom: 1 });
            mapServiceInstance = new window.google.maps.places.PlacesService(map);
        }
    }
    return mapServiceInstance;
}

const isGoogleMapsLoaded = () => {
  return typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places;
};

const waitForGoogleMaps = (timeout = 10000) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('waitForGoogleMaps: Not in browser environment'));
    }
    if (isGoogleMapsLoaded()) {
      return resolve();
    }
    let timeoutId = null;
    let intervalId = null;
    const clearTimers = () => {
        if (timeoutId) clearTimeout(timeoutId);
        if (intervalId) clearInterval(intervalId);
    }
    timeoutId = setTimeout(() => {
      clearTimers();
      reject(new Error('waitForGoogleMaps: Google Maps API did not load within timeout'));
    }, timeout);
    intervalId = setInterval(() => {
      if (isGoogleMapsLoaded()) {
        clearTimers();
        resolve();
      }
    }, 100);
  });
};

// ---- Modified fetchNearbyPlaces ---- (Keep as is, uses Places API)
export async function fetchNearbyPlaces(location, radius = 1500, type = null) {
    if (!location) return [];
    const { latitude, longitude } = location;

    try {
        await waitForGoogleMaps();
        const service = getPlacesService();
        if (!service) throw new Error("PlacesService could not be initialized.");

        const request = {
        location: { lat: latitude, lng: longitude },
        radius: radius,
        // Using type for broader categories like 'tourist_attraction'.
        // Consider keyword search for more specific needs.
        ...(type && { type: [type] })
        };

        return new Promise((resolve, reject) => {
        service.nearbySearch(request, (results, status) => { // Removed pagination arg as it's not used
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
            const processedResults = results.map(place => ({
                ...place,
                is_operational: place.business_status === 'OPERATIONAL',
                // Keep original place_id if present, otherwise generate one (less ideal)
                id: place.place_id || `temp-${Math.random().toString(36).substring(7)}`
            }));
            resolve(processedResults);
            } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            resolve([]);
            } else {
            console.error(`Places API nearbySearch Error: ${status}`);
            reject(new Error(`Places API nearbySearch failed with status: ${status}`));
            }
        });
        });

    } catch (error) {
        console.error('Error fetching nearby places:', error);
        return [];
    }
}


// ---- Modified fetchPlaceDetails ---- (Keep as is)
export async function fetchPlaceDetails(placeId) {
  if (!placeId) return null;

  try {
    await waitForGoogleMaps();
    const service = getPlacesService();
    if (!service) throw new Error("PlacesService could not be initialized.");

    const fieldsToRequest = [
        'place_id', 'name', 'rating', 'formatted_phone_number',
        'website', 'opening_hours', 'photos', 'reviews', 'vicinity',
        'geometry', 'address_components', 'types', 'user_ratings_total',
        'business_status'
    ];

    const request = {
      placeId: placeId,
      fields: fieldsToRequest
    };

    return new Promise((resolve, reject) => {
      service.getDetails(request, (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
           const processedPlace = {
             ...place,
             is_operational: place.business_status === 'OPERATIONAL',
             // Ensure it has the id property consistent with fetchNearbyPlaces result
             id: place.place_id
           };
           resolve(processedPlace);
        } else {
          console.error(`Places API getDetails Error for placeId ${placeId}: ${status}`);
           resolve(null);
        }
      });
    });

  } catch (error) {
    console.error(`Error fetching place details for placeId ${placeId}:`, error);
    return null;
  }
}


// Fetch nearby travelers from Firestore - MODIFIED
export async function fetchNearbyTravelers(currentUserLocation, currentUserUid, maxDistanceKm = 10, maxResults = 20) {
  // Added currentUserUid parameter
  if (!currentUserLocation || !currentUserUid) {
      console.warn("fetchNearbyTravelers requires currentUserLocation and currentUserUid.");
      return [];
  }

  try {
    const usersRef = collection(db, 'users');
    // Add filter for recent location update (e.g., last 30 minutes)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const q = query(
      usersRef,
      where('shareLocation', '==', true),
      // Ensure location exists (Firestore doesn't directly query for non-null GeoPoints easily, filter client-side)
      where('lastLocationUpdate', '>', thirtyMinutesAgo), // Filter for recent updates
      orderBy('lastLocationUpdate', 'desc'),
      limit(100) // Fetch a larger batch for client-side distance filtering
    );

    const querySnapshot = await getDocs(q);
    const nearbyTravelers = [];
    // console.log(`Fetched ${querySnapshot.docs.length} potential users sharing location recently.`);

    querySnapshot.forEach((doc) => {
      const userId = doc.id;

      // **Exclude the current user**
      if (userId === currentUserUid) {
          // console.log("Skipping self:", userId);
          return;
      }

      const userData = doc.data();

      // **Crucial validation: Ensure location GeoPoint exists and has properties**
      if (!userData.location || typeof userData.location.latitude !== 'number' || typeof userData.location.longitude !== 'number') {
        // console.warn(`User ${userId} has invalid or missing location data. Skipping.`);
        return;
      }

      const travelerLocation = {
        latitude: userData.location.latitude,
        longitude: userData.location.longitude
      };

      const distance = calculateDistance(
        currentUserLocation.latitude,
        currentUserLocation.longitude,
        travelerLocation.latitude,
        travelerLocation.longitude
      );

      // console.log(`User ${userId} distance: ${distance.toFixed(2)} km`);

      if (distance <= maxDistanceKm) {
        nearbyTravelers.push({
          id: userId,
          displayName: userData.displayName || 'Anonymous Traveler',
          photoURL: userData.photoURL || null,
          location: travelerLocation,
          distance: distance,
          lastActive: userData.lastActive?.toDate ? userData.lastActive.toDate() : null,
          lastLocationUpdate: userData.lastLocationUpdate?.toDate ? userData.lastLocationUpdate.toDate() : null
        });
      }
    });

    // console.log(`Found ${nearbyTravelers.length} travelers within ${maxDistanceKm}km.`);

    // Sort by distance and limit results
    return nearbyTravelers
      .sort((a, b) => a.distance - b.distance)
      .slice(0, maxResults);

  } catch (error) {
    console.error('Error fetching nearby travelers:', error);
    return [];
  }
}


// Get traveler count at a specific place (using nearby travelers) - MODIFIED
// Note: This is an approximation based on users within a radius near the place.
export async function getTravelerCountAtPlace(placeLocation, countRadiusKm = 0.1) {
    // Requires placeLocation { latitude, longitude }
    if (!placeLocation || typeof placeLocation.latitude !== 'number' || typeof placeLocation.longitude !== 'number') {
        console.warn("getTravelerCountAtPlace requires valid placeLocation object with latitude and longitude.");
        return 0;
    }

    try {
        // Fetch travelers near the *place's* location using a small radius.
        // Note: This fetch doesn't exclude the current user, which might be desired
        // if the current user is also near the place. Decide based on product reqs.
        // For now, we assume we want *all* users near the place.
        // We pass null for currentUserUid as we aren't excluding anyone based on ID here.
        const travelersNearPlace = await fetchNearbyTravelers(placeLocation, null, countRadiusKm, 100);
        // console.log(`Found ${travelersNearPlace.length} travelers near place coords:`, placeLocation);
        return travelersNearPlace.length;
    } catch (error) {
        console.error(`Error getting traveler count near location ${JSON.stringify(placeLocation)}:`, error);
        return 0;
    }
}
// --- END OF FILE locationUtils.js ---