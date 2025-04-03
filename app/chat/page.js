'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from 'next/navigation';
import ChatSidebar from '../components/ChatSidebar';
import GlobalChat from '../components/GlobalChat';
import PrivateChat from '../components/PrivateChat';
import { FaComments, FaSpinner } from 'react-icons/fa';

export default function ChatPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [activeChat, setActiveChat] = useState('global');
  const [selectedUser, setSelectedUser] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Check user authentication status and redirect if needed
  useEffect(() => {
    // Only redirect if we've checked auth status
    if (initialized && !currentUser) {
      router.push('/auth/login');
    } else if (currentUser) {
      setLoading(false);
    }
    
    // Set initialized after first render
    setInitialized(true);
  }, [currentUser, initialized, router]);

  // Handle chat selection
  const handleChatSelect = (chatId, user = null) => {
    setActiveChat(chatId);
    setSelectedUser(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center">
          <FaSpinner className="animate-spin h-12 w-12 text-indigo-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <FaComments className="mr-3 text-indigo-600 dark:text-indigo-400" />
          Chat
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat sidebar */}
          <div className="lg:col-span-1">
            <ChatSidebar
              activeChat={activeChat}
              onChatSelect={handleChatSelect}
              recentChats={recentChats}
              setRecentChats={setRecentChats}
              currentUser={currentUser}
            />
          </div>

          {/* Chat content */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {activeChat === 'global' ? (
              <GlobalChat currentUser={currentUser} />
            ) : (
              <PrivateChat
                currentUser={currentUser}
                selectedUser={selectedUser}
                chatId={activeChat}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}