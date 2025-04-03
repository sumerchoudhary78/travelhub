'use client';

import Link from "next/link";
import { FaMapMarkedAlt, FaUsers, FaComments, FaCompass, FaGlobeAmericas, FaRoute, FaUserFriends } from "react-icons/fa";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import AnimatedElement from "./components/AnimatedElement";

// Dynamically import the Globe component
const DynamicGlobe = dynamic(() => import("./components/DynamicGlobe"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-indigo-100/30 rounded-lg">
      <FaGlobeAmericas className="text-indigo-500/50 text-5xl animate-pulse" />
    </div>
  )
});



// Feature card component with animation
function FeatureCard({ icon, title, description, delay }) {
  return (
    <AnimatedElement animation="slideUp" delay={delay} className="h-full">
      <motion.div
        className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md card-hover h-full border border-gray-200 dark:border-gray-700"
        whileHover={{ y: -5 }}
      >
        <motion.div
          className="text-primary dark:text-primary-light mb-4 bg-primary-light/10 dark:bg-primary-light/5 p-3 rounded-full inline-block"
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </motion.div>
        <h3 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">{title}</h3>
        <p className="text-gray-700 dark:text-gray-300">{description}</p>
      </motion.div>
    </AnimatedElement>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white animate-float" style={{ animationDelay: '0s' }}></div>
          <div className="absolute top-40 right-20 w-32 h-32 rounded-full bg-white animate-float" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-16 h-16 rounded-full bg-white animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/3 right-1/3 w-24 h-24 rounded-full bg-white animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <AnimatedElement animation="slideRight">
              <div className="space-y-6">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                  Connect with Travelers Worldwide
                </h1>
                <p className="text-xl">
                  Share experiences, discover new places, and meet fellow travelers on your journey.
                </p>
                <div className="flex flex-wrap gap-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/auth/signup" className="btn btn-primary px-6 py-3 text-lg btn-hover-effect">
                      Join Now
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link href="/explore" className="btn bg-transparent border-2 border-white hover:bg-white/10 text-white px-6 py-3 text-lg btn-hover-effect">
                      Explore
                    </Link>
                  </motion.div>
                </div>
              </div>
            </AnimatedElement>

            <AnimatedElement animation="fadeIn" className="hidden md:block h-[400px]">
              <DynamicGlobe />
            </AnimatedElement>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <AnimatedElement>
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent inline-block">
              Discover the TravlrHub Experience
            </h2>
          </AnimatedElement>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard
              icon={<FaMapMarkedAlt className="h-10 w-10" />}
              title="Location Sharing"
              description="Share your location with other travelers and see who's nearby for meetups and adventures."
              delay={0.1}
            />

            <FeatureCard
              icon={<FaCompass className="h-10 w-10" />}
              title="Explore Places"
              description="Discover popular tourist spots, hidden gems, and get real-time information about each location."
              delay={0.2}
            />

            <FeatureCard
              icon={<FaComments className="h-10 w-10" />}
              title="Global & Private Chat"
              description="Connect with the global traveler community or chat privately with new friends you meet along the way."
              delay={0.3}
            />

            <FeatureCard
              icon={<FaUsers className="h-10 w-10" />}
              title="Tourist Count"
              description="See how many travelers are at specific locations in real-time to find popular spots or avoid crowds."
              delay={0.4}
            />
          </div>
        </div>
      </section>

      {/* Additional Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto">
          <AnimatedElement>
            <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent inline-block">
              More Amazing Features
            </h2>
          </AnimatedElement>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<FaRoute className="h-10 w-10" />}
              title="Travel Itineraries"
              description="Create and share detailed travel plans with timelines and locations. Get inspired by other travelers' itineraries."
              delay={0.1}
            />

            <FeatureCard
              icon={<FaUserFriends className="h-10 w-10" />}
              title="Friend System"
              description="Add and follow other travelers to stay updated on their activities and adventures around the world."
              delay={0.2}
            />

            <FeatureCard
              icon={<FaGlobeAmericas className="h-10 w-10" />}
              title="AI Travel Assistant"
              description="Get instant travel information and recommendations by typing '@traveler' in the chat using our Gemini AI integration."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-10 right-10 w-20 h-20 rounded-full bg-white animate-float" style={{ animationDelay: '0.2s' }}></div>
          <div className="absolute bottom-20 left-20 w-32 h-32 rounded-full bg-white animate-float" style={{ animationDelay: '0.7s' }}></div>
          <div className="absolute top-1/3 left-1/4 w-16 h-16 rounded-full bg-white animate-float" style={{ animationDelay: '1.2s' }}></div>
        </div>

        <AnimatedElement className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8">
            Join thousands of travelers already connecting and sharing experiences on TravlrHub.
          </p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Link href="/auth/signup" className="btn btn-primary px-8 py-4 text-lg btn-hover-effect inline-block animate-glow">
              Create Your Account
            </Link>
          </motion.div>
        </AnimatedElement>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <AnimatedElement animation="fadeIn" delay={0.1}>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
                  <FaGlobeAmericas className="mr-2 text-indigo-600 dark:text-indigo-400" /> TravlrHub
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Connecting travelers worldwide through shared experiences and adventures.
                </p>
              </div>
            </AnimatedElement>

            <AnimatedElement animation="fadeIn" delay={0.2}>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/explore" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Explore
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link href="/auth/signup" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Sign Up
                    </Link>
                  </li>
                </ul>
              </div>
            </AnimatedElement>

            <AnimatedElement animation="fadeIn" delay={0.3}>
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contact</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Have questions or suggestions? Reach out to us at support@travlrhub.com
                </p>
              </div>
            </AnimatedElement>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} TravlrHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
