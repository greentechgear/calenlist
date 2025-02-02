import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with retries and timeouts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'calenlist' }
  },
  db: {
    schema: 'public'
  },
  // Add retry configuration
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  // Add request timeout
  fetch: (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    return fetch(url, {
      ...options,
      signal: controller.signal,
      // Add retry headers
      headers: {
        ...options.headers,
        'x-client-retry': '3',
        'x-client-timeout': '30000'
      }
    }).finally(() => clearTimeout(timeoutId));
  }
});

// Add error handling wrapper with retries
export async function supabaseQuery<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  retries = 3,
  delay = 1000
): Promise<T> {
  let lastError;
  
  for (let i = 0; i < retries; i++) {
    try {
      const { data, error } = await queryFn();
      if (error) throw error;
      if (!data) throw new Error('No data returned from query');
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`Query attempt ${i + 1} failed:`, err);
      
      // Don't wait on last attempt
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
      }
    }
  }

  console.error('All query attempts failed:', lastError);
  throw lastError;
}

// Add helper for handling offline/reconnection
let isReconnecting = false;

export async function handleOffline() {
  if (isReconnecting) return;
  isReconnecting = true;

  try {
    // Test connection
    const response = await fetch(supabaseUrl);
    if (!response.ok) throw new Error('Connection test failed');
    
    // Reconnected - refresh auth
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;

    console.log('Successfully reconnected to Supabase');
  } catch (err) {
    console.error('Reconnection failed:', err);
  } finally {
    isReconnecting = false;
  }
}

// Listen for offline/online events
if (typeof window !== 'undefined') {
  window.addEventListener('offline', () => {
    console.log('Connection lost - will attempt to reconnect when back online');
  });

  window.addEventListener('online', () => {
    console.log('Connection restored - attempting to reconnect...');
    handleOffline();
  });
}