import { isAfter, isBefore, addHours } from 'date-fns';
import { CalendarEvent } from '../types/calendar';

export function canLeaveFeedback(event: CalendarEvent, userId: string | undefined): boolean {
  if (!userId) return false;
  
  const now = new Date();
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.end);
  const feedbackEndTime = addHours(eventEnd, 24);

  return (
    // Event has started
    isAfter(now, eventStart) && 
    // Within feedback window (up to 24h after end)
    isBefore(now, feedbackEndTime)
  );
}

export function getFeedbackEligibleEvents(events: CalendarEvent[], userId: string | undefined): CalendarEvent[] {
  const now = new Date();
  
  return events
    .filter(event => canLeaveFeedback(event, userId))
    .sort((a, b) => b.start.getTime() - a.start.getTime()); // Most recent first
}