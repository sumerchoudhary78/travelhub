'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaUser, FaPaperPlane, FaGlobeAmericas } from 'react-icons/fa';

export default function GlobalChat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [userCache, setUserCache] = useState({});

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for messages in the global chat
  useEffect(() => {
    if (!currentUser) return;

    const messagesRef = collection(db, 'globalChat');
    const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const messagesData = [];
      querySnapshot.forEach((doc) => {
        messagesData.push({
          id: doc.id,
          ...doc.data()
        });
      });

      setMessages(messagesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch user data for messages
  useEffect(() => {
    const fetchUserData = async () => {
      // Get user IDs that aren't in the cache yet
      const userIds = messages
        .map(msg => msg.userId)
        .filter(id => id && !userCache[id]);

      // Remove duplicates
      const uniqueUserIds = [...new Set(userIds)];

      if (uniqueUserIds.length === 0) return;

      const newUserCache = { ...userCache };
      let hasUpdates = false;

      for (const userId of uniqueUserIds) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            newUserCache[userId] = userDoc.data();
            hasUpdates = true;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }

      // Only update state if we have new data
      if (hasUpdates) {
        setUserCache(newUserCache);
      }
    };

    fetchUserData();
  }, [messages]);

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser) return;

    try {
      await addDoc(collection(db, 'globalChat'), {
        text: newMessage.trim(),
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        photoURL: currentUser.photoURL || null,
        timestamp: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';

    const date = timestamp.toDate();
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mr-3">
          <FaGlobeAmericas className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Global Chat</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Chat with travelers from around the world</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : messages.length > 0 ? (
          messages.map((message) => {
            const isCurrentUser = message.userId === currentUser.uid;
            const userData = userCache[message.userId] || {};

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs md:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-3' : 'mr-3'}`}>
                    {message.photoURL || userData.photoURL ? (
                      <Image
                        src={message.photoURL || userData.photoURL}
                        alt={message.displayName || userData.displayName || 'User'}
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <FaUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center mb-1">
                      <p className={`text-xs font-medium ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-500 dark:text-gray-400`}>
                        {message.displayName || userData.displayName || 'Anonymous'}
                      </p>
                      {message.timestamp && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isCurrentUser
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Be the first to say hello!</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-l-lg border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPaperPlane />
          </button>
        </form>
      </div>
    </div>
  );
}
