'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { FaUser, FaClock, FaUserPlus, FaUserCheck, FaUserTimes, FaSpinner, FaComments } from 'react-icons/fa';
import { formatLastActive, checkFriendshipStatus, sendFriendRequest, removeFriendship } from '../utils/friendUtils';

export default function UserCard({ user, currentUserId, showActions = true, onFriendshipChange = null }) {
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchFriendshipStatus = async () => {
      if (!currentUserId || !user.id) {
        setLoading(false);
        return;
      }

      try {
        const status = await checkFriendshipStatus(currentUserId, user.id);
        setFriendshipStatus(status);
      } catch (error) {
        console.error('Error checking friendship status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendshipStatus();
  }, [currentUserId, user.id]);

  const handleAddFriend = async () => {
    if (actionLoading) return;
    
    setActionLoading(true);
    
    try {
      const result = await sendFriendRequest(currentUserId, user.id);
      setFriendshipStatus(result);
      
      if (onFriendshipChange) {
        onFriendshipChange('sent', result);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendshipStatus || actionLoading) return;
    
    setActionLoading(true);
    
    try {
      await removeFriendship(friendshipStatus.id);
      
      if (onFriendshipChange) {
        onFriendshipChange('removed', friendshipStatus);
      }
      
      setFriendshipStatus(null);
    } catch (error) {
      console.error('Error removing friendship:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const renderActionButton = () => {
    if (!showActions) return null;
    
    if (loading) {
      return (
        <button 
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-500 bg-gray-100 dark:text-gray-400 dark:bg-gray-800 cursor-not-allowed"
          disabled
        >
          <FaSpinner className="animate-spin mr-1" />
          Loading...
        </button>
      );
    }

    if (!friendshipStatus) {
      return (
        <button 
          onClick={handleAddFriend}
          disabled={actionLoading}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 dark:text-indigo-200 dark:bg-indigo-900/50 dark:hover:bg-indigo-900/70 transition-colors"
        >
          {actionLoading ? (
            <FaSpinner className="animate-spin mr-1" />
          ) : (
            <FaUserPlus className="mr-1" />
          )}
          Follow
        </button>
      );
    }

    if (friendshipStatus.status === 'pending') {
      if (friendshipStatus.direction === 'sent') {
        return (
          <button 
            onClick={handleRemoveFriend}
            disabled={actionLoading}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 dark:text-yellow-200 dark:bg-yellow-900/50 dark:hover:bg-yellow-900/70 transition-colors"
          >
            {actionLoading ? (
              <FaSpinner className="animate-spin mr-1" />
            ) : (
              <FaUserTimes className="mr-1" />
            )}
            Cancel Request
          </button>
        );
      } else {
        // This is handled in FriendRequestsList component
        return null;
      }
    }

    if (friendshipStatus.status === 'accepted') {
      return (
        <button 
          onClick={handleRemoveFriend}
          disabled={actionLoading}
          className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70 transition-colors"
        >
          {actionLoading ? (
            <FaSpinner className="animate-spin mr-1" />
          ) : (
            <FaUserCheck className="mr-1" />
          )}
          Following
        </button>
      );
    }

    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {user.photoURL ? (
            <Image
              src={user.photoURL}
              alt={user.displayName || 'User'}
              width={48}
              height={48}
              className="rounded-full"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
              <FaUser className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.displayName || 'Anonymous User'}
          </p>
          {user.lastActive && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
              <FaClock className="flex-shrink-0 mr-1 h-3 w-3" />
              <span>Active {formatLastActive(user.lastActive)}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          {renderActionButton()}
          
          <Link
            href={`/chat/${user.id}`}
            className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/70 transition-colors"
          >
            <FaComments className="mr-1" />
            Message
          </Link>
        </div>
      </div>
    </div>
  );
}
