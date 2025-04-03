'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { collection, query, orderBy, limit, onSnapshot, addDoc, serverTimestamp, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FaUser, FaPaperPlane, FaCircle } from 'react-icons/fa';

export default function PrivateChat({ currentUser, selectedUser, chatId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatPartner, setChatPartner] = useState(null);
  const messagesEndRef = useRef(null);

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

  // Send a new message
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !currentUser || !chatId || !chatPartner) return;

    try {
      // Add message to the subcollection
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        text: newMessage.trim(),
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderPhotoURL: currentUser.photoURL || null,
        timestamp: serverTimestamp()
      });

      // Update the chat document
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: newMessage.trim(),
        lastMessageTime: serverTimestamp(),
        [`unreadCount.${chatPartner.id}`]: (messages.filter(m => m.senderId !== chatPartner.id).length + 1)
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
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <div className="flex-shrink-0 relative">
          {chatPartner.photoURL ? (
            <Image
              src={chatPartner.photoURL}
              alt={chatPartner.displayName || 'User'}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <FaUser className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </div>
          )}
          {chatPartner.online && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white dark:border-gray-800"></div>
          )}
        </div>
        <div className="ml-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {chatPartner.displayName || 'Anonymous'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {chatPartner.lastActive ? (
              `Last active: ${new Date(chatPartner.lastActive).toLocaleDateString()}`
            ) : (
              'Offline'
            )}
          </p>
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
            const isCurrentUser = message.senderId === currentUser.uid;

            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-xs md:max-w-md ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isCurrentUser && (
                    <div className={`flex-shrink-0 mr-3`}>
                      {message.senderPhotoURL ? (
                        <Image
                          src={message.senderPhotoURL}
                          alt={message.senderName || 'User'}
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
                  )}
                  <div>
                    {message.timestamp && (
                      <p className={`text-xs ${isCurrentUser ? 'text-right' : 'text-left'} text-gray-400 dark:text-gray-500 mb-1`}>
                        {formatTimestamp(message.timestamp)}
                      </p>
                    )}
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
            <p className="text-gray-500 dark:text-gray-400">No messages yet. Start the conversation!</p>
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
