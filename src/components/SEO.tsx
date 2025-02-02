import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  type?: 'website' | 'article';
  image?: string;
  noindex?: boolean;
}

export default function SEO({ 
  title, 
  description = 'Share your calendar with the world and let others subscribe to your events.',
  type = 'website',
  image = 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&w=1200&h=630&q=80',
  noindex = false
}: SEOProps) {
  // Only append site name if it's not already the full site name
  const siteTitle = 'Calenlist.com - Share your calendar, build your community';
  const fullTitle = title === siteTitle ? title : `${title} | Calenlist.com`;

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

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
}