import React from 'react';
import { MessageSquare } from 'lucide-react';
import { FeedbackFish } from '@feedback-fish/react';
import { useAuth } from '../contexts/AuthContext';

export default function FeedbackButton() {
  const { user } = useAuth();
  const projectId = import.meta.env.VITE_FEEDBACK_FISH_ID;

  if (!projectId) {
    return null;
  }

  return (
    <FeedbackFish projectId={projectId} userId={user?.email}>
      <button
        className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-md transition-colors"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Send Feedback
      </button>
    </FeedbackFish>
  );
}