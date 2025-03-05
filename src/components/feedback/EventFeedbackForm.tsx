import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Star } from 'lucide-react';
import { toast } from '../../utils/toast';

interface EventFeedbackFormProps {
  calendarId: string;
  eventId: string;
  onSubmit?: () => void;
}

export default function EventFeedbackForm({ 
  calendarId, 
  eventId,
  onSubmit 
}: EventFeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<{rating: number, comment: string} | null>(null);

  useEffect(() => {
    checkExistingFeedback();
  }, [calendarId, eventId]);

  const checkExistingFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('event_feedback')
        .select('rating, comment')
        .eq('calendar_id', calendarId)
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows gracefully

      if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
        console.error('Error checking feedback:', error);
        return;
      }

      if (data) {
        setExistingFeedback(data);
        setRating(data.rating);
        setComment(data.comment || '');
      }
    } catch (err) {
      console.error('Error checking feedback:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError('Please select a rating');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user.id)
        .single();

      const userDisplayName = profile?.display_name || 'A user';

      // Submit feedback
      const { error: submitError } = await supabase
        .from('event_feedback')
        .upsert([{
          calendar_id: calendarId,
          event_id: eventId,
          user_id: user.id,
          rating,
          comment: comment.trim() || null
        }], {
          onConflict: 'user_id,calendar_id,event_id'
        });

      if (submitError) throw submitError;

      // Send notification
      const { error: notifyError } = await supabase.functions.invoke('send-feedback-notification', {
        body: {
          calendarId,
          rating,
          comment: comment.trim(),
          userDisplayName
        }
      });

      if (notifyError) {
        console.error('Error sending notification:', notifyError);
      }

      setSuccess(true);
      toast.success('Feedback submitted successfully');
      onSubmit?.();
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="bg-green-50 text-green-800 p-4 rounded-md">
        Thank you for your feedback! Your response helps improve future events.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {existingFeedback && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-4">
          You've already submitted feedback for this event. Submitting again will update your previous feedback.
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating*
        </label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              onMouseEnter={() => setHoveredRating(value)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 focus:outline-none"
            >
              <Star
                className={`h-6 w-6 ${
                  value <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Comments (optional)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500"
          placeholder="Share your thoughts about the event..."
        />
      </div>

      <div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
        </button>
      </div>
    </form>
  );
}