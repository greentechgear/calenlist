import React from 'react';
import { Info } from 'lucide-react';

interface CalendarDescriptionProps {
  description?: string | null;
}

export default function CalendarDescription({ description }: CalendarDescriptionProps) {
  if (!description) return null;

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-start space-x-3">
        <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <p className="text-lg leading-relaxed whitespace-pre-line">
          {description}
        </p>
      </div>
    </div>
  );
}