import React from 'react';
import { Globe, Lock } from 'lucide-react';

interface VisibilityToggleProps {
  isPublic: boolean;
  onChange: (isPublic: boolean) => void;
}

export default function VisibilityToggle({ isPublic, onChange }: VisibilityToggleProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Calendar Visibility
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
            isPublic
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <Globe className="h-4 w-4 mr-2" />
          <span className="font-medium">Public</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={`flex items-center justify-center px-4 py-3 border-2 rounded-lg ${
            !isPublic
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-gray-200 text-gray-500 hover:border-gray-300'
          }`}
        >
          <Lock className="h-4 w-4 mr-2" />
          <span className="font-medium">Private</span>
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {isPublic
          ? 'Anyone can find and subscribe to this calendar'
          : 'Only people you share the link with can subscribe'}
      </p>
    </div>
  );
}