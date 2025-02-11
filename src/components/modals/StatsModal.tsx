import React, { useState, useEffect } from 'react';
import { X, Download, Users, MessageSquare } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { fetchSubscribers } from '../../services/subscriberService';
import { fetchEventFeedback } from '../../services/feedbackService';
import { downloadCsv } from '../../utils/csvUtils';

interface StatsModalProps {
  calendarId: string;
  isOpen: boolean;
  onClose: () => void;
}

type Tab = 'subscribers' | 'feedback';

interface Subscriber {
  email: string;
  display_name: string;
  subscribed_at: string;
}

interface EventFeedback {
  event_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: {
    display_name?: string;
  } | null;
}

export default function StatsModal({ calendarId, isOpen, onClose }: StatsModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('subscribers');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [feedback, setFeedback] = useState<EventFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'subscribers') {
        const data = await fetchSubscribers(calendarId);
        setSubscribers(data);
      } else {
        const data = await fetchEventFeedback(calendarId);
        setFeedback(data);
      }
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (activeTab === 'subscribers') {
      downloadCsv(subscribers, `calendar-subscribers-${calendarId}`);
    } else {
      downloadCsv(feedback, `calendar-feedback-${calendarId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Calendar Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex">
            <button
              onClick={() => setActiveTab('subscribers')}
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'subscribers'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Subscribers
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 font-medium text-sm flex items-center ${
                activeTab === 'feedback'
                  ? 'border-b-2 border-purple-500 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Event Feedback
            </button>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Actions bar */}
          <div className="flex justify-between items-center p-4 border-b bg-white">
            <p className="text-gray-600">
              {activeTab === 'subscribers' 
                ? `Total Subscribers: ${subscribers.length}`
                : `Total Feedback: ${feedback.length}`}
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Download CSV
            </button>
          </div>

          {/* Table container */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : activeTab === 'subscribers' ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscribed At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {subscribers.map((subscriber, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscriber.display_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {subscriber.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(subscriber.subscribed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Event
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {feedback.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.event_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.profiles?.display_name || 'Anonymous'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.rating}/5
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.comment || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}