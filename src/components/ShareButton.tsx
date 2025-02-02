import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

interface ShareButtonProps {
  url: string;
}

export default function ShareButton({ url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Calendar Share',
          url: url
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white/10 backdrop-blur-sm rounded-md hover:bg-white/20 transition-colors"
      title="Share calendar"
    >
      {copied ? (
        <Check className="h-4 w-4 mr-1.5" />
      ) : navigator.share ? (
        <Share2 className="h-4 w-4 mr-1.5" />
      ) : (
        <Copy className="h-4 w-4 mr-1.5" />
      )}
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}