'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaUser, FaPaperPlane, FaCircle, FaRobot } from 'react-icons/fa';
import TravelAssistant from './TravelAssistant';
import { extractTravelQuery } from '../utils/geminiAI';
import { trackMessageSent, trackUniqueChat, trackChatInitiated, trackTravelerQuery } from '../utils/badgeUtils';
import { FaComments } from "react-icons/fa";

export default function PrivateChat({ currentUser, selectedUser, chatId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatPartner, setChatPartner] = useState(null);
  const messagesEndRef = useRef(null);
  const [travelQueries, setTravelQueries] = useState({});

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch chat partner data if not provided
  useEffect(() => {
    const fetchChatPartner = async () => {
      if (selectedUser) {
        setChatPartner(selectedUser);
        return;
      }

      if (!chatId || !currentUser) return;

      // Extract the other user's ID from the chat ID
      const userIds = chatId.split('_');
      const otherUserId = userIds.find(id => id !== currentUser.uid);

      if (!otherUserId) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', otherUserId));
        if (userDoc.exists()) {
          setChatPartner({
            id: otherUserId,
            ...userDoc.data()
          });
        }
      } catch (error) {
        console.error('Error fetching chat partner:', error);
      }
    };

    fetchChatPartner();
  }, [chatId, currentUser, selectedUser]);

  // Setup chat document when chat partner is available
  useEffect(() => {
    const setupChat = async () => {
      if (!chatId || !currentUser || !chatPartner) return;

      const chatRef = doc(db, 'chats', chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        // Create new chat document
        await setDoc(chatRef, {
          participants: [currentUser.uid, chatPartner.id],
          createdAt: serverTimestamp(),
          lastMessageTime: null,
          lastMessage: null,
          isGlobalChat: false,
          unreadCount: {
            [currentUser.uid]: 0,
            [chatPartner.id]: 0
          }
        });
      } else {
        // Reset unread count for current user
        await updateDoc(chatRef, {
          [`unreadCount.${currentUser.uid}`]: 0
        });
      }
    };

    setupChat();
  }, [chatId, currentUser, chatPartner]);

  // Listen for messages in the private chat
  useEffect(() => {
    if (!chatId || !currentUser) return;

    // Listen for messages
    const messagesRef = collection(db, 'chats', chatId, 'messages');
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
  }, [chatId, currentUser]);

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

    if (!newMessage.trim() || !currentUser || !chatId || !chatPartner) return;

    try {
      // Add message to the subcollection
      const messageText = newMessage.trim();
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderPhotoURL: currentUser.photoURL || null,
        timestamp: serverTimestamp()
      });

      // Update the chat document
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${chatPartner.id}`]: (messages.filter(m => m.senderId !== chatPartner.id).length + 1)
      });

      // Track message for badges
      await trackMessageSent(currentUser.uid);
      await trackUniqueChat(currentUser.uid, chatPartner.id);

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

  if (!chatPartner) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center sticky top-0 z-10 shadow-sm">
        <div className="flex-shrink-0 relative">
          {chatPartner.photoURL ? (
            <div className="relative">
              <Image
                src={chatPartner.photoURL}
                alt={chatPartner.displayName || 'User'}
                width={40}
                height={40}
                className="rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
              />
              {chatPartner.online && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 shadow-sm"></div>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm border-2 border-white dark:border-gray-800">
                <FaUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
              {chatPartner.online && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800 shadow-sm"></div>
              )}
            </div>
          )}
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {chatPartner.displayName || 'Anonymous'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
            <span className={`inline-block h-2 w-2 rounded-full mr-2 ${chatPartner.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {chatPartner.lastActive ? (
              `Last active: ${new Date(chatPartner.lastActive).toLocaleDateString()}`
            ) : (
              'Offline'
            )}
          </p>
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
            const isCurrentUser = message.senderId === currentUser.uid;

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs md:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                  {!isCurrentUser && (
                    <div className={`flex-shrink-0 mr-3 mb-1`}>
                      {message.senderPhotoURL ? (
                        <div className="relative">
                          <Image
                            src={message.senderPhotoURL}
                            alt={message.senderName || 'User'}
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
                  )}
                  <div className="max-w-full">
                    {message.timestamp && (
                      <p className={`text-xs ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-400 dark:text-gray-500 mb-1`}>
                        {formatTimestamp(message.timestamp)}
                      </p>
                    )}
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
              <FaComments className="h-12 w-12 text-indigo-500 dark:text-indigo-400 mx-auto mb-3" />
              <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">No messages yet</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Start the conversation!</p>
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
