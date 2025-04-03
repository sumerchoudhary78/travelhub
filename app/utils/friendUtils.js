'use client';

import { 
  collection, 
  query as firestoreQuery, 
  where, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Check if a friendship exists between two users
export async function checkFriendshipStatus(userId, friendId) {
  if (!userId || !friendId) return null;
  
  try {
    // Check if user has sent a request to friend
    const sentQuery = firestoreQuery(
      collection(db, 'friendships'),
      where('userId', '==', userId),
      where('friendId', '==', friendId)
    );
    
    const sentSnapshot = await getDocs(sentQuery);
    
    if (!sentSnapshot.empty) {
      return {
        id: sentSnapshot.docs[0].id,
        ...sentSnapshot.docs[0].data(),
        direction: 'sent'
      };
    }
    
    // Check if friend has sent a request to user
    const receivedQuery = firestoreQuery(
      collection(db, 'friendships'),
      where('userId', '==', friendId),
      where('friendId', '==', userId)
    );
    
    const receivedSnapshot = await getDocs(receivedQuery);
    
    if (!receivedSnapshot.empty) {
      return {
        id: receivedSnapshot.docs[0].id,
        ...receivedSnapshot.docs[0].data(),
        direction: 'received'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error checking friendship status:', error);
    throw error;
  }
}

// Send a friend request
export async function sendFriendRequest(userId, friendId) {
  if (!userId || !friendId) throw new Error('User ID and friend ID are required');
  if (userId === friendId) throw new Error('Cannot send friend request to yourself');
  
  try {
    // Check if a friendship already exists
    const existingFriendship = await checkFriendshipStatus(userId, friendId);
    
    if (existingFriendship) {
      throw new Error('A friendship or request already exists between these users');
    }
    
    // Create a new friendship document
    const friendshipData = {
      userId,
      friendId,
      status: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'friendships'), friendshipData);
    
    return {
      id: docRef.id,
      ...friendshipData,
      direction: 'sent'
    };
  } catch (error) {
    console.error('Error sending friend request:', error);
    throw error;
  }
}

// Accept a friend request
export async function acceptFriendRequest(friendshipId) {
  if (!friendshipId) throw new Error('Friendship ID is required');
  
  try {
    const friendshipRef = doc(db, 'friendships', friendshipId);
    
    await updateDoc(friendshipRef, {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    throw error;
  }
}

// Reject a friend request
export async function rejectFriendRequest(friendshipId) {
  if (!friendshipId) throw new Error('Friendship ID is required');
  
  try {
    const friendshipRef = doc(db, 'friendships', friendshipId);
    
    await updateDoc(friendshipRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    throw error;
  }
}

// Remove a friendship
export async function removeFriendship(friendshipId) {
  if (!friendshipId) throw new Error('Friendship ID is required');
  
  try {
    await deleteDoc(doc(db, 'friendships', friendshipId));
    
    return true;
  } catch (error) {
    console.error('Error removing friendship:', error);
    throw error;
  }
}

// Get a user's friends (accepted friendships)
export async function getUserFriends(userId) {
  if (!userId) return [];
  
  try {
    // Get friendships where user is the requester
    const sentQuery = firestoreQuery(
      collection(db, 'friendships'),
      where('userId', '==', userId),
      where('status', '==', 'accepted')
    );
    
    const sentSnapshot = await getDocs(sentQuery);
    
    // Get friendships where user is the recipient
    const receivedQuery = firestoreQuery(
      collection(db, 'friendships'),
      where('friendId', '==', userId),
      where('status', '==', 'accepted')
    );
    
    const receivedSnapshot = await getDocs(receivedQuery);
    
    // Combine and format results
    const friends = [];
    
    // Process sent friendships
    for (const docSnap of sentSnapshot.docs) {
      const friendship = docSnap.data();
      
      // Get friend's user data
      const friendDoc = await getDoc(doc(db, 'users', friendship.friendId));
      
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        
        friends.push({
          id: friendship.friendId,
          displayName: friendData.displayName || 'Anonymous',
          photoURL: friendData.photoURL || null,
          lastActive: friendData.lastActive?.toDate ? friendData.lastActive.toDate() : null,
          friendshipId: docSnap.id,
          direction: 'sent'
        });
      }
    }
    
    // Process received friendships
    for (const docSnap of receivedSnapshot.docs) {
      const friendship = docSnap.data();
      
      // Get friend's user data
      const friendDoc = await getDoc(doc(db, 'users', friendship.userId));
      
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        
        friends.push({
          id: friendship.userId,
          displayName: friendData.displayName || 'Anonymous',
          photoURL: friendData.photoURL || null,
          lastActive: friendData.lastActive?.toDate ? friendData.lastActive.toDate() : null,
          friendshipId: docSnap.id,
          direction: 'received'
        });
      }
    }
    
    return friends;
  } catch (error) {
    console.error('Error getting user friends:', error);
    return [];
  }
}

// Get pending friend requests for a user
export async function getPendingFriendRequests(userId) {
  if (!userId) return [];
  
  try {
    // Get pending requests sent to the user
    const requestsQuery = firestoreQuery(
      collection(db, 'friendships'),
      where('friendId', '==', userId),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(requestsQuery);
    
    const requests = [];
    
    for (const docSnap of snapshot.docs) {
      const request = docSnap.data();
      
      // Get requester's user data
      const requesterDoc = await getDoc(doc(db, 'users', request.userId));
      
      if (requesterDoc.exists()) {
        const requesterData = requesterDoc.data();
        
        requests.push({
          id: request.userId,
          displayName: requesterData.displayName || 'Anonymous',
          photoURL: requesterData.photoURL || null,
          lastActive: requesterData.lastActive?.toDate ? requesterData.lastActive.toDate() : null,
          createdAt: request.createdAt?.toDate ? request.createdAt.toDate() : null,
          friendshipId: docSnap.id
        });
      }
    }
    
    return requests;
  } catch (error) {
    console.error('Error getting pending friend requests:', error);
    return [];
  }
}

// Search for users
export async function searchUsers(searchTerm, currentUserId, maxResults = 20) {
  if (!searchTerm || !currentUserId) return [];
  
  try {
    // Get all users (Firestore doesn't support text search natively)
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    
    for (const docSnap of snapshot.docs) {
      // Skip current user
      if (docSnap.id === currentUserId) continue;
      
      const userData = docSnap.data();
      const displayName = userData.displayName || '';
      
      // Simple client-side filtering
      if (displayName.toLowerCase().includes(searchTerm.toLowerCase())) {
        users.push({
          id: docSnap.id,
          displayName: displayName,
          photoURL: userData.photoURL || null,
          lastActive: userData.lastActive?.toDate ? userData.lastActive.toDate() : null
        });
      }
    }
    
    // Sort by display name and limit results
    return users
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .slice(0, maxResults);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// Format last active time
export function formatLastActive(lastActive) {
  if (!lastActive) return 'Unknown';
  
  const now = new Date();
  const diffMs = now - lastActive;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}