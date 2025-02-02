import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from '../utils/toast';

interface CalendarCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export function useCalendarCategory(categoryId?: string) {
  const [category, setCategory] = useState<CalendarCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setCategory(null);
      setLoading(false);
      return;
    }

    const fetchCategory = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('calendar_categories')
          .select('*')
          .eq('id', categoryId)
          .single();

        if (fetchError) {
          if (fetchError.code === 'PGRST116') {
            setError('Category not found');
          } else {
            setError('Failed to load category');
            toast.error('Failed to load category. Please try again.');
          }
          return;
        }

        setCategory(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching category:', err);
        setError('An unexpected error occurred');
        toast.error('Failed to load category. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    // Add retry logic
    let retries = 3;
    const attemptFetch = async () => {
      try {
        await fetchCategory();
      } catch (err) {
        if (retries > 0) {
          retries--;
          setTimeout(attemptFetch, 1000); // Wait 1 second before retrying
        }
      }
    };

    attemptFetch();
  }, [categoryId]);

  return { category, loading, error };
}