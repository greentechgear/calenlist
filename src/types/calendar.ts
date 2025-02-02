{/* Update Calendar type to remove payment-related fields */}
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
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  calendarName?: string;
}