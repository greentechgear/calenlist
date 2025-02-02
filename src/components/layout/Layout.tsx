import React from 'react';
import Navigation from './Navigation';
import Footer from './Footer';
import EmailVerificationBanner from '../notifications/EmailVerificationBanner';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <EmailVerificationBanner />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}