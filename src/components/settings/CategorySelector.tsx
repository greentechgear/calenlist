import React from 'react';
import { useCalendarCategories } from '../../hooks/useCalendarCategories';

interface CategorySelectorProps {
  selectedId?: string;
  onChange: (categoryId: string) => void;
  className?: string;
  error?: string;
}

export default function CategorySelector({ selectedId, onChange, className = '', error }: CategorySelectorProps) {
  const { categories, loading } = useCalendarCategories();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {categories.map(category => (
          <button
            key={category.id}
            type="button"
            onClick={() => onChange(category.id)}
            className={`p-3 text-sm rounded-md border-2 transition-colors ${
              selectedId === category.id
                ? ''
                : error
                ? 'border-red-200 hover:border-red-300'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            style={{
              borderColor: selectedId === category.id ? category.color : undefined,
              backgroundColor: selectedId === category.id ? `${category.color}10` : undefined
            }}
          >
            <span 
              className="block text-center font-medium"
              style={{ color: category.color }}
            >
              {category.name}
            </span>
          </button>
        ))}
      </div>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}