import { validateForm, commonRules } from './validation';

interface CalendarFormData {
  name: string;
  description: string;
  googleCalendarUrl: string;
  categoryId: string;
  demoVideoUrl: string;
  skipUrlValidation?: boolean;
}

export function validateCalendarForm(data: CalendarFormData): Record<string, string> {
  const rules = {
    name: [
      commonRules.required('Calendar name is required'),
      commonRules.maxLength(100, 'Calendar name must be 100 characters or less')
    ],
    description: [
      commonRules.maxLength(200, 'Description must be 200 characters or less')
    ],
    categoryId: [
      commonRules.required('Please select a category')
    ]
  };

  // Only validate URL if not skipping URL validation
  if (!data.skipUrlValidation && data.googleCalendarUrl) {
    rules['googleCalendarUrl'] = [commonRules.calendarUrl()];
  }

  // Add demo video validation if provided
  if (data.demoVideoUrl) {
    rules['demoVideoUrl'] = [commonRules.videoUrl()];
  }

  return validateForm(data, rules);
}