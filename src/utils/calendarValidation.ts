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
      commonRules.required(),
      commonRules.maxLength(100, 'Calendar name must be 100 characters or less')
    ],
    description: [
      commonRules.maxLength(200, 'Description must be 200 characters or less')
    ],
    categoryId: [
      commonRules.required('Please select a category')
    ]
  };

  // Add URL validation if not skipped
  if (!data.skipUrlValidation) {
    rules['googleCalendarUrl'] = [
      commonRules.required('Calendar URL is required'),
      commonRules.calendarUrl()
    ];
  }

  // Add demo video validation if provided
  if (data.demoVideoUrl) {
    rules['demoVideoUrl'] = [commonRules.youtubeUrl()];
  }

  return validateForm(data, rules);
}