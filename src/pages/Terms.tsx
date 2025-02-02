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
          <p className="mt-2 text-blue-100">Last updated: December 2, 2024</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="prose prose-blue max-w-none">
            <h2 className="text-xl font-semibold text-gray-900">Introduction</h2>
            <p className="text-gray-600">
              Welcome to Calenlist.com ("Company," "we," "our," "us")! These Terms of Service ("Terms") govern your use of our website located at https://calenlist.com and any associated services or applications (collectively, the "Service").
            </p>

            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900">Communications</h2>
                <p className="mt-2 text-gray-600">
                  By creating an account, you consent to receive newsletters, promotional materials, and other communications. You may opt out of these at any time via your account preferences or the unsubscribe links in our communications.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Purchases</h2>
                <p className="mt-2 text-gray-600">
                  Purchases made through the Service require the provision of accurate payment information. You agree that:
                </p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>You are authorized to use the payment method provided.</li>
                  <li>The information you provide is accurate.</li>
                  <li>Stripe handles all payment processing, and their Privacy Policy and Terms apply.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Subscriptions</h2>
                <p className="mt-2 text-gray-600">
                  Subscriptions renew automatically unless canceled before the end of the current billing period. Cancellation can be completed through your account settings. Failure to process a payment may result in suspension of service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Free Trial</h2>
                <p className="mt-2 text-gray-600">
                  Free trials transition to paid plans unless canceled before the trial ends. Clear instructions for cancellation are provided during the trial sign-up process.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Content</h2>
                <p className="mt-2 text-gray-600">
                  Users retain rights to the content they upload. By sharing content on the Service, you grant us a license to use, display, and distribute it for the operation of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Prohibited Uses</h2>
                <p className="mt-2 text-gray-600">Users may not:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>Engage in fraudulent or unlawful activities</li>
                  <li>Upload harmful software</li>
                  <li>Disrupt the Service's functionality or integrity</li>
                  <li>Violate intellectual property rights</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Contact Us</h2>
                <p className="mt-2 text-gray-600">
                  For inquiries about these Terms or the Service, please contact us at{' '}
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