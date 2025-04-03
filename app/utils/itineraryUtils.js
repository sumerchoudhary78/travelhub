'use client';

import { collection, query, where, orderBy, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

// Format date for display
export function formatDate(timestamp) {
  if (!timestamp) return 'Not specified';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Format date range
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return 'No dates specified';
  
  const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
  const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
  
  return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

// Calculate number of days in itinerary
export function calculateDaysCount(startDate, endDate) {
  if (!startDate || !endDate) return 1;
  
  const start = startDate.toDate ? startDate.toDate() : new Date(startDate);
  const end = endDate.toDate ? endDate.toDate() : new Date(endDate);
  
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1);
}

// Fetch user's itineraries
export async function fetchUserItineraries(userId) {
  try {
    const userItinerariesQuery = query(
      collection(db, 'itineraries'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const userItinerariesSnapshot = await getDocs(userItinerariesQuery);
    
    return userItinerariesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching user itineraries:', error);
    throw error;
  }
}

// Fetch public itineraries (excluding user's own)
export async function fetchPublicItineraries(userId) {
  try {
    const publicItinerariesQuery = query(
      collection(db, 'itineraries'),
      where('isPublic', '==', true),
      where('userId', '!=', userId),
      orderBy('userId'), // Required for inequality filter
      orderBy('updatedAt', 'desc')
    );
    
    const publicItinerariesSnapshot = await getDocs(publicItinerariesQuery);
    
    return publicItinerariesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching public itineraries:', error);
    throw error;
  }
}

// Fetch a single itinerary by ID
export async function fetchItinerary(itineraryId) {
  try {
    const itineraryRef = doc(db, 'itineraries', itineraryId);
    const itinerarySnap = await getDoc(itineraryRef);
    
    if (!itinerarySnap.exists()) {
      return null;
    }
    
    return {
      id: itinerarySnap.id,
      ...itinerarySnap.data()
    };
  } catch (error) {
    console.error('Error fetching itinerary:', error);
    throw error;
  }
}

// Fetch locations for an itinerary
export async function fetchItineraryLocations(itineraryId) {
  try {
    const locationsQuery = query(
      collection(db, 'itineraries', itineraryId, 'locations'),
      orderBy('day'),
      orderBy('order')
    );
    
    const locationsSnap = await getDocs(locationsQuery);
    
    return locationsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching itinerary locations:', error);
    throw error;
  }
}

// Create a new itinerary
export async function createItinerary(userId, itineraryData) {
  try {
    const newItinerary = {
      userId,
      ...itineraryData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'itineraries'), newItinerary);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating itinerary:', error);
    throw error;
  }
}

// Update an existing itinerary
export async function updateItinerary(itineraryId, itineraryData) {
  try {
    const itineraryRef = doc(db, 'itineraries', itineraryId);
    
    await updateDoc(itineraryRef, {
      ...itineraryData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating itinerary:', error);
    throw error;
  }
}

// Delete an itinerary
export async function deleteItinerary(itineraryId) {
  try {
    // First, delete all locations in the itinerary
    const locationsQuery = query(collection(db, 'itineraries', itineraryId, 'locations'));
    const locationsSnap = await getDocs(locationsQuery);
    
    const deletePromises = locationsSnap.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    
    await Promise.all(deletePromises);
    
    // Then delete the itinerary itself
    await deleteDoc(doc(db, 'itineraries', itineraryId));
    
    return true;
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    throw error;
  }
}

// Add a location to an itinerary
export async function addLocation(itineraryId, locationData) {
  try {
    const newLocation = {
      ...locationData,
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(
      collection(db, 'itineraries', itineraryId, 'locations'), 
      newLocation
    );
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding location:', error);
    throw error;
  }
}

// Update a location
export async function updateLocation(itineraryId, locationId, locationData) {
  try {
    const locationRef = doc(db, 'itineraries', itineraryId, 'locations', locationId);
    
    await updateDoc(locationRef, {
      ...locationData,
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

// Delete a location
export async function deleteLocation(itineraryId, locationId) {
  try {
    await deleteDoc(doc(db, 'itineraries', itineraryId, 'locations', locationId));
    
    return true;
  } catch (error) {
    console.error('Error deleting location:', error);
    throw error;
  }
}

// Group locations by day
export function groupLocationsByDay(locations) {
  return locations.reduce((acc, location) => {
    const day = location.day || 0;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(location);
    return acc;
  }, {});
}
