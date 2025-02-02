import React from 'react';
import { CreditCard, Ticket } from 'lucide-react';

interface PaymentInfoProps {
  paymentType?: 'free' | 'subscription' | 'one_time';
  subscriptionPriceCents?: number | null;
  eventPriceCents?: number | null;
  className?: string;
}

export default function PaymentInfo({ 
  paymentType = 'free', 
  subscriptionPriceCents, 
  eventPriceCents,
  className = ''
}: PaymentInfoProps) {
  // Only show payment info for paid options
  if (paymentType === 'subscription' && subscriptionPriceCents) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium ${className}`}>
        <CreditCard className="h-4 w-4" />
        <span>${subscriptionPriceCents / 100}/month</span>
      </div>
    );
  }

  if (paymentType === 'one_time' && eventPriceCents) {
    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium ${className}`}>
        <Ticket className="h-4 w-4" />
        <span>${eventPriceCents / 100}/event</span>
      </div>
    );
  }

  // Don't render anything for free calendars
  return null;
}