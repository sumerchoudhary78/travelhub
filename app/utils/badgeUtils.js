'use client';

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Badge definitions
export const BADGES = {
  // Communication Badges
  CHAT_MASTER: {
    id: 'chat_master',
    name: 'Chat Master',
    description: 'Send 100+ messages in chats',
    category: 'communication',
    icon: 'message-circle',
    color: 'blue',
    requirement: 100,
    statKey: 'messagesSent'
  },
  SOCIAL_BUTTERFLY: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Chat with 10+ different users',
    category: 'communication',
    icon: 'users',
    color: 'purple',
    requirement: 10,
    statKey: 'uniqueChats'
  },
  CONVERSATION_STARTER: {
    id: 'conversation_starter',
    name: 'Conversation Starter',
    description: 'Initiate 5+ chats with other travelers',
    category: 'communication',
    icon: 'message-square',
    color: 'teal',
    requirement: 5,
    statKey: 'chatsInitiated'
  },

  // Travel Badges
  GLOBETROTTER: {
    id: 'globetrotter',
    name: 'Globetrotter',
    description: 'Visit 10+ countries (via location sharing)',
    category: 'travel',
    icon: 'globe',
    color: 'green',
    requirement: 10,
    statKey: 'countriesVisited'
  },
  EXPLORER: {
    id: 'explorer',
    name: 'Explorer',
    description: 'Create 5+ travel itineraries',
    category: 'travel',
    icon: 'map',
    color: 'amber',
    requirement: 5,
    statKey: 'itinerariesCreated'
  },
  ADVENTURE_PLANNER: {
    id: 'adventure_planner',
    name: 'Adventure Planner',
    description: 'Add 20+ locations to your itineraries',
    category: 'travel',
    icon: 'map-pin',
    color: 'red',
    requirement: 20,
    statKey: 'locationsAdded'
  },
  TRAVEL_GURU: {
    id: 'travel_guru',
    name: 'Travel Guru',
    description: 'Share 5+ public itineraries with the community',
    category: 'travel',
    icon: 'share-2',
    color: 'orange',
    requirement: 5,
    statKey: 'publicItineraries'
  },

  // Engagement Badges
  COMMUNITY_MEMBER: {
    id: 'community_member',
    name: 'Community Member',
    description: 'Follow 5+ other travelers',
    category: 'engagement',
    icon: 'heart',
    color: 'pink',
    requirement: 5,
    statKey: 'followingCount'
  },
  TRAVEL_ASSISTANT: {
    id: 'travel_assistant',
    name: 'Travel Assistant',
    description: 'Use the @traveler feature 10+ times',
    category: 'engagement',
    icon: 'help-circle',
    color: 'indigo',
    requirement: 10,
    statKey: 'travelerQueries'
  },
  PROFILE_PERFECTIONIST: {
    id: 'profile_perfectionist',
    name: 'Profile Perfectionist',
    description: 'Complete all profile fields',
    category: 'engagement',
    icon: 'user-check',
    color: 'cyan',
    requirement: 1,
    statKey: 'profileComplete'
  }
};

// Initialize user stats in Firestore
export async function initializeUserStats(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && !userDoc.data().stats) {
      // Initialize stats object if it doesn't exist
      await updateDoc(userRef, {
        stats: {
          messagesSent: 0,
          uniqueChats: 0,
          chatsInitiated: 0,
          countriesVisited: 0,
          itinerariesCreated: 0,
          locationsAdded: 0,
          publicItineraries: 0,
          followingCount: 0,
          travelerQueries: 0,
          profileComplete: 0
        }
      });
    }
  } catch (error) {
    console.error('Error initializing user stats:', error);
  }
}

// Get user stats
export async function getUserStats(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists() && userDoc.data().stats) {
      return userDoc.data().stats;
    }
    
    // Initialize stats if they don't exist
    await initializeUserStats(userId);
    return {
      messagesSent: 0,
      uniqueChats: 0,
      chatsInitiated: 0,
      countriesVisited: 0,
      itinerariesCreated: 0,
      locationsAdded: 0,
      publicItineraries: 0,
      followingCount: 0,
      travelerQueries: 0,
      profileComplete: 0
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return null;
  }
}

// Update a specific user stat
export async function updateUserStat(userId, statKey, value = 1, isIncrement = true) {
  try {
    // Make sure stats are initialized
    await initializeUserStats(userId);
    
    const userRef = doc(db, 'users', userId);
    
    if (isIncrement) {
      // Increment the stat by the specified value
      await updateDoc(userRef, {
        [`stats.${statKey}`]: increment(value)
      });
    } else {
      // Set the stat to the specified value
      await updateDoc(userRef, {
        [`stats.${statKey}`]: value
      });
    }
    
    // Check if any badges should be awarded
    await checkAndAwardBadges(userId);
    
    return true;
  } catch (error) {
    console.error(`Error updating user stat ${statKey}:`, error);
    return false;
  }
}

// Get user badges
export async function getUserBadges(userId) {
  try {
    const userBadgesRef = collection(db, 'users', userId, 'userBadges');
    const snapshot = await getDocs(userBadgesRef);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting user badges:', error);
    return [];
  }
}

// Award a badge to a user
export async function awardBadge(userId, badgeId) {
  try {
    const badge = BADGES[badgeId];
    if (!badge) {
      console.error(`Badge ${badgeId} not found`);
      return false;
    }
    
    const badgeRef = doc(db, 'users', userId, 'userBadges', badge.id);
    const badgeDoc = await getDoc(badgeRef);
    
    if (badgeDoc.exists()) {
      // Badge already awarded
      return false;
    }
    
    // Award the badge
    await setDoc(badgeRef, {
      ...badge,
      awardedAt: serverTimestamp()
    });
    
    // Add to recent achievements array in user document
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      recentAchievements: arrayUnion({
        badgeId: badge.id,
        badgeName: badge.name,
        awardedAt: new Date() // Use client date for immediate display
      })
    });
    
    return true;
  } catch (error) {
    console.error(`Error awarding badge ${badgeId}:`, error);
    return false;
  }
}

// Check if user qualifies for any badges and award them
export async function checkAndAwardBadges(userId) {
  try {
    const stats = await getUserStats(userId);
    if (!stats) return false;
    
    const userBadges = await getUserBadges(userId);
    const earnedBadgeIds = userBadges.map(badge => badge.id);
    
    let badgesAwarded = false;
    
    // Check each badge
    for (const badgeKey in BADGES) {
      const badge = BADGES[badgeKey];
      
      // Skip if already earned
      if (earnedBadgeIds.includes(badge.id)) continue;
      
      // Check if requirement is met
      if (stats[badge.statKey] >= badge.requirement) {
        const awarded = await awardBadge(userId, badgeKey);
        if (awarded) {
          badgesAwarded = true;
        }
      }
    }
    
    return badgesAwarded;
  } catch (error) {
    console.error('Error checking and awarding badges:', error);
    return false;
  }
}

// Clear recent achievements notification
export async function clearRecentAchievements(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      recentAchievements: []
    });
    return true;
  } catch (error) {
    console.error('Error clearing recent achievements:', error);
    return false;
  }
}

// Helper function to check if profile is complete
export function isProfileComplete(userData) {
  return !!(
    userData.displayName &&
    userData.photoURL &&
    userData.bio &&
    userData.bio.length > 10
  );
}

// Update stats based on specific actions
export async function trackMessageSent(userId) {
  return updateUserStat(userId, 'messagesSent');
}

export async function trackUniqueChat(userId, otherUserId) {
  // Check if this is a new unique chat partner
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const chatPartners = userDoc.data().chatPartners || [];
      
      if (!chatPartners.includes(otherUserId)) {
        // Add to chat partners array
        await updateDoc(userRef, {
          chatPartners: arrayUnion(otherUserId)
        });
        
        // Increment unique chats count
        return updateUserStat(userId, 'uniqueChats');
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error tracking unique chat:', error);
    return false;
  }
}

export async function trackChatInitiated(userId) {
  return updateUserStat(userId, 'chatsInitiated');
}

export async function trackItineraryCreated(userId) {
  return updateUserStat(userId, 'itinerariesCreated');
}

export async function trackLocationAdded(userId) {
  return updateUserStat(userId, 'locationsAdded');
}

export async function trackPublicItinerary(userId) {
  return updateUserStat(userId, 'publicItineraries');
}

export async function trackFollowing(userId) {
  return updateUserStat(userId, 'followingCount');
}

export async function trackTravelerQuery(userId) {
  return updateUserStat(userId, 'travelerQueries');
}

export async function updateProfileCompletion(userId, userData) {
  if (isProfileComplete(userData)) {
    return updateUserStat(userId, 'profileComplete', 1, false);
  }
  return false;
}
