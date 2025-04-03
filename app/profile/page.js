// --- START OF FILE page.js --- (Profile Page)

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { doc, getDoc } from 'firebase/firestore'; // Removed updateDoc, handled by AuthContext
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { FaUser, FaMapMarkerAlt, FaEdit, FaCheck, FaTimes, FaSpinner, FaUserFriends } from 'react-icons/fa';
import { useUserLocation } from '../utils/locationUtils';
import { getUserFriends } from '../utils/friendUtils';

export default function Profile() {
  const { currentUser, updateUserProfile } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // General page loading
  const [updating, setUpdating] = useState(false); // Specific state for update operation
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  // Editable fields state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [shareLocation, setShareLocation] = useState(false); // Local state for editing
  const [profileImage, setProfileImage] = useState(null); // File object
  const [imagePreview, setImagePreview] = useState('');

  // Use user location hook - pass the *current* state of the checkbox
  // This allows the hook to potentially update Firestore if the user checks the box while editing
  const { location, error: locationError, loading: locationLoading } = useUserLocation(shareLocation);

  // Redirect if not logged in
  useEffect(() => {
    // Check loading state to prevent redirect before auth state is resolved
    if (!loading && !currentUser) {
      router.push('/auth/login');
    }
  }, [currentUser, loading, router]);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) {
          setLoading(false); // Ensure loading stops if no user
          return;
      }

      // Also fetch friends data
      setLoadingFriends(true);
      try {
        const friendsData = await getUserFriends(currentUser.uid);
        setFriends(friendsData);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setLoadingFriends(false);
      }

      setLoading(true); // Start loading profile data
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));

        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          // Set initial state for editing fields based on fetched data
          setDisplayName(data.displayName || currentUser.displayName || ''); // Fallback to auth display name
          setBio(data.bio || '');
          setShareLocation(data.shareLocation || false); // Initialize checkbox state
          setImagePreview(data.photoURL || currentUser.photoURL || ''); // Show current photo initially
        } else {
            setError('Profile data not found. Please try updating.');
            // Initialize with auth data if Firestore doc is missing
            setDisplayName(currentUser.displayName || '');
            setBio('');
            setShareLocation(false);
            setImagePreview(currentUser.photoURL || '');
        }
      } catch (err) {
        setError('Failed to load profile data.');
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
    // Dependency: currentUser.uid ensures refetch if user changes (though unlikely in profile page)
  }, [currentUser]); // Removed redundant currentUser?.uid

  // Handle image selection
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]; // Use optional chaining
    if (file) {
      // Basic validation (optional: size, type)
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
          setError('Image file size should be less than 5MB.');
          return;
      }
      setProfileImage(file); // Store the File object
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            setImagePreview(reader.result); // Show Data URL preview
        }
      };
      reader.readAsDataURL(file);
      setError(''); // Clear previous errors
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return; // Should not happen if logged in

    setUpdating(true); // Indicate update in progress
    setError(''); // Clear previous errors

    try {
      let updatedPhotoURL = userData?.photoURL || currentUser.photoURL; // Start with existing URL

      // 1. Upload new profile image if selected
      if (profileImage) {
        const storageRef = ref(storage, `profile_images/${currentUser.uid}/${profileImage.name}`); // Include filename
        // console.log("Uploading image to:", storageRef.fullPath);
        const snapshot = await uploadBytes(storageRef, profileImage);
        updatedPhotoURL = await getDownloadURL(snapshot.ref);
        // console.log("Image uploaded, URL:", updatedPhotoURL);
      }

      // 2. Prepare data object for update
      const updateData = {
        displayName: displayName.trim(),
        photoURL: updatedPhotoURL, // Use the potentially updated URL
        bio: bio.trim(),
        shareLocation: shareLocation, // This is the crucial flag
      };
      // console.log("Updating profile with data:", updateData);

      // 3. Call updateUserProfile from AuthContext
      await updateUserProfile(updateData);

      // 4. Update local state immediately for responsiveness
      setUserData(prevData => ({
        ...prevData, // Keep other potential fields
        ...updateData // Overwrite with updated fields
      }));
      // Clear the temporary file state after successful upload
      setProfileImage(null);
      // Keep imagePreview as the new URL (already set if uploaded, or remains the same if not)
      setImagePreview(updatedPhotoURL || '');


      setIsEditing(false); // Exit editing mode
      // console.log("Profile updated successfully.");

    } catch (err) {
      setError('Failed to update profile. Please try again.');
      console.error("Error updating profile:", err);
      // Optionally: Revert local state changes on error? Or let user retry?
    } finally {
      setUpdating(false); // Finish update indicator
    }
  };

  // Cancel editing
  const handleCancel = () => {
    if (!userData && !currentUser) return; // Handle edge case where data never loaded

    // Reset fields to original userData values (or auth fallbacks)
    setDisplayName(userData?.displayName || currentUser?.displayName || '');
    setBio(userData?.bio || '');
    setShareLocation(userData?.shareLocation || false);
    setProfileImage(null); // Clear selected file
    setImagePreview(userData?.photoURL || currentUser?.photoURL || ''); // Reset preview
    setError(''); // Clear errors
    setIsEditing(false);
  };

  // Initial loading state for the whole page
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <FaSpinner className="animate-spin text-indigo-500 h-12 w-12" />
      </div>
    );
  }

   // Handle case where user is somehow not available after loading
  if (!currentUser) {
     // Redirect handled by useEffect, show message briefly
     return <div className="text-center py-10">Please log in to view your profile.</div>;
  }


  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      {locationError && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative mb-6" role="alert">
          <span className="block sm:inline">Location Error: {locationError}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className={`bg-gradient-to-r from-indigo-500 to-purple-600 h-32 relative ${updating ? 'opacity-75' : ''}`}>
          {updating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                  <FaSpinner className="animate-spin text-white text-2xl"/>
              </div>
          )}
          {isEditing ? (
            <div className="absolute top-4 right-4 flex space-x-2 z-20">
              <button
                type="submit" // Connect to the form's onSubmit
                form="profileForm" // Link to the form ID
                disabled={updating}
                className={`p-2 rounded-full text-white transition-colors ${updating ? 'bg-gray-500 cursor-not-allowed' : 'bg-green-500 hover:bg-green-600'}`}
                aria-label="Save changes"
              >
                <FaCheck />
              </button>
              <button
                type="button" // Important: prevent form submission
                onClick={handleCancel}
                disabled={updating}
                className={`p-2 rounded-full text-white transition-colors ${updating ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-500 hover:bg-red-600'}`}
                aria-label="Cancel editing"
              >
                <FaTimes />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              disabled={updating} // Disable edit button during update
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white p-2 rounded-full transition-colors z-20"
              aria-label="Edit profile"
            >
              <FaEdit />
            </button>
          )}
        </div>

        {/* Profile Image */}
        <div className="relative -mt-16 px-6">
          {/* Image container */}
          <div className="relative h-32 w-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
             {/* Display logic */}
             {imagePreview ? (
               <Image
                 src={imagePreview}
                 alt={displayName || 'Profile'}
                 fill // Use fill for responsive covering
                 sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes, adjust as needed
                 className="object-cover" // Ensure image covers the area
                 priority={true} // Prioritize loading profile image
               />
             ) : (
               <FaUser className="h-16 w-16 text-gray-400 dark:text-gray-500" />
             )}

            {/* Edit overlay */}
            {isEditing && (
              <label htmlFor="profileImageInput" className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer text-white text-sm font-medium opacity-0 hover:opacity-100 transition-opacity">
                Change
                <input
                  id="profileImageInput"
                  type="file"
                  accept="image/png, image/jpeg, image/gif" // Specify accepted types
                  className="hidden"
                  onChange={handleImageChange}
                  disabled={updating}
                />
              </label>
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 py-4">
          {isEditing ? (
            // ** Added form tag with ID **
            <form id="profileForm" onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="displayName">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  maxLength={50} // Add reasonable limits
                  disabled={updating}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="bio">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="shadow-sm appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent h-24" // Adjusted height
                  placeholder="Tell fellow travelers about yourself..."
                  maxLength={300} // Add reasonable limits
                  disabled={updating}
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shareLocation}
                    onChange={(e) => setShareLocation(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-indigo-600 rounded border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
                    disabled={updating}
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Share my location with nearby travelers</span>
                </label>
                 {shareLocation && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Your location will be updated periodically and visible on the Explore map while enabled.
                    </p>
                 )}
                 {!shareLocation && (
                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                         Your location is not currently shared.
                     </p>
                 )}
              </div>
            </form>
          ) : (
            // Display mode
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {userData?.displayName || 'Traveler'}
              </h1>
              {currentUser.email && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{currentUser.email}</p>
              )}

              {userData?.bio && (
                <div className="mt-4">
                  <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">About Me</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 whitespace-pre-wrap">{userData.bio}</p> {/* Preserve line breaks */}
                </div>
              )}

              <div className="mt-4 flex items-center">
                <FaMapMarkerAlt className={`mr-2 ${userData?.shareLocation ? 'text-green-500' : 'text-red-500'}`} />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Location sharing: <span className="font-medium">{userData?.shareLocation ? 'Enabled' : 'Disabled'}</span>
                </span>
              </div>

              {/* Show current location if sharing is enabled AND location is available */}
              {userData?.shareLocation && location && !locationLoading && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Current coordinates: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                </div>
              )}
               {userData?.shareLocation && locationLoading && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 flex items-center">
                  <FaSpinner className="animate-spin mr-1"/> Acquiring location...
                </div>
              )}
               {userData?.shareLocation && !location && !locationLoading && locationError && (
                 <div className="mt-1 text-xs text-red-500 dark:text-red-400">
                   Could not get location. {locationError}
                 </div>
               )}
            </>
          )}
        </div>

        {/* Profile Stats */}
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">Friends</h2>
            <Link href="/friends" className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
              View All
            </Link>
          </div>

          {loadingFriends ? (
            <div className="flex justify-center items-center py-4">
              <FaSpinner className="animate-spin text-indigo-600 text-xl" />
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-4">
              <FaUserFriends className="mx-auto h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No friends yet</p>
              <Link href="/friends" className="mt-2 inline-block text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400">
                Find travelers to follow
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {friends.slice(0, 3).map(friend => (
                <Link key={friend.id} href={`/chat/${friend.id}`} className="flex flex-col items-center p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors">
                  <div className="w-12 h-12 mb-2">
                    {friend.photoURL ? (
                      <Image
                        src={friend.photoURL}
                        alt={friend.displayName}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                        <FaUser className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-900 dark:text-white truncate w-full text-center">
                    {friend.displayName}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{friends.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
            </div>
            <div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">0</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Itineraries</div>
            </div>
            <div>
              <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">0</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Visited</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END OF FILE page.js --- (Profile Page)