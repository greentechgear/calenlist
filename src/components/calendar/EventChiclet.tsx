import React from 'react';
import { format } from 'date-fns';
import { MapPin } from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';
import EventTooltip from './EventTooltip';
import { useDelayedHover } from '../../hooks/useDelayedHover';

interface EventChicletProps {
  event: CalendarEvent;
  showLocation?: boolean;
  calendarId: string;
  color?: string;
}

export default function EventChiclet({ 
  event, 
  showLocation = false,
  calendarId,
  color = '#7C3AED' 
}: EventChicletProps) {
  const { isVisible: showTooltip, handleMouseEnter, handleMouseLeave } = useDelayedHover(300);
  const hasLocation = event.description?.includes('Location:');

  return (
    <div className="relative">
      <div
        className="px-2 py-1 text-xs rounded-md transition-colors group relative"
        style={{
          backgroundColor: `${color}10`,
          color: color
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2 max-w-full overflow-hidden">
          <span className="font-medium whitespace-nowrap flex-shrink-0">
            {format(event.start, 'h:mm a')}
          </span>
          <span className="truncate flex-1 min-w-0">
            {event.title}
          </span>
          {hasLocation && showLocation && (
            <MapPin className="h-3 w-3 flex-shrink-0" />
          )}
        </div>
      </div>

      {showTooltip && (
        <EventTooltip 
          event={event} 
          showLocation={showLocation}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      )}
    </div>
  );
}