import { CalendarBanner } from '../../types/banner';

// Define pattern types
export type PatternType = 
  | 'dots'
  | 'lines'
  | 'waves'
  | 'circles'
  | 'crosses'
  | 'diagonal'
  | 'zigzag'
  | 'honeycomb'
  | 'grid'
  | 'checkerboard'
  | 'triangles'
  | 'topography'
  | 'noise'
  | 'circuit'
  | 'none';

// SVG patterns encoded as data URLs
export const patterns: Record<PatternType, string> = {
  dots: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='2' fill='currentColor' fill-opacity='0.1'/%3E%3C/svg%3E")`,

  lines: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40' stroke='currentColor' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E")`,

  waves: `url("data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q25 20 50 10 T100 10' stroke='currentColor' fill='none' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E")`,

  grid: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='20' height='20' fill='none' stroke='currentColor' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E")`,

  checkerboard: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='10' height='10' fill='currentColor' fill-opacity='0.1'/%3E%3Crect x='10' y='10' width='10' height='10' fill='currentColor' fill-opacity='0.1'/%3E%3C/svg%3E")`,

  triangles: `url("data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='0,20 10,0 20,20' fill='currentColor' fill-opacity='0.1'/%3E%3C/svg%3E")`,

  topography: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,30 C10,10 30,10 40,30 S70,50 80,30' stroke='currentColor' fill='none' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E")`,

  noise: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence baseFrequency='0.9' numOctaves='2' result='noise'/><feColorMatrix type='matrix' values='0 0 0 0.1 0 0 0 0 0.1 0 0 0 0 0.1 0 0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/%3E%3C/svg%3E")`,

  circuit: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0h10v10H10zm20 10h10v10H30zM10 20h10v10H10zM40 30h10v10H40zM20 40h10v10H20z' stroke='currentColor' fill='none' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E")`,

  honeycomb: `url("data:image/svg+xml,%3Csvg width='56' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50L28 66L28 100' fill='none' stroke='currentColor' stroke-opacity='0.1' stroke-width='1'/%3E%3Cpath d='M28 0L28 34L0 50L0 84L28 100L56 84L56 50L28 34' fill='none' stroke='currentColor' stroke-opacity='0.1' stroke-width='1'/%3E%3C/svg%3E")`,

  none: 'none'
};

// Get pattern URL for a given type
export function getBannerPattern(pattern: PatternType = 'none'): string {
  return patterns[pattern] || patterns.none;
}

// Get background style object for a banner
export function getBannerBackground(banner: CalendarBanner) {
  return {
    backgroundColor: banner.color,
    backgroundImage: getBannerPattern(banner.pattern),
    color: banner.textColor,
  };
}