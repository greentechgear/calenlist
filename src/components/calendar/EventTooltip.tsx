import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent } from '../../types/calendar';
import { escapeHtml, createSafeHtml } from '../../utils/security';

interface EventTooltipProps {
  event: CalendarEvent;
  showLocation?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function EventTooltip({ 
  event, 
  showLocation,
  onMouseEnter,
  onMouseLeave 
}: EventTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hasLocation = event.description?.includes('Location:');
  const location = hasLocation ? event.description.split('Location:')[1].trim().split('\n')[0] : '';

  useEffect(() => {
    const positionTooltip = () => {
      const tooltip = tooltipRef.current;
      if (!tooltip) return;

      const rect = tooltip.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Center horizontally
      let left = (viewportWidth - rect.width) / 2;
      if (left < 16) left = 16;
      if (left + rect.width > viewportWidth - 16) {
        left = viewportWidth - rect.width - 16;
      }

      // Center vertically
      let top = (viewportHeight - rect.height) / 2;
      if (top < 16) top = 16;
      if (top + rect.height > viewportHeight - 16) {
        top = viewportHeight - rect.height - 16;
      }

      setPosition({ top, left });
    };

    positionTooltip();
    window.addEventListener('scroll', positionTooltip);
    window.addEventListener('resize', positionTooltip);

    return () => {
      window.removeEventListener('scroll', positionTooltip);
      window.removeEventListener('resize', positionTooltip);
    };
  }, []);

  return (
    <div
      ref={tooltipRef}
      role="tooltip"
      className="fixed z-50 p-6 bg-gray-900 text-white rounded-lg shadow-xl transition-all duration-200"
      style={{
        top: position.top,
        left: position.left,
        maxWidth: 'min(calc(100vw - 32px), 400px)',
        width: window.innerWidth <= 768 ? 'calc(100vw - 32px)' : 'auto'
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onTouchStart={onMouseEnter}
      onTouchEnd={onMouseLeave}
    >
      <div className="flex items-center justify-between gap-4 mb-4">
        <h3 className="text-base font-semibold">{escapeHtml(event.title)}</h3>
        <div className="flex items-center text-sm text-gray-300 whitespace-nowrap">
          <Clock className="h-4 w-4 mr-1.5" />
          <span>{format(event.start, 'h:mm a')}</span>
        </div>
      </div>

      {event.description && (
        <div className="text-sm text-gray-200 whitespace-pre-wrap break-words leading-relaxed mb-4">
          {createSafeHtml(event.description)}
        </div>
      )}

      {hasLocation && showLocation && (
        <div className="mt-4 flex items-center text-sm text-gray-200">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{escapeHtml(location)}</span>
        </div>
      )}

      {event.calendarName && (
        <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
          <p className="font-medium">{escapeHtml(event.calendarName)}</p>
          {event.creatorName && (
            <p className="mt-1 opacity-75">by {escapeHtml(event.creatorName)}</p>
          )}
        </div>
      )}
    </div>
  );
}