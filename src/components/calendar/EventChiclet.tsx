import { format } from 'date-fns';
import { MapPin, Repeat } from 'lucide-react';
import { CalendarEvent } from '../../types/calendar';
import EventTooltip from './EventTooltip';
import { useDelayedHover } from '../../hooks/useDelayedHover';

interface EventChicletProps {
  event: CalendarEvent;
  showLocation?: boolean;
  calendarId: string;
  color?: string;
  isFirstDay?: boolean;
  isLastDay?: boolean;
  isMiddleDay?: boolean;
}

export default function EventChiclet({ 
  event, 
  showLocation = false,
  color = '#7C3AED',
  isFirstDay = true,
  isLastDay = true,
  isMiddleDay = false
}: EventChicletProps) {
  const { isVisible: showTooltip, handleMouseEnter, handleMouseLeave } = useDelayedHover(300);
  const hasLocation = event.description?.includes('Location:');

  // Determine styles based on event position
  const getEventStyles = () => {
    const baseStyles = {
      backgroundColor: `${color}15`,
      color,
      borderColor: color,
    };

    if (isFirstDay) {
      return {
        ...baseStyles,
        borderLeft: `4px solid ${color}`,
        borderTop: `1px solid ${color}`,
        borderBottom: `1px solid ${color}`,
        borderRight: isLastDay ? `1px solid ${color}` : 'none',
        borderTopLeftRadius: '0.375rem',
        borderBottomLeftRadius: '0.375rem',
        borderTopRightRadius: isLastDay ? '0.375rem' : '0',
        borderBottomRightRadius: isLastDay ? '0.375rem' : '0',
      };
    } else if (isLastDay) {
      return {
        ...baseStyles,
        borderTop: `1px solid ${color}`,
        borderBottom: `1px solid ${color}`,
        borderRight: `1px solid ${color}`,
        borderTopRightRadius: '0.375rem',
        borderBottomRightRadius: '0.375rem',
      };
    } else if (isMiddleDay) {
      return {
        ...baseStyles,
        borderTop: `1px solid ${color}`,
        borderBottom: `1px solid ${color}`,
        marginLeft: '-0.5rem',
        marginRight: '-0.5rem',
      };
    }

    return baseStyles;
  };

  return (
    <div className="relative">
      <div
        className={`px-2 py-1 text-xs transition-colors group relative`}
        style={getEventStyles()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseEnter}
        onTouchEnd={handleMouseLeave}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2 max-w-full overflow-hidden">
          {isFirstDay ? (
            <>
              <span className="font-medium whitespace-nowrap flex-shrink-0">
                {format(event.start, 'h:mm a')}
              </span>
              <span className="truncate flex-1 min-w-0 flex items-center gap-1">
                {event.title}
                {event.isRecurring && (
                  <Repeat className="h-3 w-3 flex-shrink-0 opacity-75" />
                )}
              </span>
              {hasLocation && showLocation && (
                <MapPin className="h-3 w-3 flex-shrink-0" />
              )}
            </>
          ) : isMiddleDay ? (
            <span className="truncate flex-1 min-w-0 opacity-75 flex items-center gap-1">
              {event.title}
              {event.isRecurring && (
                <Repeat className="h-3 w-3 flex-shrink-0 opacity-75" />
              )}
            </span>
          ) : (
            <>
              <span className="font-medium whitespace-nowrap flex-shrink-0">
                {format(event.end, 'h:mm a')}
              </span>
              <span className="truncate flex-1 min-w-0 flex items-center gap-1">
                {event.title}
                {event.isRecurring && (
                  <Repeat className="h-3 w-3 flex-shrink-0 opacity-75" />
                )}
              </span>
            </>
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