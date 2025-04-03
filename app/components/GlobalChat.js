'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaUser, FaPaperPlane, FaGlobeAmericas, FaRobot } from 'react-icons/fa';
import TravelAssistant from './TravelAssistant';
import { extractTravelQuery } from '../utils/geminiAI';
import { trackMessageSent, trackTravelerQuery } from '../utils/badgeUtils';

export default function GlobalChat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [userCache, setUserCache] = useState({});
  const [travelQueries, setTravelQueries] = useState({});

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
  }, [messages, userCache]);

  // Check for travel queries in messages
  useEffect(() => {
    const newTravelQueries = {};
    let hasNewQueries = false;

    messages.forEach(message => {
      const query = extractTravelQuery(message.text);
      if (query && !travelQueries[message.id]) {
        newTravelQueries[message.id] = query;
        hasNewQueries = true;
      }
    });

    if (hasNewQueries) {
      setTravelQueries(prev => ({ ...prev, ...newTravelQueries }));
    }
  }, [messages, travelQueries]);

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser) return;

    try {
      const messageText = newMessage.trim();
      await addDoc(collection(db, 'globalChat'), {
        text: messageText,
        userId: currentUser.uid,
        displayName: currentUser.displayName || 'Anonymous',
        photoURL: currentUser.photoURL || null,
        timestamp: serverTimestamp()
      });

      // Track message for badges
      await trackMessageSent(currentUser.uid);

      // Check if message contains @traveler query
      if (messageText.includes('@traveler')) {
        await trackTravelerQuery(currentUser.uid);
      }

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
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center sticky top-0 z-10 shadow-sm">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mr-3 shadow-md">
          <FaGlobeAmericas className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Global Chat</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">Chat with travelers from around the world</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-gray-50 dark:bg-gray-900">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
              <p className="mt-3 text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
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
                <div className={`flex max-w-xs md:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                  <div className={`flex-shrink-0 ${isCurrentUser ? 'ml-3' : 'mr-3'} mb-1`}>
                    {message.photoURL || userData.photoURL ? (
                      <div className="relative">
                        <Image
                          src={message.photoURL || userData.photoURL}
                          alt={message.displayName || userData.displayName || 'User'}
                          width={36}
                          height={36}
                          className="rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                        <FaUser className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="max-w-full">
                    <div className={`flex items-center mb-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <p className={`text-xs font-medium text-gray-600 dark:text-gray-400`}>
                        {message.displayName || userData.displayName || 'Anonymous'}
                      </p>
                      {message.timestamp && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 ml-2">
                          {formatTimestamp(message.timestamp)}
                        </p>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                        isCurrentUser
                          ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 border border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                    </div>
                    {travelQueries[message.id] && (
                      <div className="mt-2 ml-2">
                        <TravelAssistant query={travelQueries[message.id]} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <FaGlobeAmericas className="h-12 w-12 text-indigo-500 dark:text-indigo-400 mx-auto mb-3" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">No messages yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Be the first to say hello!</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-md">
        {newMessage.includes('@traveler') && (
          <div className="mb-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center text-xs text-blue-700 dark:text-blue-300">
              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-800/50 p-1 rounded-full mr-2">
                <FaRobot className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <span>Travel Assistant will respond when you send this message</span>
            </div>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message... (Use @traveler to get travel info)"
              className="w-full rounded-l-full border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-indigo-500 focus:border-indigo-500 pl-4 pr-4 py-3 shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white p-3 rounded-r-full disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200 ease-in-out"
          >
            <FaPaperPlane className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
