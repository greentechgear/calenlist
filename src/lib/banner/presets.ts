import { CalendarBanner } from '../../types/banner';
import { PatternType } from './patterns';

export const bannerPresets: CalendarBanner[] = [
  {
    id: 'indigo-waves',
    name: 'Indigo Waves',
    color: '#EEF2FF',
    textColor: '#4F46E5',
    pattern: 'waves'
  },
  {
    id: 'emerald-dots',
    name: 'Emerald Dots',
    color: '#ECFDF5',
    textColor: '#059669',
    pattern: 'dots'
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    color: '#FFF7ED',
    textColor: '#EA580C',
    pattern: 'circles'
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    color: '#FFF1F2',
    textColor: '#E11D48',
    pattern: 'honeycomb'
  },
  {
    id: 'amber-sunset',
    name: 'Amber Sunset',
    color: '#FFFBEB',
    textColor: '#D97706',
    pattern: 'waves'
  },
  {
    id: 'violet-night',
    name: 'Violet Night',
    color: '#FAF5FF',
    textColor: '#9333EA',
    pattern: 'zigzag'
  },
  {
    id: 'arctic-frost',
    name: 'Arctic Frost',
    color: '#F0F9FF',
    textColor: '#0369A1',
    pattern: 'diagonal'
  },
  {
    id: 'sage-meadow',
    name: 'Sage Meadow',
    color: '#ECFDF5', // Brighter, more vibrant base
    textColor: '#15803D', // Richer green for better contrast
    pattern: 'honeycomb' // Changed from crosses to honeycomb for more visual interest
  }
];

// Get a random banner preset
export function getRandomBanner(): CalendarBanner {
  return bannerPresets[Math.floor(Math.random() * bannerPresets.length)];
}

// Get default banner
export function getDefaultBanner(): CalendarBanner {
  return bannerPresets[0];
}