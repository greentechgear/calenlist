import React, { useState, useEffect } from 'react';
import { Mail, AlertCircle, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function EmailVerificationBanner() {
  const { user, resendVerificationEmail } = useAuth();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  // Reset states when user changes
  useEffect(() => {
    setSending(false);
    setSent(false);
    setError(null);
    setDismissed(false);
  }, [user?.id]);

  // Don't show banner if:
  // 1. No user is logged in
  // 2. Email is already confirmed
  // 3. Banner was dismissed
  if (!user || user.email_confirmed_at || dismissed) {
    return null;
  }

  const handleResend = async () => {
    if (sending || sent) return;
    
    setSending(true);
    setError(null);
    try {
      await resendVerificationEmail();
      setSent(true);
      // Reset sent state after 1 minute
      setTimeout(() => setSent(false), 60000);
    } catch (err) {
      console.error('Error resending verification email:', err);
      setError('Failed to send verification email. Please try again later.');
      setSent(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-x-0 top-16 z-50">
      <div className={`${error ? 'bg-red-50' : 'bg-yellow-50'} p-2 sm:p-4 shadow-md`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Icon and Message */}
            <div className="flex items-center flex-1 min-w-0 space-x-2">
              <span className={`flex-shrink-0 ${error ? 'text-red-600' : 'text-yellow-600'}`}>
                {error ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <Mail className="h-5 w-5" />
                )}
              </span>
              <p className={`text-sm font-medium truncate ${error ? 'text-red-600' : 'text-yellow-600'}`}>
                {error ? error : (
                  sent 
                    ? 'Verification email sent!'
                    : 'Please verify your email'
                )}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleResend}
                disabled={sending || sent}
                className={`flex-shrink-0 px-3 py-1 text-sm font-medium rounded-md ${
                  error
                    ? 'text-red-600 bg-red-100 hover:bg-red-200'
                    : sent
                      ? 'text-green-600 bg-green-100'
                      : 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200'
                } disabled:opacity-50 transition-colors`}
              >
                {sending ? 'Sending...' : error ? 'Try again' : sent ? 'Sent!' : 'Resend'}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="flex-shrink-0 p-1 rounded-md hover:bg-yellow-100 transition-colors"
                aria-label="Dismiss"
              >
                <X className={`h-5 w-5 ${error ? 'text-red-600' : 'text-yellow-600'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}