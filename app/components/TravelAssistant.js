'use client';

import { useState, useEffect } from 'react';
import { FaGlobeAmericas, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import { getTravelInfo } from '../utils/geminiAI';

export default function TravelAssistant({ query }) {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTravelInfo = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await getTravelInfo(query);
        
        if (result.error) {
          setError(result.error);
        } else {
          setResponse(result.text);
        }
      } catch (err) {
        setError('Failed to get travel information. Please try again later.');
        console.error('Error in TravelAssistant:', err);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      fetchTravelInfo();
    }
  }, [query]);

  // Format the response text with proper line breaks and sections
  const formatResponseText = (text) => {
    if (!text) return '';

    // Split by line breaks or bullet points
    const sections = text.split(/\n+/);
    
    return sections.map((section, index) => {
      // Check if this is a heading (ends with a colon)
      const isHeading = section.trim().endsWith(':');
      
      // Check if this is a bullet point
      const isBullet = section.trim().startsWith('-') || section.trim().startsWith('•');
      
      if (isHeading) {
        return (
          <h3 key={index} className="font-semibold text-gray-900 dark:text-white mt-2 mb-1">
            {section}
          </h3>
        );
      } else if (isBullet) {
        return (
          <li key={index} className="ml-4 text-gray-700 dark:text-gray-300">
            {section.replace(/^[-•]\s*/, '')}
          </li>
        );
      } else {
        return (
          <p key={index} className="text-gray-700 dark:text-gray-300 mb-2">
            {section}
          </p>
        );
      }
    });
  };

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 my-2 flex items-center">
        <FaSpinner className="animate-spin text-blue-500 mr-2" />
        <span className="text-blue-700 dark:text-blue-400">Getting travel information about {query}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 my-2 flex items-center">
        <FaExclamationTriangle className="text-red-500 mr-2" />
        <span className="text-red-700 dark:text-red-400">{error}</span>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 my-2">
      <div className="flex items-center mb-3">
        <FaGlobeAmericas className="text-blue-600 dark:text-blue-400 mr-2" />
        <h2 className="text-lg font-semibold text-blue-700 dark:text-blue-300">
          Travel Information: {query}
        </h2>
      </div>
      <div className="text-sm">
        {formatResponseText(response)}
      </div>
    </div>
  );
}
