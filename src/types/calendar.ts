export interface Calendar {
  id: string;
  user_id: string;
  name: string;
  google_calendar_url: string;
  streaming_urls?: Record<string, string>;
  is_public: boolean;
  created_at: string;
  banner?: CalendarBanner;
  profiles?: {
    display_name: string;
  };
  calendar_stats?: Array<{
    subscriber_count: number;
    view_count?: number;
  }>;
  subscriber_count?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  calendarName?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
}

export interface CalendarBanner {
  id: string;
  name: string;
  color: string;
  textColor: string;
  pattern: string;
}