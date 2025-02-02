import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';
import { getBannerStyle } from '../../lib/banner/utils';
import CategoryBadge from '../CategoryBadge';
import PaymentInfo from '../calendar/PaymentInfo';
import type { Calendar as CalendarType } from '../../types/calendar';

interface TopCalendarsProps {
  calendars: CalendarType[];
}

export default function TopCalendars({ calendars }: TopCalendarsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Popular Calendars</h2>
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {calendars.map(calendar => {
          const bannerStyle = getBannerStyle(calendar.banner);
          const shouldShowSubscriberCount = 
            !calendar.payment_type || 
            calendar.payment_type === 'free' || 
            (calendar.subscriber_count && calendar.subscriber_count >= 10);

          return (
            <Link
              key={calendar.id}
              to={`/calendar/${calendar.id}`}
              className="block group"
            >
              <div 
                className="rounded-lg p-6 transition-shadow group-hover:shadow-md h-full flex flex-col"
                style={{ backgroundColor: bannerStyle.backgroundColor }}
              >
                <div className="flex items-center mb-2">
                  <Calendar 
                    className="h-6 w-6 mr-2 flex-shrink-0" 
                    style={{ color: bannerStyle.color }}
                  />
                  <h3 
                    className="text-lg font-semibold"
                    style={{ color: bannerStyle.color }}
                  >
                    {calendar.name}
                  </h3>
                </div>
                
                {calendar.profiles?.display_name && (
                  <p 
                    className="text-sm mb-2 opacity-75"
                    style={{ color: bannerStyle.color }}
                  >
                    by {calendar.profiles.display_name}
                  </p>
                )}

                {calendar.category_id && (
                  <div className="mb-3">
                    <CategoryBadge categoryId={calendar.category_id} size="sm" />
                  </div>
                )}

                {calendar.description && (
                  <p
                    className="text-sm mb-4 line-clamp-2 flex-grow"
                    style={{ color: bannerStyle.color }}
                  >
                    {calendar.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-auto">
                  {shouldShowSubscriberCount && (
                    <div 
                      className="flex items-center text-sm opacity-75"
                      style={{ color: bannerStyle.color }}
                    >
                      <Users className="h-4 w-4 mr-1" />
                      <span>{calendar.subscriber_count || 0} subscribers</span>
                    </div>
                  )}
                  
                  {calendar.payment_type && (
                    <PaymentInfo
                      paymentType={calendar.payment_type as 'free' | 'subscription' | 'one_time'}
                      subscriptionPriceCents={calendar.subscription_price_cents}
                      eventPriceCents={calendar.event_price_cents}
                    />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}