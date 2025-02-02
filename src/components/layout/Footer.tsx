import React from 'react';
import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Calenlist. All rights reserved.
          </p>
          <nav className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0">
            <ul className="flex items-center space-x-8">
              <li>
                <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                  Privacy
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@calenlist.com" 
                  className="text-sm text-gray-500 hover:text-gray-900"
                >
                  Contact
                </a>
              </li>
            </ul>
            <a 
              href="https://github.com/greentechgear/calenlist" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-sm text-gray-400 hover:text-gray-600 flex items-center sm:ml-8"
            >
              <Github className="h-4 w-4 mr-1" />
              Open Source
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}