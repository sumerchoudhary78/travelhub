'use client';

import { useState } from 'react';
import { 
  FaGlobe, FaMapMarkerAlt, FaMap, FaShare, 
  FaHeart, FaQuestionCircle, FaUserCheck,
  FaCommentDots, FaUsers, FaComments
} from 'react-icons/fa';

export default function BadgeCard({ badge, size = 'md' }) {
  const [showDetails, setShowDetails] = useState(false);
  
  // Map badge icons to React Icons
  const getIcon = () => {
    switch (badge.icon) {
      case 'globe':
        return <FaGlobe />;
      case 'map-pin':
        return <FaMapMarkerAlt />;
      case 'map':
        return <FaMap />;
      case 'share-2':
        return <FaShare />;
      case 'heart':
        return <FaHeart />;
      case 'help-circle':
        return <FaQuestionCircle />;
      case 'user-check':
        return <FaUserCheck />;
      case 'message-circle':
        return <FaCommentDots />;
      case 'users':
        return <FaUsers />;
      case 'message-square':
        return <FaComments />;
      default:
        return <FaMapMarkerAlt />;
    }
  };
  
  // Map badge colors to Tailwind classes
  const getColorClass = () => {
    switch (badge.color) {
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
  
  // Get size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-10 w-10 text-lg';
      case 'md':
        return 'h-14 w-14 text-xl';
      case 'lg':
        return 'h-20 w-20 text-2xl';
      default:
        return 'h-14 w-14 text-xl';
    }
  };
  
  // Format date
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  return (
    <div className="relative">
      <div 
        className={`${getSizeClasses()} rounded-full ${getColorClass()} flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity`}
        onClick={() => setShowDetails(!showDetails)}
        title={badge.name}
      >
        {getIcon()}
      </div>
      
      {/* Badge details tooltip */}
      {showDetails && (
        <div className="absolute z-10 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mt-2 left-1/2 transform -translate-x-1/2">
          <div className="flex items-center mb-2">
            <div className={`h-8 w-8 rounded-full ${getColorClass()} flex items-center justify-center mr-2`}>
              {getIcon()}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{badge.name}</h3>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{badge.description}</p>
          
          {badge.awardedAt && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Earned on {formatDate(badge.awardedAt)}
            </p>
          )}
          
          <div 
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(false);
            }}
          >
            &times;
          </div>
        </div>
      )}
    </div>
  );
}
