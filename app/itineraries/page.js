'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { collection, query, where, orderBy, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaPlus, FaRoute, FaGlobeAmericas, FaSpinner } from 'react-icons/fa';
import ItineraryCard from '../components/ItineraryCard';
import ItineraryList from '../components/ItineraryList';

export default function Itineraries() {
  const { currentUser } = useAuth();
  const [userItineraries, setUserItineraries] = useState([]);
  const [publicItineraries, setPublicItineraries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!currentUser) {
      return;
    }

    const fetchItineraries = async () => {
      setLoading(true);
      try {
        // Fetch user's itineraries
        const userItinerariesQuery = query(
          collection(db, 'itineraries'),
          where('userId', '==', currentUser.uid),
          orderBy('updatedAt', 'desc')
        );
        const userItinerariesSnapshot = await getDocs(userItinerariesQuery);
        const userItinerariesData = userItinerariesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserItineraries(userItinerariesData);

        // Fetch public itineraries (excluding user's own)
        const publicItinerariesQuery = query(
          collection(db, 'itineraries'),
          where('isPublic', '==', true),
          where('userId', '!=', currentUser.uid),
          orderBy('userId'), // Required for inequality filter
          orderBy('updatedAt', 'desc')
        );
        const publicItinerariesSnapshot = await getDocs(publicItinerariesQuery);
        const publicItinerariesData = publicItinerariesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setPublicItineraries(publicItinerariesData);
      } catch (error) {
        console.error('Error fetching itineraries:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchItineraries();
  }, [currentUser]);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
          <FaRoute className="mr-2 text-indigo-600 dark:text-indigo-400" />
          Travel Itineraries
        </h1>
        <Link href="/itineraries/create" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center">
          <FaPlus className="mr-2" />
          Create New
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* User's itineraries */}
          <ItineraryList
            itineraries={userItineraries}
            title="Your Itineraries"
            icon={<FaRoute className="mr-2 text-indigo-500" />}
            emptyMessage="You haven't created any itineraries yet."
            createLink="/itineraries/create"
          />

          {/* Public itineraries */}
          <ItineraryList
            itineraries={publicItineraries}
            title="Discover Public Itineraries"
            icon={<FaGlobeAmericas className="mr-2 text-indigo-500" />}
            emptyMessage="No public itineraries available."
          />
        </div>
      )}
    </div>
  );
}


