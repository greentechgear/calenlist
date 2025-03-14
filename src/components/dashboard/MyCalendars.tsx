import { Calendar } from '../../types/calendar';
import TopCalendars from '../home/TopCalendars';

interface MyCalendarsProps {
  calendars: Calendar[];
  onUpdate: () => void;
}

export default function MyCalendars({ calendars }: MyCalendarsProps) {
  if (!calendars.length) return null;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">My Calendars</h2>
      <TopCalendars 
        calendars={calendars} 
        title="" // Empty title since we already have the heading above
      />
    </div>
  );
}