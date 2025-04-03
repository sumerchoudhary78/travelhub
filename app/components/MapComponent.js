// --- START OF FILE MapComponent.js ---

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'; // Added useMemo
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { FaSpinner } from 'react-icons/fa';

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem' // Inherit border radius if needed from parent
};

const libraries = ['places'];

// !! REMOVE Icon definitions from here !!

export default function MapComponent({ center, places = [], travelers = [], selectedPlace, onSelectPlace }) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedMarkerInfo, setSelectedMarkerInfo] = useState(null); // Store { type, id, data }

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // ** MOVE Icon definitions inside the component and MEMOIZE them **
  const icons = useMemo(() => {
    // Only define icons once the Google Maps API is loaded
    if (!isLoaded || typeof window === 'undefined' || !window.google?.maps?.SymbolPath) {
        // Return null or default objects if the API isn't ready
        return {
            userIcon: null,
            placeIconDefault: null,
            placeIconSelected: null,
            travelerIcon: null,
        };
    }

    // API is loaded, now it's safe to access window.google.maps
    return {
      userIcon: {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: '#4F46E5', // Indigo for user's location
        fillOpacity: 1,
        strokeWeight: 1.5,
        strokeColor: '#FFFFFF',
        scale: 1.8,
        anchor: new window.google.maps.Point(12, 22) // Use constructor
      },
      placeIconDefault: {
        path: window.google.maps.SymbolPath.CIRCLE, // Now safe to access
        fillColor: '#10B981', // Emerald green
        fillOpacity: 0.9,
        strokeWeight: 1.5,
        strokeColor: '#FFFFFF',
        scale: 7,
        // Center anchor for circle (default for circle symbol)
      },
      placeIconSelected: {
        path: window.google.maps.SymbolPath.CIRCLE, // Now safe to access
        fillColor: '#EF4444', // Red for selected
        fillOpacity: 1.0,
        strokeWeight: 2,
        strokeColor: '#FFFFFF',
        scale: 9,
      },
      travelerIcon: {
        path: window.google.maps.SymbolPath.CIRCLE, // Now safe to access
        fillColor: '#3B82F6', // Blue
        fillOpacity: 0.9,
        strokeWeight: 1.5,
        strokeColor: '#FFFFFF',
        scale: 6,
      }
    };
  }, [isLoaded]); // Recompute only when isLoaded changes


  const onLoad = useCallback(function callback(mapInstance) {
    mapRef.current = mapInstance;
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    mapRef.current = null;
    setMap(null);
  }, []);

   // Pan map to selected place when it changes from outside
   useEffect(() => {
    if (map && selectedPlace && selectedPlace.geometry?.location) {
      const latFn = selectedPlace.geometry.location.lat;
      const lngFn = selectedPlace.geometry.location.lng;
      if (typeof latFn === 'function' && typeof lngFn === 'function') {
        const lat = latFn();
        const lng = lngFn();
        map.panTo({ lat, lng });
        // Ensure marker info is updated if selection came from list
        if (selectedMarkerInfo?.id !== selectedPlace.id || selectedMarkerInfo?.type !== 'place') {
            setSelectedMarkerInfo({ type: 'place', id: selectedPlace.id, data: selectedPlace });
        }
      }
    }
   }, [selectedPlace, map, selectedMarkerInfo]); // Added selectedMarkerInfo dependency


  const handleMarkerClick = (markerInfo) => {
    setSelectedMarkerInfo(markerInfo);
    if (markerInfo.type === 'place') {
      onSelectPlace(markerInfo.data);
      if (map && markerInfo.data.geometry?.location) {
         const latFn = markerInfo.data.geometry.location.lat;
         const lngFn = markerInfo.data.geometry.location.lng;
         if (typeof latFn === 'function' && typeof lngFn === 'function') {
            map.panTo({ lat: latFn(), lng: lngFn() });
         }
      }
    } else if (markerInfo.type === 'traveler') {
        if (map && markerInfo.data.location) {
            map.panTo({ lat: markerInfo.data.location.latitude, lng: markerInfo.data.location.longitude });
        }
    }
  };

  const handleInfoWindowClose = () => {
      setSelectedMarkerInfo(null);
      // Decide if closing info window should deselect the place in the parent
      // onSelectPlace(null);
  }

  // Render info window
  const renderInfoWindow = () => {
    if (!selectedMarkerInfo || !isLoaded) return null; // Check isLoaded here too

    let position;
    let content;
    const key = `${selectedMarkerInfo.type}-${selectedMarkerInfo.id}`;

    try { // Add try-catch for safety accessing geometry/location
        if (selectedMarkerInfo.type === 'place') {
            const placeData = selectedMarkerInfo.data;
            if (!placeData.geometry?.location?.lat || !placeData.geometry?.location?.lng) return null;
            position = {
                lat: placeData.geometry.location.lat(),
                lng: placeData.geometry.location.lng()
            };
            content = (
                <>
                    <h3 className="font-semibold text-gray-900 text-base">{placeData.name}</h3>
                    {placeData.vicinity && (
                        <p className="text-sm text-gray-600 mt-1">{placeData.vicinity}</p>
                    )}
                    {placeData.rating && (
                        <p className="text-sm text-gray-600 mt-1">Rating: {placeData.rating} ⭐ ({placeData.user_ratings_total || 'N/A'})</p>
                    )}
                    {placeData.travelerCount > 0 && (
                        <p className="text-sm text-blue-600 mt-1 font-medium">{placeData.travelerCount} traveler(s) here</p>
                    )}
                </>
            );
        } else if (selectedMarkerInfo.type === 'traveler') {
            const travelerData = selectedMarkerInfo.data;
            if (!travelerData.location) return null;
            position = {
                lat: travelerData.location.latitude,
                lng: travelerData.location.longitude
            };
            content = (
                <>
                    <h3 className="font-semibold text-gray-900 text-base">{travelerData.displayName}</h3>
                    <p className="text-sm text-gray-600 mt-1">Fellow Traveler</p>
                </>
            );
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error preparing InfoWindow data:", error, selectedMarkerInfo);
        return null; // Don't render info window if data is bad
    }


    return (
      <InfoWindow
        key={key}
        position={position}
        onCloseClick={handleInfoWindowClose}
        options={{ pixelOffset: new window.google.maps.Size(0, -35) }} // Adjust offset
      >
        <div className="p-1 max-w-xs">{content}</div>
      </InfoWindow>
    );
  };

  // Loading and Error States
  if (loadError) {
    console.error("Google Maps Load Error:", loadError);
    return (
      <div className="h-full flex items-center justify-center bg-red-100 text-red-700 p-4 rounded-md">
        Error loading Google Maps. Please check your API key and network connection.
      </div>
    );
  }

  // Wait for API to load AND center prop to be valid
  if (!isLoaded || !center || !icons.userIcon) { // Also check if icons are ready
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-md">
        <FaSpinner className="animate-spin text-indigo-600 h-8 w-8" />
         <span className="ml-2 text-gray-600 dark:text-gray-300">Loading Map...</span>
      </div>
    );
  }

  // Render the Map
  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={14}
      onLoad={onLoad}
      onUnmount={onUnmount}
      options={{
        styles: [
          { featureType: "poi.business", stylers: [{ visibility: "off" }] },
          { featureType: "poi.attraction", elementType: "labels", stylers: [{ visibility: "on" }] },
          { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: true,
        streetViewControlOptions: { position: window.google.maps.ControlPosition.RIGHT_TOP },
        fullscreenControl: true,
        fullscreenControlOptions: { position: window.google.maps.ControlPosition.RIGHT_TOP },
        clickableIcons: false
      }}
    >
      {/* User's current location marker */}
      <Marker
        position={center}
        icon={icons.userIcon} // Use memoized icon
        zIndex={1000}
        title="Your Location"
      />

      {/* Place markers */}
      {places.map((place) => {
        if (!place.geometry?.location?.lat || !place.geometry?.location?.lng) return null;

        const placePosition = {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
        };
        const isSelected = selectedMarkerInfo?.type === 'place' && selectedMarkerInfo?.id === place.id;

        return (
          <Marker
            key={`place-${place.id}`}
            position={placePosition}
            onClick={() => handleMarkerClick({ type: 'place', id: place.id, data: place })}
            // Use memoized icons
            icon={isSelected ? icons.placeIconSelected : icons.placeIconDefault}
            zIndex={isSelected ? 100 : 1}
            title={place.name}
          />
        );
      })}

      {/* Traveler markers */}
      {travelers.map((traveler) => {
         if (!traveler.location?.latitude || !traveler.location?.longitude) return null;

         const travelerPosition = {
             lat: traveler.location.latitude,
             lng: traveler.location.longitude
         };
         const isSelected = selectedMarkerInfo?.type === 'traveler' && selectedMarkerInfo?.id === traveler.id;

         return (
            <Marker
                key={`traveler-${traveler.id}`}
                position={travelerPosition}
                onClick={() => handleMarkerClick({ type: 'traveler', id: traveler.id, data: traveler })}
                icon={icons.travelerIcon} // Use memoized icon
                zIndex={isSelected ? 101 : 2}
                title={traveler.displayName}
            />
         );
       })}

      {/* Info window */}
      {renderInfoWindow()}

    </GoogleMap>
  );
}
// --- END OF FILE MapComponent.js ---