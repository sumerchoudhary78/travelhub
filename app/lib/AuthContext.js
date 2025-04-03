// --- START OF FILE AuthContext.js ---

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile // Firebase Auth profile update
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, GeoPoint } from 'firebase/firestore'; // Import GeoPoint if used here
import { auth, db } from './firebase';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Create user document helper
  const createUserDocument = async (user, additionalData = {}) => {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp(),
      bio: '',
      location: null, // Initialize location as null
      shareLocation: false, // Default sharing to false
      ...additionalData, // Allow overriding defaults during creation
    };
    await setDoc(userRef, userData);
    return userData; // Return the created data
  };

  // Sign up with email and password
  async function signup(email, password, displayName) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(user, { displayName: displayName.trim() });

      // Create Firestore document
      await createUserDocument(user, { displayName: displayName.trim() });

      // Return the user object from auth, augmented if needed
      return user;
    } catch (error) {
      console.error("Signup Error:", error);
      throw error; // Rethrow for handling in UI
    }
  }

  // Sign in with email and password
  async function login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Update lastActive on login
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { lastActive: serverTimestamp() });
      return user;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  }

  // Sign in with Google
  async function loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create document if first Google sign-in
        await createUserDocument(user);
      } else {
        // Update last active and potentially photoURL/displayName if changed in Google
        await updateDoc(userRef, {
          lastActive: serverTimestamp(),
          // Optionally update from Google profile on each login:
          // displayName: user.displayName || userDoc.data().displayName || '',
          // photoURL: user.photoURL || userDoc.data().photoURL || '',
        });
      }
      return user;
    } catch (error) {
      console.error("Google Login Error:", error);
      throw error;
    }
  }

  // Sign out
  function logout() {
    return signOut(auth);
  }

  // Update user profile (Firebase Auth and Firestore)
  async function updateUserProfile(data) {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated.");

    try {
      const authUpdateData = {};
      if (data.displayName !== undefined) {
        authUpdateData.displayName = data.displayName;
      }
      if (data.photoURL !== undefined) {
        authUpdateData.photoURL = data.photoURL;
      }

      // Update Firebase Auth profile if there's data for it
      if (Object.keys(authUpdateData).length > 0) {
        await updateProfile(user, authUpdateData);
        // console.log("Firebase Auth profile updated:", authUpdateData);
      }

      // Prepare data for Firestore update (exclude undefined values if necessary)
      const firestoreUpdateData = { ...data };
      // Ensure lastActive is always updated
      firestoreUpdateData.lastActive = serverTimestamp();

      // Location should be handled by useUserLocation, not directly here
      // Remove location if it accidentally got passed in
      // delete firestoreUpdateData.location;
       // If shareLocation is explicitly set to false, consider setting location to null
      if (data.shareLocation === false) {
          firestoreUpdateData.location = null;
          firestoreUpdateData.lastLocationUpdate = null; // Also clear timestamp
      }


      // Update user document in Firestore using merge
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, firestoreUpdateData, { merge: true });
      // console.log("Firestore user document updated:", firestoreUpdateData);

      // Refetch the user object to potentially get updated info?
      // Or rely on onAuthStateChanged to update currentUser state?
      // Let's rely on onAuthStateChanged and manual state update in Profile page.
      return { ...user, ...authUpdateData }; // Return potentially updated user object

    } catch (error) {
      console.error("Update Profile Error:", error);
      throw error;
    }
  }

  // Effect to handle auth state changes and update lastActive
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user); // Update state

      if (user) {
        // Update last active timestamp in Firestore when auth state confirmed
        try {
          const userRef = doc(db, 'users', user.uid);
          // Check if doc exists before updating, or use set with merge
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
              await updateDoc(userRef, { lastActive: serverTimestamp() });
          } else {
              // This case might happen if Firestore doc creation failed previously
              console.warn("User document missing for logged-in user:", user.uid);
              // Attempt to create it now
              await createUserDocument(user);
          }
        } catch (error) {
            console.error("Error updating lastActive on auth change:", error);
        }
      }
      setLoading(false); // Auth state resolved, stop loading
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Run only once on mount

  const value = {
    currentUser,
    loading, // Expose loading state
    signup,
    login,
    loginWithGoogle,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only when auth state is resolved */}
      {children}
      {/* Or show loading indicator: */}
      {/* {!loading ? children : <GlobalLoadingSpinner />} */}
    </AuthContext.Provider>
  );
}
// --- END OF FILE AuthContext.js ---