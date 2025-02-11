import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Mail } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import SEO from '../components/SEO';

export default function CalendarShare() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [calendar, setCalendar] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCalendar();
    }
  }, [id]);

  const fetchCalendar = async () => {
    try {
      const { data, error } = await supabase
        .from('calendars')
        .select(`
          *,
          profiles!calendars_user_id_fkey(display_name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setCalendar(data);
    } catch (err) {
      console.error('Error fetching calendar:', err);
      setError('Calendar not found');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    const params = new URLSearchParams({
      signup: 'true',
      returnTo: `/calendar/${id}`,
      calendarId: id
    });
    navigate(`/login?${params.toString()}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error || !calendar) {
    return <div>Calendar not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <SEO 
        title={`Join ${calendar.name}`}
        description={`Subscribe to ${calendar.name} and stay updated with their events`}
      />

      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <CalendarIcon className="h-16 w-16 text-purple-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Join {calendar.name}
          </h1>
          
          {calendar.profiles?.display_name && (
            <p className="text-gray-600">
              by {calendar.profiles.display_name}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {user ? (
            <button
              onClick={() => navigate(`/calendar/${id}`)}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <CalendarIcon className="h-5 w-5 mr-2" />
              View Calendar
            </button>
          ) : (
            <button
              onClick={handleSignUp}
              className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Mail className="h-5 w-5 mr-2" />
              Sign up to Subscribe
            </button>
          )}

          <p className="text-sm text-gray-500 text-center">
            {user 
              ? "You'll be able to subscribe to this calendar after viewing it"
              : "Create an account to subscribe and stay updated with events"}
          </p>
        </div>
      </div>
    </div>
  );
}