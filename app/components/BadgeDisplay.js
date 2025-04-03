'use client';

import { useState, useEffect } from 'react';
import BadgeCard from './BadgeCard';
import { getUserBadges } from '../utils/badgeUtils';
import { FaMedal, FaSpinner } from 'react-icons/fa';

export default function BadgeDisplay({ userId, limit = 0, showTitle = true }) {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  
  useEffect(() => {
    const fetchBadges = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      try {
        const userBadges = await getUserBadges(userId);
        setBadges(userBadges);
      } catch (error) {
        console.error('Error fetching badges:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBadges();
  }, [userId]);
  
  // Group badges by category
  const groupedBadges = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {});
  
  // Get display badges (limited or all)
  const getDisplayBadges = () => {
    if (!limit || showAll) return badges;
    return badges.slice(0, limit);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-4">
        <FaSpinner className="animate-spin text-indigo-600 text-xl" />
      </div>
    );
  }
  
  if (badges.length === 0) {
    return (
      <div className="text-center py-4">
        <FaMedal className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 dark:text-gray-400">No badges earned yet</p>
      </div>
    );
  }
  
  // If we're just showing a limited set without categories
  if (limit > 0 && !showAll) {
    return (
      <div>
        {showTitle && (
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
              <FaMedal className="mr-2 text-indigo-500" />
              Badges
            </h3>
            
            {badges.length > limit && (
              <button 
                onClick={() => setShowAll(true)}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
              >
                View All ({badges.length})
              </button>
            )}
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          {getDisplayBadges().map(badge => (
            <BadgeCard key={badge.id} badge={badge} size="md" />
          ))}
        </div>
      </div>
    );
  }
  
  // Show all badges grouped by category
  return (
    <div>
      {showTitle && (
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center">
            <FaMedal className="mr-2 text-indigo-500" />
            Badges ({badges.length})
          </h3>
          
          {showAll && limit > 0 && (
            <button 
              onClick={() => setShowAll(false)}
              className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400"
            >
              Show Less
            </button>
          )}
        </div>
      )}
      
      <div className="space-y-6">
        {Object.entries(groupedBadges).map(([category, categoryBadges]) => (
          <div key={category}>
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 capitalize mb-3">
              {category} Badges
            </h4>
            <div className="flex flex-wrap gap-3">
              {categoryBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} size="md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
