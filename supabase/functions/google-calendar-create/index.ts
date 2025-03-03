// Creates new Google calendar
async function createCalendar(accessToken: string, name: string, description?: string) {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ summary: name, description })
  });
  return response.json();
}