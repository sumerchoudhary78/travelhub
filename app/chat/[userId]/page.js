'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import ChatSidebar from '../../components/ChatSidebar';
import PrivateChat from '../../components/PrivateChat';
import { FaComments, FaArrowLeft, FaSpinner } from 'react-icons/fa';

export default function ChatWithUser({ params }) {
  const { userId } = use(params); // ✅ Unwrap `params` using `use()`
  const { currentUser } = useAuth();
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chatId, setChatId] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Check user authentication status and redirect if needed
  useEffect(() => {
    if (initialized && !currentUser) {
      router.push('/auth/login');
    }
    setInitialized(true);
  }, [currentUser, initialized, router]);

  // Fetch user data and set up chat
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !currentUser) return;

      try {
        const userDoc = await getDoc(doc(db, 'users', userId));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSelectedUser({
            id: userId,
            displayName: userData.displayName || 'Anonymous',
            photoURL: userData.photoURL || null,
            lastActive: userData.lastActive?.toDate() || null,
            online: userData.online || false
          });

          // Generate chat ID (sorted user IDs joined with underscore)
          const sortedIds = [currentUser.uid, userId].sort();
          setChatId(sortedIds.join('_'));
          setLoading(false);
        } else {
          console.log('User not found, redirecting to main chat');
          router.push('/chat');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        router.push('/chat');
      }
    };

    if (currentUser && userId) {
      fetchUserData();
    }
  }, [userId, currentUser, router]);

  // Go back to main chat page
  const handleBackToChat = () => {
    router.push('/chat');
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
        <div className="flex items-center mb-6">
          <button
            onClick={handleBackToChat}
            className="mr-4 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <FaArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <FaComments className="mr-3 text-indigo-600 dark:text-indigo-400" />
            Chat with {selectedUser?.displayName || 'User'}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat sidebar (hidden on mobile) */}
          <div className="hidden lg:block lg:col-span-1">
            <ChatSidebar
              activeChat={chatId}
              onChatSelect={(chatId, user) => router.push(`/chat/${user.id}`)}
              recentChats={recentChats}
              setRecentChats={setRecentChats}
              currentUser={currentUser}
            />
          </div>

          {/* Chat content */}
          <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            {selectedUser && chatId ? (
              <PrivateChat
                currentUser={currentUser}
                selectedUser={selectedUser}
                chatId={chatId}
              />
            ) : (
              <div className="flex items-center justify-center h-[600px]">
                <FaSpinner className="animate-spin mr-2 text-indigo-500" />
                <p className="text-gray-500 dark:text-gray-400">Loading chat...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
