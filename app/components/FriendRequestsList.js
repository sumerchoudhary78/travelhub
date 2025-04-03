'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FaUser, FaClock, FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import { formatLastActive, acceptFriendRequest, rejectFriendRequest } from '../utils/friendUtils';

export default function FriendRequestsList({ requests, onRequestAction = null }) {
  const [actionStates, setActionStates] = useState({});

  const handleAccept = async (request) => {
    if (actionStates[request.friendshipId]) return;

    setActionStates(prev => ({
      ...prev,
      [request.friendshipId]: 'accepting'
    }));

    try {
      await acceptFriendRequest(request.friendshipId);

      if (onRequestAction) {
        onRequestAction('accepted', request);
      }

      setActionStates(prev => ({
        ...prev,
        [request.friendshipId]: 'accepted'
      }));
    } catch (error) {
      console.error('Error accepting friend request:', error);

      setActionStates(prev => ({
        ...prev,
        [request.friendshipId]: null
      }));
    }
  };

  const handleReject = async (request) => {
    if (actionStates[request.friendshipId]) return;

    setActionStates(prev => ({
      ...prev,
      [request.friendshipId]: 'rejecting'
    }));

    try {
      await rejectFriendRequest(request.friendshipId);

      if (onRequestAction) {
        onRequestAction('rejected', request);
      }

      setActionStates(prev => ({
        ...prev,
        [request.friendshipId]: 'rejected'
      }));
    } catch (error) {
      console.error('Error rejecting friend request:', error);

      setActionStates(prev => ({
        ...prev,
        [request.friendshipId]: null
      }));
    }
  };

  if (!requests || requests.length === 0) {
    return (
      <div className="text-center py-8">
        <FaUser className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No pending requests</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          You don&apos;t have any pending friend requests.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const actionState = actionStates[request.friendshipId];

        // Skip if already handled
        if (actionState === 'accepted' || actionState === 'rejected') {
          return null;
        }

        return (
          <div key={request.friendshipId} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {request.photoURL ? (
                  <Image
                    src={request.photoURL}
                    alt={request.displayName || 'User'}
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
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {request.displayName || 'Anonymous User'}
                </p>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <FaClock className="flex-shrink-0 mr-1 h-3 w-3" />
                  <span>
                    {request.createdAt
                      ? `Requested ${formatLastActive(request.createdAt)}`
                      : 'Request pending'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAccept(request)}
                  disabled={actionState === 'accepting' || actionState === 'rejecting'}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-200 dark:bg-green-900/50 dark:hover:bg-green-900/70 transition-colors"
                >
                  {actionState === 'accepting' ? (
                    <FaSpinner className="animate-spin mr-1" />
                  ) : (
                    <FaCheck className="mr-1" />
                  )}
                  Accept
                </button>
                <button
                  onClick={() => handleReject(request)}
                  disabled={actionState === 'accepting' || actionState === 'rejecting'}
                  className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-200 dark:bg-red-900/50 dark:hover:bg-red-900/70 transition-colors"
                >
                  {actionState === 'rejecting' ? (
                    <FaSpinner className="animate-spin mr-1" />
                  ) : (
                    <FaTimes className="mr-1" />
                  )}
                  Decline
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
