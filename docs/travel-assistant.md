# Travel Assistant Feature

The Travel Assistant is an AI-powered feature that provides travel information when users type `@traveler` followed by a location or travel-related query in the chat.

## How to Use

1. In any chat (global or private), type `@traveler` followed by your travel query.
   
   Examples:
   - `@traveler Paris, France`
   - `@traveler best beaches in Thailand`
   - `@traveler hiking in the Rocky Mountains`

2. Send the message, and the Travel Assistant will automatically respond with relevant travel information about your query.

3. The response will include details such as:
   - Popular attractions
   - Local cuisine
   - Best time to visit
   - Travel tips

## Setup Instructions

To use this feature, you need to set up a Gemini AI API key:

1. Visit [Google AI Studio](https://ai.google.dev/) and create an account if you don't have one.
2. Create a new API key in the Google AI Studio console.
3. Add the API key to your `.env.local` file:
   ```
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```
4. Restart your development server.

## Technical Implementation

The Travel Assistant feature uses:

- Google's Gemini AI API for generating travel information
- React components for displaying the information in the chat
- Firebase for storing and retrieving chat messages

The main components involved are:

- `TravelAssistant.js`: Displays the AI-generated travel information
- `geminiAI.js`: Handles the API calls to Gemini AI
- `GlobalChat.js` and `PrivateChat.js`: Detect when a user types `@traveler` and trigger the AI response

## Limitations

- The Travel Assistant requires an internet connection to work.
- The quality of information depends on the Gemini AI model's knowledge.
- There may be rate limits on the Gemini AI API depending on your usage tier.
- The feature requires a valid Gemini AI API key to function.
