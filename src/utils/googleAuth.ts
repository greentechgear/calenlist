// Store token expiration time
const TOKEN_STORAGE_KEY = 'google_token';
const TOKEN_EXPIRY_KEY = 'google_token_expiry';

/**
 * Saves the Google token with expiration time
 */
function saveGoogleToken(token: string, expiresIn: number = 3600) {
  // Store the token
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
  
  // Calculate and store expiration time (current time + expiresIn seconds)
  const expiryTime = Date.now() + (expiresIn * 1000);
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
}

/**
 * Checks if the Google token is expired
 */
export function isGoogleTokenExpired(): boolean {
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;
  
  // Token is expired if current time is past expiry time
  // Add a 5-minute buffer to refresh the token before it actually expires
  return Date.now() > (parseInt(expiryTime) - 300000);
}

/**
 * Gets the current Google token, refreshing if needed
 */
export async function getGoogleToken(): Promise<string | null> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  
  // If no token or token is expired, try to refresh
  if (!token || isGoogleTokenExpired()) {
    const refreshed = await refreshGoogleToken();
    if (refreshed) {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  }
  
  return token;
}

/**
 * Refreshes the Google token
 * Since we're using implicit flow (response_type=token), we can't auto-refresh
 * This function will trigger a re-authentication if available
 * Returns true if successful, false otherwise
 */
export async function refreshGoogleToken(): Promise<boolean> {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  
  if (!token) {
    return false;
  }
  
  try {
    // Try to make a simple API call to check if token is valid
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      // Token is still valid - update expiry time to extend it
      saveGoogleToken(token, 3600); // Extend for another hour
      return true;
    }
    
    // If token is invalid/expired and we can't auto-refresh, we need to re-authenticate
    // In a production app, you'd use a backend endpoint to refresh the token using a refresh token
    
    // Clear expired token
    clearGoogleTokens();
    return false;
  } catch (error) {
    console.error('Error checking Google token validity:', error);
    return false;
  }
}

/**
 * Clears all Google auth tokens
 */
export function clearGoogleTokens() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
}