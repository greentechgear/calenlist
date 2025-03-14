import { addDays, addWeeks, addMonths, addYears } from 'date-fns';
import { CalendarEvent } from '../services/googleCalendarService';

interface RecurrenceRule {
  frequency: string;
  interval?: number;
  count?: number;
  until?: Date;
  byDay?: string[];
  byMonth?: number[];
  byMonthDay?: number[];
}

export function parseRecurrenceRule(event: CalendarEvent, rrule: string): CalendarEvent[] {
  const rule = parseRRule(rrule);
  const events: CalendarEvent[] = [];
  const eventDuration = event.end.getTime() - event.start.getTime();

  let currentDate = new Date(event.start);
  let occurrences = 0;
  const maxOccurrences = rule.count || 52; // Limit to 52 occurrences if no count specified

  while (occurrences < maxOccurrences) {
    if (rule.until && currentDate > rule.until) break;

    // Add the current occurrence
    events.push({
      ...event,
      id: `${event.id}-${occurrences + 1}`,
      start: new Date(currentDate),
      end: new Date(currentDate.getTime() + eventDuration),
      isRecurring: true
    });

    // Calculate next occurrence based on frequency
    switch (rule.frequency) {
      case 'DAILY':
        currentDate = addDays(currentDate, rule.interval || 1);
        break;
      case 'WEEKLY':
        currentDate = addWeeks(currentDate, rule.interval || 1);
        break;
      case 'MONTHLY':
        currentDate = addMonths(currentDate, rule.interval || 1);
        break;
      case 'YEARLY':
        currentDate = addYears(currentDate, rule.interval || 1);
        break;
      default:
        console.warn('Unsupported recurrence frequency:', rule.frequency);
        return events;
    }

    occurrences++;
  }

  return events;
}

function parseRRule(rrule: string): RecurrenceRule {
  const parts = rrule.split(';');
  const rule: RecurrenceRule = {
    frequency: 'DAILY', // Default frequency
  };

  parts.forEach(part => {
    const [key, value] = part.split('=');
    switch (key) {
      case 'FREQ':
        rule.frequency = value;
        break;
      case 'INTERVAL':
        rule.interval = parseInt(value);
        break;
      case 'COUNT':
        rule.count = parseInt(value);
        break;
      case 'UNTIL':
        rule.until = parseUntilDate(value);
        break;
      case 'BYDAY':
        rule.byDay = value.split(',');
        break;
      case 'BYMONTH':
        rule.byMonth = value.split(',').map(Number);
        break;
      case 'BYMONTHDAY':
        rule.byMonthDay = value.split(',').map(Number);
        break;
    }
  });

  return rule;
}

function parseUntilDate(value: string): Date {
  // UNTIL dates are in UTC format: YYYYMMDDTHHMMSSZ
  const year = parseInt(value.substr(0, 4));
  const month = parseInt(value.substr(4, 2)) - 1;
  const day = parseInt(value.substr(6, 2));
  const hour = value.length > 8 ? parseInt(value.substr(9, 2)) : 0;
  const minute = value.length > 10 ? parseInt(value.substr(11, 2)) : 0;
  const second = value.length > 12 ? parseInt(value.substr(13, 2)) : 0;

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}