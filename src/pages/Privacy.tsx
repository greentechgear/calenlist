import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import SEO from '../components/SEO';

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="Privacy Policy" 
        description="Learn how we collect, use, and protect your personal information when using Calenlist."
      />

      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to home
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
          </div>
          <p className="mt-2 text-indigo-100">Last updated: February 1, 2024</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="prose prose-indigo max-w-none">
            <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p className="text-gray-600">
              This Privacy Policy explains how Calenlist ("we," "our," or "us") collects, uses, and protects your personal information when you use our calendar sharing platform.
            </p>

            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900">2. Information We Collect</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">2.1 Account Information</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Email address</li>
                      <li>Display name</li>
                      <li>Profile information (optional)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">2.2 Calendar Data</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Google Calendar URLs</li>
                      <li>Event details and descriptions</li>
                      <li>Physical addresses (when provided)</li>
                      <li>Calendar privacy settings</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">2.3 Usage Data</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Subscription information</li>
                      <li>Event feedback and ratings</li>
                      <li>Calendar viewing statistics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">3. How We Use Your Information</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">3.1 Essential Services</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Managing your account and calendars</li>
                      <li>Processing calendar subscriptions</li>
                      <li>Displaying event information</li>
                      <li>Handling event feedback</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">3.2 Communications</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Email verification</li>
                      <li>Service notifications</li>
                      <li>Important updates about your calendars</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">4. Information Sharing</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">4.1 Public Information</h3>
                    <p className="mt-2 text-gray-600">
                      For public calendars, the following information is visible to all users:
                    </p>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Calendar name and description</li>
                      <li>Event details and times</li>
                      <li>Creator's display name</li>
                      <li>Physical address (if set to public)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">4.2 Private Information</h3>
                    <p className="mt-2 text-gray-600">
                      For private calendars, information is only shared with:
                    </p>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Users you explicitly share with</li>
                      <li>Subscribers (for subscriber-only content)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">5. Data Security</h2>
                <p className="mt-2 text-gray-600">
                  We protect your data using:
                </p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>Secure HTTPS encryption</li>
                  <li>Database encryption at rest</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security audits</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">6. Third-Party Services</h2>
                <p className="mt-2 text-gray-600">
                  We integrate with the following services:
                </p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>Google Calendar (for calendar integration)</li>
                  <li>Supabase (for database and authentication)</li>
                  <li>Resend (for email notifications)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">7. Your Rights</h2>
                <p className="mt-2 text-gray-600">
                  You have the right to:
                </p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your account and data</li>
                  <li>Export your calendar data</li>
                  <li>Control your privacy settings</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">8. Contact Information</h2>
                <p className="mt-2 text-gray-600">
                  For privacy-related questions or concerns, please contact us at{' '}
                  <a href="mailto:privacy@calenlist.com" className="text-blue-600 hover:text-blue-700">
                    privacy@calenlist.com
                  </a>
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}