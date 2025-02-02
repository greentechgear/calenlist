import { CalendarBanner } from '../../types/banner';
import { patterns } from './patterns';
import { bannerPresets } from './presets';

export function getBannerPattern(pattern: CalendarBanner['pattern'] = 'none'): string {
  return patterns[pattern] || patterns.none;
}

export function getDefaultBanner(): CalendarBanner {
  return bannerPresets[0];
}

export function getBannerStyle(banner?: CalendarBanner | null) {
  if (!banner) {
    const defaultBanner = getDefaultBanner();
    return {
      backgroundColor: defaultBanner.color,
      color: defaultBanner.textColor,
    };
  }

  return {
    backgroundColor: banner.color,
    backgroundImage: getBannerPattern(banner.pattern),
    color: banner.textColor,
  };
}