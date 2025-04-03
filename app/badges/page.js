'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/AuthContext';
import { FaMedal, FaSpinner, FaTrophy, FaArrowLeft } from 'react-icons/fa';
import BadgeDisplay from '../components/BadgeDisplay';
import { getUserStats, BADGES } from '../utils/badgeUtils';

export default function Badges() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        const userStats = await getUserStats(currentUser.uid);
        setStats(userStats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in to view badges</h1>
          <Link href="/auth/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors">
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link href="/profile" className="inline-flex items-center text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 mb-6">
        <FaArrowLeft className="mr-2" />
        Back to Profile
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center">
          <FaTrophy className="mr-3 text-yellow-500" />
          Badges & Achievements
        </h1>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <FaSpinner className="animate-spin text-indigo-600 text-2xl" />
          </div>
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Earn badges by participating in various activities on TravlrHub. Track your progress and unlock new achievements!
            </p>

            {/* User's badges */}
            <div className="mb-8">
              <BadgeDisplay userId={currentUser.uid} showTitle={false} />
            </div>

            {/* Stats and Progress */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
                <FaMedal className="mr-2 text-indigo-500" />
                Your Progress
              </h2>

              {stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(stats).map(([key, value]) => {
                    // Find badges related to this stat
                    const relatedBadges = Object.values(BADGES).filter(
                      badge => badge.statKey === key
                    );

                    if (relatedBadges.length === 0) return null;

                    // Sort badges by requirement
                    relatedBadges.sort((a, b) => a.requirement - b.requirement);

                    // Find the next badge to earn
                    const nextBadge = relatedBadges.find(badge => value < badge.requirement);

                    return (
                      <div key={key} className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white capitalize">
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </h3>
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {value}
                          </span>
                        </div>

                        {nextBadge ? (
                          <div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                              <div
                                className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
                                style={{ width: `${Math.min(100, (value / nextBadge.requirement) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {value}/{nextBadge.requirement} to earn "{nextBadge.name}"
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-green-600 dark:text-green-400">
                            All badges earned!
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  No stats available yet. Start using TravlrHub to earn badges!
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
