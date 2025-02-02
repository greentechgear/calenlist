import { PatternType } from '../lib/banner/patterns';

export interface CalendarBanner {
  id: string;
  name: string;
  color: string;
  textColor: string;
  pattern: PatternType;
}