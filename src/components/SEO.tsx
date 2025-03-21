import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  type?: 'website' | 'article';
  image?: string;
  noindex?: boolean;
  url?: string;
  isCalendarPage?: boolean;
}

export default function SEO({ 
  title, 
  description = 'Share your calendar with the world and let others subscribe to your events.',
  type = 'website',
  image = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&h=630&q=80',
  noindex = false,
  url,
  isCalendarPage = false
}: SEOProps) {
  // For calendar pages, use the calendar name as the main title
  // For other pages, append the site name unless it's already the full site name
  const siteTitle = 'Calenlist.com - Share your calendar, build your community';
  const fullTitle = isCalendarPage 
    ? title 
    : title === siteTitle ? title : `${title} | Calenlist.com`;

  const currentUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Basic */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex && <meta name="robots" content="noindex" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:site_name" content="Calenlist.com" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@calenlist" />

      {/* Additional social media */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_US" />

      {/* Slack */}
      <meta name="slack-app-id" content="A08GAEJP9CM" />
    </Helmet>
  );
}