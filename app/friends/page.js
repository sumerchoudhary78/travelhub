'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/navigation';
import { FaUserFriends, FaUserPlus, FaSearch, FaSpinner } from 'react-icons/fa';
import FriendsList from '../components/FriendsList';
import FriendRequestsList from '../components/FriendRequestsList';
import UserSearch from '../components/UserSearch';
import { getUserFriends, getPendingFriendRequests } from '../utils/friendUtils';

export default function Friends() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, router]);

  // Fetch friends and requests
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      setLoading(true);

      try {
        const [friendsData, requestsData] = await Promise.all([
          getUserFriends(currentUser.uid),
          getPendingFriendRequests(currentUser.uid)
        ]);

        setFriends(friendsData);
        setRequests(requestsData);
      } catch (error) {
        console.error('Error fetching friends data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const handleFriendshipChange = (action, friendship) => {
    // Update local state based on action
    if (action === 'removed') {
      setFriends(prev => prev.filter(friend => 
        friend.id !== friendship.friendId && friend.id !== friendship.userId
      ));
    } else if (action === 'sent') {
      // Nothing to do here, as the request is sent to another user
    }
  };

  const handleRequestAction = (action, request) => {
    // Remove the request from the list
    setRequests(prev => prev.filter(r => r.friendshipId !== request.friendshipId));

    // If accepted, add to friends list
    if (action === 'accepted') {
      setFriends(prev => [
        ...prev,
        {
          id: request.id,
          displayName: request.displayName,
          photoURL: request.photoURL,
          lastActive: request.lastActive,
          friendshipId: request.friendshipId,
          direction: 'received'
        }
      ]);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view friends</h1>
          <Link href="/auth/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
        <FaUserFriends className="mr-3 text-indigo-600 dark:text-indigo-400" />
        Friends
      </h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('friends')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'friends'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FaUserFriends className="mr-2" />
              <span>Following</span>
              {friends.length > 0 && (
                <span className="ml-2 bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs px-2 py-0.5 rounded-full">
                  {friends.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FaUserPlus className="mr-2" />
              <span>Requests</span>
              {requests.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs px-2 py-0.5 rounded-full">
                  {requests.length}
                </span>
              )}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'search'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <div className="flex items-center">
              <FaSearch className="mr-2" />
              <span>Find Travelers</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <FaSpinner className="animate-spin text-indigo-600 text-3xl" />
        </div>
      ) : (
        <div>
          {activeTab === 'friends' && (
            <FriendsList
              friends={friends}
              currentUserId={currentUser.uid}
              onFriendshipChange={handleFriendshipChange}
            />
          )}

          {activeTab === 'requests' && (
            <FriendRequestsList
              requests={requests}
              onRequestAction={handleRequestAction}
            />
          )}

          {activeTab === 'search' && (
            <UserSearch
              currentUserId={currentUser.uid}
              onFriendshipChange={handleFriendshipChange}
            />
          )}
        </div>
      )}
    </div>
  );
}
