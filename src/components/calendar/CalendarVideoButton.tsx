import React from 'react';
import { Play } from 'lucide-react';

interface CalendarVideoButtonProps {
  onClick: () => void;
  color?: string;
}

export default function CalendarVideoButton({ onClick, color = '#000000' }: CalendarVideoButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 px-4 py-2 rounded-md bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
      style={{ color }}
    >
      <Play className="h-4 w-4" />
      <span>Watch Demo</span>
    </button>
  );
}