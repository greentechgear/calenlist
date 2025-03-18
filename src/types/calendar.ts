import { CalendarBanner } from './banner';

export interface Calendar {
  id: string;
  user_id: string;
  name: string;
  google_calendar_url: string;
  streaming_urls?: Record<string, string>;
  custom_url?: string;
  is_public: boolean;
  created_at: string;
  banner?: CalendarBanner;
  description?: string;
  category_id?: string;
  demo_video_url?: string;
  physical_address?: string;
  address_visibility?: 'public' | 'subscribers' | 'private';
  payment_type?: string;
  subscription_price_cents?: number;
  event_price_cents?: number;
  profiles?: {
    display_name: string;
  };
  calendar_stats?: {
    subscriber_count: number;
    view_count?: number;
  };
  subscriber_count?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  calendarName?: string;
  creatorName?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  allDay?: boolean;
}
