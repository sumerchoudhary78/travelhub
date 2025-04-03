'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { clearRecentAchievements, BADGES } from '../utils/badgeUtils';
import { FaTrophy, FaTimes } from 'react-icons/fa';

export default function AchievementPopup() {
  const { currentUser } = useAuth();
  const [achievements, setAchievements] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  
  // Listen for new achievements
  useEffect(() => {
    if (!currentUser) return;
    
    const userRef = doc(db, 'users', currentUser.uid);
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        if (userData.recentAchievements && userData.recentAchievements.length > 0) {
          setAchievements(userData.recentAchievements);
        }
      }
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Show achievements one by one
  useEffect(() => {
    if (achievements.length > 0 && !showPopup) {
      // Get the first achievement
      const achievement = achievements[0];
      
      // Find the badge details
      const badgeKey = Object.keys(BADGES).find(key => 
        BADGES[key].id === achievement.badgeId
      );
      
      if (badgeKey) {
        setCurrentAchievement({
          ...achievement,
          ...BADGES[badgeKey]
        });
        setShowPopup(true);
        
        // Remove this achievement from the queue
        setAchievements(prev => prev.slice(1));
      }
    }
  }, [achievements, showPopup]);
  
  // Close popup after a delay
  useEffect(() => {
    if (showPopup) {
      const timer = setTimeout(() => {
        handleClose();
      }, 5000); // Auto-close after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [showPopup]);
  
  // Handle closing the popup
  const handleClose = () => {
    setShowPopup(false);
    setCurrentAchievement(null);
    
    // If no more achievements, clear them from Firestore
    if (achievements.length === 0 && currentUser) {
      clearRecentAchievements(currentUser.uid);
    }
  };
  
  if (!showPopup || !currentAchievement) {
    return null;
  }
  
  // Map badge colors to Tailwind classes
  const getColorClass = () => {
    switch (currentAchievement.color) {
      case 'blue':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'green':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'red':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'amber':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300';
      case 'purple':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'pink':
        return 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300';
      case 'indigo':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      case 'teal':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300';
      case 'orange':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      case 'cyan':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FaTrophy className="text-yellow-500 mr-2" />
              New Achievement!
            </h3>
            <button 
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <FaTimes />
            </button>
          </div>
          
          <div className="flex items-center mb-3">
            <div className={`h-12 w-12 rounded-full ${getColorClass()} flex items-center justify-center mr-3`}>
              <FaTrophy />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {currentAchievement.name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {currentAchievement.description}
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleClose}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 text-sm font-medium"
            >
              View in Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
