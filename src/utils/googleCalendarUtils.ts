import { isValidCalendarUrl } from './calendarUrl';

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
      return match ? decodeURIComponent(match[1]) : '';
    }
    
    return '';
  } catch (error) {
    console.warn('Error extracting calendar ID:', error);
    return '';
  }
}