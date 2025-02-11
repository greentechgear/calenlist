import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale } from 'lucide-react';
import SEO from '../components/SEO';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SEO 
        title="Terms of Service" 
        description="Read our terms of service and learn about your rights and responsibilities when using Calenlist."
      />

      <Link
        to="/"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to home
      </Link>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center space-x-3">
            <Scale className="w-8 h-8 text-white" />
            <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
          </div>
          <p className="mt-2 text-blue-100">Last updated: February 1, 2024</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="prose prose-blue max-w-none">
            <h2 className="text-xl font-semibold text-gray-900">1. Introduction</h2>
            <p className="text-gray-600">
              Welcome to Calenlist ("Service"). By using our service, you agree to these terms. Please read them carefully.
            </p>

            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900">2. Using Calenlist</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">2.1 Account Creation</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>You must provide accurate information when creating an account</li>
                      <li>You must verify your email address</li>
                      <li>You are responsible for maintaining the security of your account</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">2.2 Calendar Sharing</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>You can create public or private calendars</li>
                      <li>You must have the rights to share the calendar content you post</li>
                      <li>You can control who can view your calendar's physical address</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">3. User Content</h2>
                <p className="mt-2 text-gray-600">
                  You retain ownership of your calendars and event content. By sharing content through Calenlist, you grant us permission to display and distribute it according to your chosen privacy settings.
                </p>
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-gray-900">3.1 Prohibited Content</h3>
                  <ul className="mt-2 list-disc list-inside text-gray-600">
                    <li>Illegal or harmful content</li>
                    <li>Spam or misleading information</li>
                    <li>Content that violates others' rights</li>
                    <li>Malicious software or harmful code</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">4. Features and Limitations</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">4.1 Calendar Integration</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>We support Google Calendar integration</li>
                      <li>Calendar sync frequency depends on our service capabilities</li>
                      <li>You must comply with Google Calendar's terms of service</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">4.2 Event Feedback</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Subscribers can leave feedback on events</li>
                      <li>Feedback must be honest and respectful</li>
                      <li>Calendar owners can view feedback statistics</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">5. Privacy and Data</h2>
                <p className="mt-2 text-gray-600">
                  We collect and process data as described in our <Link to="/privacy" className="text-blue-600 hover:text-blue-700">Privacy Policy</Link>. This includes:
                </p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>Account information</li>
                  <li>Calendar data and event details</li>
                  <li>Usage statistics and feedback</li>
                  <li>Physical addresses (when provided)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">6. Termination</h2>
                <p className="mt-2 text-gray-600">
                  We may suspend or terminate your account for violations of these terms. You may delete your account at any time.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">7. Changes to Terms</h2>
                <p className="mt-2 text-gray-600">
                  We may update these terms from time to time. We will notify you of significant changes via email or through the service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">8. Contact Us</h2>
                <p className="mt-2 text-gray-600">
                  For questions about these terms, please contact us at{' '}
                  <a href="mailto:support@calenlist.com" className="text-blue-600 hover:text-blue-700">
                    support@calenlist.com
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