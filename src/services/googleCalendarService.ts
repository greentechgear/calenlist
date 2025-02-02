import { isValidCalendarUrl, convertToIcsUrl } from '../utils/calendarUrl';
import { supabase } from '../lib/supabase';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
}

export async function fetchGoogleCalendarEvents(calendarUrl: string): Promise<CalendarEvent[]> {
  if (!calendarUrl) {
    return [];
  }

  // Validate URL before making any requests
  if (!isValidCalendarUrl(calendarUrl)) {
    console.warn('Invalid calendar URL format:', calendarUrl);
    return [];
  }

  // Convert to ICS format if needed
  const icsUrl = convertToIcsUrl(calendarUrl);

  try {
    // Call the CORS proxy function
    const { data, error } = await supabase.functions.invoke('cors-proxy', {
      body: { calendarUrl: icsUrl }
    });

    if (error) {
      console.error('CORS proxy error:', error);
      throw new Error('Failed to fetch calendar data. Please try again later.');
    }

    if (!data?.data) {
      console.error('No data received from CORS proxy');
      return [];
    }

    const events = parseICS(data.data);
    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}

function parseICS(icsData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsData.split('\n');
  let currentEvent: Partial<CalendarEvent> | null = null;
  let currentValue = '';

  for (let i = 0; i < lines.length; i++) {
    let currentLine = lines[i].trim();

    // Handle line continuations
    while (i + 1 < lines.length && lines[i + 1].startsWith(' ')) {
      currentLine += lines[i + 1].substring(1);
      i++;
    }

    if (currentLine === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (currentLine === 'END:VEVENT' && currentEvent) {
      if (currentEvent.id && currentEvent.title && currentEvent.start && currentEvent.end) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      const [keyFull, ...valueParts] = currentLine.split(':');
      const value = valueParts.join(':');
      const [key, ...params] = keyFull.split(';');
      
      // Parse parameters
      const parameters = new Map<string, string>();
      params.forEach(param => {
        const [pKey, pValue] = param.split('=');
        parameters.set(pKey, pValue);
      });

      switch (key) {
        case 'UID':
          currentEvent.id = value;
          break;
        case 'SUMMARY':
          currentEvent.title = value;
          break;
        case 'DESCRIPTION':
          currentEvent.description = value.replace(/\\n/g, '\n').replace(/\\,/g, ',');
          break;
        case 'DTSTART':
          currentEvent.start = parseICSDateTime(value, parameters);
          break;
        case 'DTEND':
          currentEvent.end = parseICSDateTime(value, parameters);
          break;
      }
    }
  }

  return events.sort((a, b) => a.start.getTime() - b.start.getTime());
}

function parseICSDateTime(value: string, parameters: Map<string, string>): Date {
  const isUTC = value.endsWith('Z');
  const tzid = parameters.get('TZID');

  const cleanValue = value.replace('Z', '');

  if (cleanValue.includes('T')) {
    const year = parseInt(cleanValue.substr(0, 4));
    const month = parseInt(cleanValue.substr(4, 2)) - 1;
    const day = parseInt(cleanValue.substr(6, 2));
    const hour = parseInt(cleanValue.substr(9, 2));
    const minute = parseInt(cleanValue.substr(11, 2));
    const second = parseInt(cleanValue.substr(13, 2) || '0');

    if (isUTC) {
      return new Date(Date.UTC(year, month, day, hour, minute, second));
    } else if (tzid) {
      return new Date(year, month, day, hour, minute, second);
    } else {
      return new Date(year, month, day, hour, minute, second);
    }
  } else {
    const year = parseInt(cleanValue.substr(0, 4));
    const month = parseInt(cleanValue.substr(4, 2)) - 1;
    const day = parseInt(cleanValue.substr(6, 2));
    return new Date(year, month, day);
  }
}