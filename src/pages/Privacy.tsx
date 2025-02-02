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
          <p className="mt-2 text-indigo-100">Effective Date: December 2, 2024</p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="prose prose-indigo max-w-none">
            <h2 className="text-xl font-semibold text-gray-900">Introduction</h2>
            <p className="text-gray-600">
              Welcome to Calenlist.com ("Company," "we," "our," "us"). This Privacy Policy outlines how we collect, use, disclose, and safeguard your information when you visit https://calenlist.com or use our services.
            </p>

            <div className="mt-8 space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-gray-900">Information Collection and Use</h2>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Personal Data</h3>
                <p className="mt-2 text-gray-600">We may collect:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>Name, email address, and contact details</li>
                  <li>Account preferences and settings</li>
                  <li>Payment information (processed by Stripe)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Tracking Technologies</h2>
                <p className="mt-2 text-gray-600">We use cookies and similar technologies:</p>
                <ul className="mt-2 list-disc list-inside text-gray-600">
                  <li>Session Cookies: To maintain session integrity</li>
                  <li>Preference Cookies: To remember your settings</li>
                  <li>Analytics Cookies: To track usage and improve functionality</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Your Rights</h2>
                <div className="mt-4 space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">GDPR Rights (EU/EEA Residents)</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Access, update, or delete your data</li>
                      <li>Restrict or object to data processing</li>
                      <li>Request data portability</li>
                      <li>Withdraw consent for processing activities</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">CCPA Rights (California Residents)</h3>
                    <ul className="mt-2 list-disc list-inside text-gray-600">
                      <li>Request details about collected Personal Data</li>
                      <li>Request deletion of your data</li>
                      <li>Opt-out of data sharing (we don't sell your data)</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                <p className="mt-2 text-gray-600">
                  For questions or concerns about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:support@calenlist.com" className="text-indigo-600 hover:text-indigo-700">
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