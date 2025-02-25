import { PatternType } from '../lib/banner/patterns';

// Define valid calendar domains
const VALID_CALENDAR_DOMAINS = [
  'calendar.google.com',
  'outlook.office365.com',
  'outlook.live.com',
  'calendar.yahoo.com',
  'p[0-9]{2}-caldav.icloud.com'
];

/**
 * Masks a calendar URL for display by hiding sensitive parts
 */
export function maskCalendarUrl(url: string): string {
  if (!url) return '';
  
  try {
    const urlObj = new URL(url);
    
    // For Google Calendar URLs
    if (urlObj.hostname === 'calendar.google.com') {
      const parts = urlObj.pathname.split('/');
      // Mask the calendar ID/key portion
      if (parts.length > 2) {
        parts[parts.length - 1] = '****';
        parts[parts.length - 2] = '****';
        urlObj.pathname = parts.join('/');
      }
      return urlObj.toString();
    }
    
    // For other services, mask everything after the domain
    return `${urlObj.protocol}//${urlObj.hostname}/****`;
  } catch (error) {
    return url.substring(0, 20) + '...';
  }
}

/**
 * Validates if a URL is a valid calendar URL
 */
export function isValidCalendarUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (urlObj.protocol !== 'https:') {
      return false;
    }

    // Check domain against whitelist using regex
    const isValidDomain = VALID_CALENDAR_DOMAINS.some(domain => 
      new RegExp(`^${domain}$`).test(urlObj.hostname)
    );

    if (!isValidDomain) {
      return false;
    }

    // For Google Calendar, ensure it's a valid format
    if (urlObj.hostname === 'calendar.google.com') {
      const isValidFormat = (
        url.endsWith('.ics') ||
        url.includes('/calendar/ical/') ||
        url.includes('/calendar/embed') ||
        url.includes('/calendar/u/0/r/settings') ||
        url.includes('/calendar/u/0/r?cid=')
      );

      if (!isValidFormat) {
        return false;
      }
    }

    // Security checks
    if (urlObj.username || urlObj.password) {
      return false;
    }

    if (urlObj.hash) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets a user-friendly error message for invalid calendar URLs
 */
export function getCalendarUrlError(url: string): string | null {
  if (!url) return 'Calendar URL is required';
  
  try {
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'https:') {
      return 'Calendar URL must use HTTPS';
    }

    const isValidDomain = VALID_CALENDAR_DOMAINS.some(domain => 
      new RegExp(`^${domain}$`).test(urlObj.hostname)
    );

    if (!isValidDomain) {
      return 'Please enter a valid Google Calendar URL';
    }

    if (urlObj.hostname === 'calendar.google.com') {
      if (url.includes('?cid=') || url.includes('&cid=')) {
        return 'Please use the calendar\'s "Secret address in iCal format" instead of the sharing URL. Click "How to find the URL" below for instructions.';
      }
      
      if (!url.endsWith('.ics') && !url.includes('/calendar/ical/')) {
        return 'Please use the calendar\'s "Secret address in iCal format". Click "How to find the URL" below for instructions.';
      }
    }

    return null;
  } catch (error) {
    return 'Please enter a valid calendar URL';
  }
}

/**
 * Extracts calendar ID from various calendar URL formats
 */
export function extractCalendarId(url: string): string {
  if (!isValidCalendarUrl(url)) {
    console.warn('Invalid calendar URL format');
    return '';
  }

  try {
    const urlObj = new URL(url);
    
    if (urlObj.hostname === 'calendar.google.com') {
      // Handle embed URLs
      if (url.includes('/calendar/embed')) {
        const calendarId = urlObj.searchParams.get('src');
        return calendarId ? decodeURIComponent(calendarId) : '';
      }
      
      // Handle ICS URLs
      const match = url.match(/\/calendar\/ical\/(.+?)\/.*\.ics$/);
      if (match) {
        return decodeURIComponent(match[1]);
      }

      // Handle settings URLs
      if (url.includes('/calendar/u/0/r/settings/')) {
        const parts = url.split('/');
        return decodeURIComponent(parts[parts.length - 1]);
      }

      // Handle calendar home URLs
      if (url.includes('/calendar/u/0/r')) {
        const cid = urlObj.searchParams.get('cid');
        return cid ? decodeURIComponent(cid) : '';
      }
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting calendar ID:', error);
    return '';
  }
}

/**
 * Converts various calendar URL formats to ICS format
 */
export function convertToIcsUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Handle Google Calendar URLs
    if (urlObj.hostname === 'calendar.google.com') {
      // Already an ICS URL
      if (url.endsWith('.ics')) {
        return url;
      }

      // Handle calendar ID from various formats
      let calendarId = '';

      // From embed URL
      if (url.includes('/calendar/embed')) {
        calendarId = urlObj.searchParams.get('src') || '';
      }
      // From settings URL
      else if (url.includes('/calendar/u/0/r/settings')) {
        const parts = url.split('/');
        calendarId = parts[parts.length - 1];
      }
      // From calendar home
      else if (url.includes('/calendar/u/0/r')) {
        calendarId = urlObj.searchParams.get('cid') || '';
      }

      if (calendarId) {
        return `https://calendar.google.com/calendar/ical/${encodeURIComponent(calendarId)}/public/basic.ics`;
      }
    }
    
    // Return original URL if no conversion needed
    return url;
  } catch (error) {
    console.warn('Error converting calendar URL:', error);
    return url;
  }
}

/**
 * Gets the Google Calendar subscription URL for an ICS feed
 */
export function getGoogleCalendarSubscribeUrl(url: string): string {
  // Convert to ICS format if needed
  const icsUrl = convertToIcsUrl(url);
  
  if (!isValidCalendarUrl(icsUrl)) {
    console.warn('Invalid ICS URL provided:', icsUrl);
    return 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl';
  }

  return `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?cid=${encodeURIComponent(icsUrl)}`;
}