'use client';

import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google Generative AI with the API key
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

/**
 * Get travel information from Gemini AI
 * @param {string} query - The travel query to send to Gemini
 * @returns {Promise<{text: string, error: string|null}>} - The response from Gemini
 */
export async function getTravelInfo(query) {
  try {
    // Make sure we have an API key
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return {
        text: null,
        error: 'Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.'
      };
    }

    // Create a more specific prompt for travel information with structured format
    const enhancedPrompt = `As a travel assistant, please provide helpful information about ${query}.

    Format your response with these exact section headings followed by a colon:

    DESTINATION OVERVIEW:
    [Brief 1-2 sentence introduction about the destination]

    POPULAR ATTRACTIONS:
    - [Attraction 1 with brief description]
    - [Attraction 2 with brief description]
    - [Attraction 3 with brief description]

    LOCAL CUISINE:
    - [Dish/Food 1 with brief description]
    - [Dish/Food 2 with brief description]
    - [Dish/Food 3 with brief description]

    BEST TIME TO VISIT:
    [Information about seasons, weather, and optimal visiting periods]

    TRAVEL TIPS:
    - [Practical tip 1]
    - [Practical tip 2]
    - [Practical tip 3]

    Keep each section concise and informative, focusing on practical advice for travelers.`;


    // Get the generative model - using the correct model name
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Generate content
    const result = await model.generateContent(enhancedPrompt);
    const response = result.response;
    const text = response.text();

    return {
      text,
      error: null
    };
  } catch (error) {
    console.error('Error getting travel information from Gemini:', error);
    return {
      text: null,
      error: `Failed to get travel information: ${error.message}`
    };
  }
}

/**
 * Extract travel query from a message
 * @param {string} message - The message to extract the query from
 * @returns {string|null} - The extracted query or null if no query found
 */
export function extractTravelQuery(message) {
  // Check if the message contains @traveler
  if (!message.includes('@traveler')) {
    return null;
  }

  // Extract the query after @traveler
  const match = message.match(/@traveler\s+(.*)/i);
  if (match && match[1]) {
    return match[1].trim();
  }

  return null;
}