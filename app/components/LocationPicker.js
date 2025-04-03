'use client';

import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { FaMapMarkerAlt, FaSpinner } from 'react-icons/fa';

const containerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 40.7128,
  lng: -74.0060 // New York as default
};

export default function LocationPicker({ onLocationSelect, initialLocation = null }) {
  const [marker, setMarker] = useState(initialLocation || null);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  useEffect(() => {
    // Update marker if initialLocation changes
    if (initialLocation) {
      setMarker(initialLocation);
    }
  }, [initialLocation]);

  const handleMapClick = (e) => {
    const newLocation = {
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    };
    
    setMarker(newLocation);
    
    if (onLocationSelect) {
      onLocationSelect(newLocation);
    }
  };

  if (loadError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-700 dark:text-red-400">Error loading Google Maps</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg">
        <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={marker || defaultCenter}
        zoom={marker ? 15 : 10}
        onClick={handleMapClick}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          clickableIcons: false
        }}
      >
        {marker && (
          <Marker
            position={marker}
            icon={{
              path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
              fillColor: '#4F46E5',
              fillOpacity: 1,
              strokeWeight: 1.5,
              strokeColor: '#FFFFFF',
              scale: 1.8,
              anchor: new window.google.maps.Point(12, 22)
            }}
          />
        )}
      </GoogleMap>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
        <FaMapMarkerAlt className="mr-1" />
        {marker ? 'Location selected. Click elsewhere to change.' : 'Click on the map to select a location.'}
      </p>
    </div>
  );
}
