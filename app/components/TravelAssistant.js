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

    // Split the text into sections based on headings
    const mainSections = text.split(/(?=\n[^\n]+:)/g);

    return mainSections.map((section, sectionIndex) => {
      // Split each section into lines
      const lines = section.split(/\n+/);

      // Check if the first line is a heading
      const firstLine = lines[0].trim();
      const isHeading = firstLine.endsWith(':');

      // Process the section
      return (
        <div key={sectionIndex} className="mb-3">
          {isHeading && (
            <h3 className="font-semibold text-blue-800 dark:text-blue-300 text-sm uppercase tracking-wide border-b border-blue-200 dark:border-blue-800 pb-1 mb-2">
              {firstLine}
            </h3>
          )}

          <ul className="space-y-1">
            {lines.slice(isHeading ? 1 : 0).map((line, lineIndex) => {
              const trimmedLine = line.trim();

              // Skip empty lines
              if (!trimmedLine) return null;

              // Check if this is a bullet point
              const isBullet = trimmedLine.startsWith('-') || trimmedLine.startsWith('•');

              if (isBullet) {
                return (
                  <li key={lineIndex} className="flex items-start">
                    <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                    <span className="text-gray-800 dark:text-gray-200">
                      {trimmedLine.replace(/^[-•]\s*/, '')}
                    </span>
                  </li>
                );
              } else {
                return (
                  <p key={lineIndex} className="text-gray-800 dark:text-gray-200 mb-1">
                    {trimmedLine}
                  </p>
                );
              }
            })}
          </ul>
        </div>
      );
    });
  };

  if (loading) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 my-3 flex items-center shadow-sm">
        <div className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-full p-2 mr-3 shadow-sm">
          <FaSpinner className="animate-spin text-blue-600 dark:text-blue-400 h-5 w-5" />
        </div>
        <span className="text-blue-800 dark:text-blue-300 font-medium">Getting travel information about {query}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 my-3 flex items-center shadow-sm border border-red-200 dark:border-red-900/30">
        <div className="flex items-center justify-center bg-white dark:bg-gray-800 rounded-full p-2 mr-3 shadow-sm">
          <FaExclamationTriangle className="text-red-600 dark:text-red-400 h-5 w-5" />
        </div>
        <span className="text-red-800 dark:text-red-300 font-medium">{error}</span>
      </div>
    );
  }

  if (!response) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg p-4 my-3 shadow-md">
      <div className="flex items-center mb-3 border-b border-blue-200 dark:border-blue-800/50 pb-2">
        <div className="flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-full p-2 mr-3">
          <FaGlobeAmericas className="text-blue-600 dark:text-blue-400 h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-blue-800 dark:text-blue-300">
            Travel Information
          </h2>
          <p className="text-xs text-blue-600 dark:text-blue-400">{query}</p>
        </div>
      </div>
      <div className="text-sm bg-white/80 dark:bg-gray-800/50 rounded-md p-3 shadow-inner">
        {formatResponseText(response)}
      </div>
    </div>
  );
}
