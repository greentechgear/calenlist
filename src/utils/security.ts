// Helper functions for security-related operations
import React from 'react';

// Whitelist of allowed URL protocols
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

// Whitelist of allowed URL domains for external links
const ALLOWED_DOMAINS = [
  'calendar.google.com',
  'meet.google.com',
  'zoom.us',
  'teams.microsoft.com',
  'youtube.com',
  'youtu.be',
  'docs.google.com',
  'drive.google.com'
];

/**
 * Safely escape HTML to prevent XSS
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validate and sanitize URLs
 */
export function sanitizeUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(urlObj.protocol)) {
      console.warn('Blocked URL with disallowed protocol:', urlObj.protocol);
      return null;
    }

    // Check domain
    const domain = urlObj.hostname.replace(/^www\./, '');
    if (!ALLOWED_DOMAINS.some(allowed => domain.endsWith(allowed))) {
      console.warn('Blocked URL with disallowed domain:', domain);
      return null;
    }

    // Remove any username/password
    urlObj.username = '';
    urlObj.password = '';
    
    // Remove fragments
    urlObj.hash = '';

    // Encode query parameters
    urlObj.search = Array.from(urlObj.searchParams.entries())
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');

    return urlObj.toString();
  } catch (error) {
    console.warn('Invalid URL:', error);
    return null;
  }
}

type SafeContent = string | JSX.Element;

/**
 * Create safe HTML from text with URLs
 */
export function createSafeHtml(text: string): SafeContent[] {
  const escapedText = escapeHtml(text);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = escapedText.split(urlRegex);

  const result: SafeContent[] = [];

  parts.forEach((part, index) => {
    if (part.match(urlRegex)) {
      const safeUrl = sanitizeUrl(part);
      if (safeUrl) {
        result.push(
          React.createElement('a', {
            key: `link-${index}`,
            href: safeUrl,
            target: '_blank',
            rel: 'noopener noreferrer nofollow',
            className: 'text-blue-300 hover:text-blue-200 underline',
            onClick: (e: React.MouseEvent) => e.stopPropagation(),
            children: part
          })
        );
      } else {
        result.push(part);
      }
    } else {
      // Handle line breaks
      const lines = part.split('\n');
      lines.forEach((line, lineIndex) => {
        if (lineIndex > 0) {
          result.push(React.createElement('br', { key: `br-${index}-${lineIndex}` }));
        }
        result.push(line);
      });
    }
  });

  return result;
}