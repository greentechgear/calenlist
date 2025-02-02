import React from 'react';
import { X } from 'lucide-react';

interface DeleteCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  calendarName: string;
  isDeleting: boolean;
}

export default function DeleteCalendarModal({
  isOpen,
  onClose,
  onConfirm,
  calendarName,
  isDeleting
}: DeleteCalendarModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold text-red-600">Delete Calendar</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isDeleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Are you sure you want to delete <span className="font-semibold">{calendarName}</span>? 
            This action cannot be undone and will remove all associated data including subscriptions.
          </p>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete Calendar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}