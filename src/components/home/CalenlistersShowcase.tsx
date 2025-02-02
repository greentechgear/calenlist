import React from 'react';
import { Users } from 'lucide-react';

export default function CalenlistersShowcase() {
  return (
    <div className="bg-gradient-to-b from-white to-purple-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Users className="h-8 w-8 text-purple-600" />
            <h2 className="text-3xl font-bold text-gray-900">Meet Our Calenlisters</h2>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From wise owls to energetic rabbits, our diverse community of creators uses Calenlist 
            to share their amazing events with the world.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Wise Owl Professor */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src="https://images.unsplash.com/photo-1543549790-8b5f4a028cfb?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Professor Hoot"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">Professor Hoot</h3>
                <p className="text-sm text-gray-600">Wisdom Workshop Host</p>
              </div>
            </div>
            <p className="text-gray-600">
              "My night owl students always know when the next workshop is happening. Calenlist is a real hoot!"
            </p>
          </div>

          {/* Energetic Rabbit Coach */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src="https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Coach Hopps"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">Coach Hopps</h3>
                <p className="text-sm text-gray-600">Fitness Enthusiast</p>
              </div>
            </div>
            <p className="text-gray-600">
              "Keeping my high-energy fitness classes organized is no longer a wild goose chase!"
            </p>
          </div>

          {/* Party Planning Penguin */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100">
            <div className="flex items-center space-x-4 mb-4">
              <img
                src="https://images.unsplash.com/photo-1551986782-d0169b3f8fa7?auto=format&fit=crop&w=100&h=100&q=80"
                alt="Sir Waddles"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-900">Sir Waddles</h3>
                <p className="text-sm text-gray-600">Event Coordinator</p>
              </div>
            </div>
            <p className="text-gray-600">
              "From black-tie galas to ice cream socials, my events are always perfectly synchronized!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}