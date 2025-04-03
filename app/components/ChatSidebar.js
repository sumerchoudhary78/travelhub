'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { collection, query, where, orderBy, limit, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaGlobeAmericas, FaUser, FaSearch } from 'react-icons/fa';

export default function ChatSidebar({ activeChat, onChatSelect, recentChats, setRecentChats, currentUser }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users for search
  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(100));
        const querySnapshot = await getDocs(q);

        const usersData = [];
        querySnapshot.forEach((doc) => {
          const userData = doc.data();
          // Don't include current user
          if (doc.id !== currentUser.uid) {
            usersData.push({
              id: doc.id,
              displayName: userData.displayName || 'Anonymous',
              photoURL: userData.photoURL || null,
              lastActive: userData.lastActive?.toDate() || null
            });
          }
        });

        setUsers(usersData);
        setFilteredUsers(usersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUser]);

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, users]);

  // Listen for recent chats
  useEffect(() => {
    if (!currentUser) return;

    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef,
      where('participants', 'array-contains', currentUser.uid),
      orderBy('lastMessageTime', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatsData = [];
      querySnapshot.forEach((doc) => {
        const chatData = doc.data();

        // Skip global chat as it's always shown
        if (chatData.isGlobalChat) return;

        // Find the other participant
        const otherParticipantId = chatData.participants.find(id => id !== currentUser.uid);

        // Find user data for the other participant
        const otherUser = users.find(user => user.id === otherParticipantId);

        if (otherUser) {
          chatsData.push({
            id: doc.id,
            user: otherUser,
            lastMessage: chatData.lastMessage,
            lastMessageTime: chatData.lastMessageTime?.toDate() || null,
            unreadCount: chatData.unreadCount?.[currentUser.uid] || 0
          });
        }
      });

      // Sort by last message time
      chatsData.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return b.lastMessageTime - a.lastMessageTime;
      });

      // Update recent chats
      setRecentChats(chatsData);
    });

    return () => unsubscribe();
  }, [currentUser, users, setRecentChats]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Chats</h2>

      {/* Search input */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md leading-5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Global chat */}
      <div
        className={`flex items-center p-3 rounded-lg cursor-pointer mb-2 ${
          activeChat === 'global'
            ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
        }`}
        onClick={() => onChatSelect('global')}
      >
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
          <FaGlobeAmericas className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Global Chat</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Chat with all travelers</p>
        </div>
      </div>

      {/* Recent chats */}
      {recentChats && recentChats.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Recent Chats</h3>
          <div className="space-y-2">
            {recentChats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  activeChat === chat.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }`}
                onClick={() => onChatSelect(chat.id, chat.user)}
              >
                <div className="flex-shrink-0">
                  {chat.user.photoURL ? (
                    <Image
                      src={chat.user.photoURL}
                      alt={chat.user.displayName}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <FaUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{chat.user.displayName}</p>
                    {chat.lastMessageTime && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {chat.lastMessageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {chat.lastMessage || 'No messages yet'}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <div className="ml-2 bg-indigo-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {chat.unreadCount}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All users */}
      <div>
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">All Users</h3>
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading users...</p>
        ) : filteredUsers.length > 0 ? (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center p-3 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                onClick={() => {
                  // Generate a chat ID for private chats
                  const chatId = [currentUser.uid, user.id].sort().join('_');
                  onChatSelect(chatId, user);
                }}
              >
                <div className="flex-shrink-0">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <FaUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.displayName}</p>
                  {user.lastActive && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Last active: {user.lastActive.toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">No users found</p>
        )}
      </div>
    </div>
  );
}
