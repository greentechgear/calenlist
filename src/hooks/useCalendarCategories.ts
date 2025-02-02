import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface CalendarCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export function useCalendarCategories() {
  const [categories, setCategories] = useState<CalendarCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('calendar_categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch categories');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
}