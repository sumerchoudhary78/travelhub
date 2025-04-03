# TravlrHub

TravlrHub is a full-stack web application for travelers to connect, share experiences, and explore tourism spots in real-time.

## Features

- **User Authentication**: Sign up/login with email/password or Google
- **Location Sharing**: Share your real-time location with other travelers
- **Tourism Place Exploration**: Discover nearby tourist attractions with details and reviews
- **Global and Private Chat**: Connect with travelers worldwide or chat privately
- **Tourist Count at Locations**: See how many travelers are at specific locations
- **Responsive Design**: Fully responsive UI for all devices

## Tech Stack

- **Frontend**: Next.js 15.2.4 with App Router
- **Backend**: Firebase (Authentication, Firestore, Storage, Cloud Functions)
- **Maps**: Google Maps API for location sharing and tourism data
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Firebase account
- Google Maps API key

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/travlrhub.git
cd travlrhub
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id

# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

4. Run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Firebase Setup

1. Create a new Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password and Google providers)
3. Create a Firestore database
4. Set up Storage for user uploads
5. Get your Firebase configuration from Project Settings > General > Your apps

## Google Maps API Setup

1. Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
3. Create an API key with appropriate restrictions

## Project Structure

- `app/` - Next.js App Router pages and components
  - `components/` - Reusable UI components
  - `lib/` - Firebase and authentication utilities
  - `utils/` - Helper functions and custom hooks
- `public/` - Static assets

## Deployment

This project can be deployed to Vercel with minimal configuration:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# travelhub
