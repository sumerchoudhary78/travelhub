'use client';

import { useState, useEffect } from 'react';
import { FaSearch, FaSpinner } from 'react-icons/fa';
import UserCard from './UserCard';
import { searchUsers } from '../utils/friendUtils';

export default function UserSearch({ currentUserId, onFriendshipChange = null }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(timerId);
    };
  }, [searchTerm]);

  // Perform search when debounced search term changes
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTerm.trim() || !currentUserId) {
        setSearchResults([]);
        return;
      }

      setLoading(true);

      try {
        const results = await searchUsers(debouncedSearchTerm, currentUserId);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching users:', error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTerm, currentUserId]);

  const handleFriendshipChange = (action, friendship) => {
    if (onFriendshipChange) {
      onFriendshipChange(action, friendship);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Search for travelers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && (
        <div className="flex justify-center items-center py-4">
          <FaSpinner className="animate-spin text-indigo-600 text-xl" />
          <span className="ml-2 text-gray-600 dark:text-gray-400">Searching...</span>
        </div>
      )}

      {!loading && debouncedSearchTerm && searchResults.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-600 dark:text-gray-400">No users found matching &quot;{debouncedSearchTerm}&quot;</p>
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="space-y-4">
          {searchResults.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUserId={currentUserId}
              onFriendshipChange={handleFriendshipChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
