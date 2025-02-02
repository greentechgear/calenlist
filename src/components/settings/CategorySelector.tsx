import React from 'react';
import { useCalendarCategories } from '../../hooks/useCalendarCategories';

interface CategorySelectorProps {
  selectedId?: string;
  onChange: (categoryId: string) => void;
  className?: string;
}

export default function CategorySelector({ selectedId, onChange, className = '' }: CategorySelectorProps) {
  const { categories, loading } = useCalendarCategories();

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {categories.map(category => (
        <button
          key={category.id}
          type="button"
          onClick={() => onChange(category.id)}
          className={`p-3 text-sm rounded-md border transition-colors ${
            selectedId === category.id
              ? 'border-2'
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
  );
}