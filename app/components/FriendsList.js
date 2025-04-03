'use client';

import { useState } from 'react';
import UserCard from './UserCard';
import { FaUser } from 'react-icons/fa';

export default function FriendsList({ friends, currentUserId, onFriendshipChange = null }) {
  const [localFriends, setLocalFriends] = useState(friends || []);

  const handleFriendshipChange = (action, friendship) => {
    if (action === 'removed') {
      // Remove the friend from the local list
      setLocalFriends(prev => prev.filter(friend => friend.id !== friendship.friendId && friend.id !== friendship.userId));
      
      if (onFriendshipChange) {
        onFriendshipChange(action, friendship);
      }
    }
  };

  if (!localFriends || localFriends.length === 0) {
    return (
      <div className="text-center py-8">
        <FaUser className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No friends yet</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Start following other travelers to connect with them.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {localFriends.map((friend) => (
        <UserCard
          key={friend.id}
          user={friend}
          currentUserId={currentUserId}
          onFriendshipChange={handleFriendshipChange}
        />
      ))}
    </div>
  );
}
