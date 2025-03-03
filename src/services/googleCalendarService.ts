import { isValidCalendarUrl, convertToIcsUrl } from '../utils/calendarUrl';
import { supabase } from '../lib/supabase';
import { parseRecurrenceRule } from '../utils/recurrenceParser';
import { getGoogleToken, refreshGoogleToken } from '../utils/googleAuth';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  calendarName?: string;
  creatorName?: string;
}

// Track failed URLs to prevent repeated retries
const failedUrls = new Set<string>();
const MAX_FAILURES = 3;
const failureCount: Record<string, number> = {};
const lastAttemptTime: Record<string, number> = {};
const RETRY_COOLDOWN = 60000; // 1 minute cooldown between retries for failed URLs

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

  // Check if this URL is in cooldown period
  const now = Date.now();
  if (failedUrls.has(icsUrl)) {
    const lastAttempt = lastAttemptTime[icsUrl] || 0;
    if (now - lastAttempt < RETRY_COOLDOWN) {
      console.log(`URL ${icsUrl} is in cooldown period, skipping fetch`);
      return [];
    }
    // Remove from failed URLs after cooldown
    failedUrls.delete(icsUrl);
  }

  try {
    // Check if token is valid before making request
    const token = await getGoogleToken();
    if (!token) {
      // Try to refresh token
      const refreshed = await refreshGoogleToken();
      if (!refreshed) {
        console.warn('Token refresh failed, proceeding without authentication');
      }
    }
    
    // Call the CORS proxy function with retries
    const response = await fetchWithRetries(icsUrl);
    
    if (!response?.data) {
      console.warn('No data received from calendar fetch');
      return [];
    }

    const events = parseICS(response.data);
    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    // Return empty array instead of throwing to prevent infinite retries
    return [];
  }
}

async function fetchWithRetries(icsUrl: string, maxRetries = 3): Promise<any> {
  // Check if this URL has already failed too many times
  if (failedUrls.has(icsUrl)) {
    return { data: null };
  }
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Update last attempt time
      lastAttemptTime[icsUrl] = Date.now();
      
      // Try direct fetch first as it's more reliable
      try {
        const response = await fetch(icsUrl, {
          headers: {
            'Accept': 'text/calendar',
            'User-Agent': 'Calenlist/1.0'
          }
        });
        
        if (response.ok) {
          const data = await response.text();
          // Reset failure count on success
          failureCount[icsUrl] = 0;
          return { data };
        }
      } catch (directFetchError) {
        console.warn('Direct fetch failed:', directFetchError);
        // Continue to Supabase function attempt
      }
      
      // Fall back to Supabase function
      const { data, error } = await supabase.functions.invoke('cors-proxy', {
        body: { calendarUrl: icsUrl }
      });

      if (error) {
        // Check if error is due to authentication
        if (error.message && error.message.toLowerCase().includes('auth')) {
          // Try to refresh token
          const refreshed = await refreshGoogleToken();
          if (!refreshed && attempt === maxRetries - 1) {
            throw new Error('Google Calendar authentication expired. Please reconnect your account.');
          }
        } else {
          throw error;
        }
      }
      
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt + 1} failed:`, err);
      
      // Track failure count for this URL
      failureCount[icsUrl] = (failureCount[icsUrl] || 0) + 1;
      
      // If we've failed too many times, add to failed URLs set
      if (failureCount[icsUrl] >= MAX_FAILURES) {
        failedUrls.add(icsUrl);
        console.error(`Too many failures for URL ${icsUrl}, will not retry again soon`);
        break;
      }
      
      if (attempt < maxRetries - 1) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // Return empty data instead of throwing
  return { data: null };
}

function parseICS(icsData: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icsData.split(/\r\n|\n|\r/);
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
        // If event has recurrence rule, expand it
        if (currentEvent.recurrenceRule) {
          const expandedEvents = parseRecurrenceRule(currentEvent as CalendarEvent, currentEvent.recurrenceRule);
          events.push(...expandedEvents);
        } else {
          events.push(currentEvent as CalendarEvent);
        }
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
        case 'RRULE':
          currentEvent.recurrenceRule = value;
          currentEvent.isRecurring = true;
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
      // For now, treat TZID dates as local - in future could add timezone conversion
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