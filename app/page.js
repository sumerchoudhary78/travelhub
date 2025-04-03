import Image from "next/image";
import Link from "next/link";
import { FaMapMarkedAlt, FaUsers, FaComments, FaCompass } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Connect with Travelers Worldwide
              </h1>
              <p className="text-xl">
                Share experiences, discover new places, and meet fellow travelers on your journey.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/auth/signup" className="bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-md font-medium text-lg transition-colors">
                  Join Now
                </Link>
                <Link href="/explore" className="bg-transparent border-2 border-white hover:bg-white/10 px-6 py-3 rounded-md font-medium text-lg transition-colors">
                  Explore
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <Image
                src="/world-map.svg"
                alt="World Map"
                width={600}
                height={400}
                className="object-contain"
              />
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white dark:from-gray-900 to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Discover the TravlrHub Experience
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                <FaMapMarkedAlt className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Location Sharing</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Share your location with other travelers and see who's nearby for meetups and adventures.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                <FaCompass className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Explore Places</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Discover popular tourist spots, hidden gems, and get real-time information about each location.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                <FaComments className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Global & Private Chat</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connect with the global traveler community or chat privately with new friends you meet along the way.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-indigo-600 dark:text-indigo-400 mb-4">
                <FaUsers className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Tourist Count</h3>
              <p className="text-gray-600 dark:text-gray-300">
                See how many travelers are at specific locations in real-time to find popular spots or avoid crowds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-indigo-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300">
            Join thousands of travelers already connecting and sharing experiences on TravlrHub.
          </p>
          <Link href="/auth/signup" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-md font-medium text-lg transition-colors inline-block">
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">TravlrHub</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Connecting travelers worldwide through shared experiences and adventures.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/explore" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    Explore
                  </Link>
                </li>
                <li>
                  <Link href="/auth/login" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/auth/signup" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contact</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-2">
                Have questions or suggestions? Reach out to us at support@travlrhub.com
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} TravlrHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
