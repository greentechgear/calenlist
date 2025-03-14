// Define valid calendar domains
const VALID_CALENDAR_DOMAINS = [
  'calendar.google.com',
  'outlook.office365.com',
  'outlook.live.com',
  'calendar.yahoo.com',
  'p[0-9]{2}-caldav.icloud.com'
];


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
 * Validates if a URL is a valid ICS feed URL
 */
export function isValidIcsUrl(url: string): boolean {
  // First check if it's a valid calendar URL
  if (!isValidCalendarUrl(url)) {
    return false;
  }

  // Convert URL to ICS format if needed
  const icsUrl = convertToIcsUrl(url);
  
  try {
    const urlObj = new URL(icsUrl);
    
    // For Google Calendar
    if (urlObj.hostname === 'calendar.google.com') {
      return urlObj.pathname.includes('/calendar/ical/') && urlObj.pathname.endsWith('.ics');
    }
    
    // For other services, check if it ends with .ics
    return urlObj.pathname.endsWith('.ics');
  } catch (error) {
    console.warn('Error validating ICS URL:', error);
    return false;
  }
}

/**
 * Gets the Google Calendar subscription URL for an ICS feed
 */
export function getGoogleCalendarSubscribeUrl(url: string): string {
  // Convert to ICS format if needed
  const icsUrl = convertToIcsUrl(url);
  
  if (!isValidIcsUrl(icsUrl)) {
    console.warn('Invalid ICS URL provided:', icsUrl);
    return 'https://calendar.google.com/calendar/u/0/r/settings/addbyurl';
  }

  return `https://calendar.google.com/calendar/u/0/r/settings/addbyurl?cid=${encodeURIComponent(icsUrl)}`;
}
