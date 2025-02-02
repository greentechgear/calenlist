import React from 'react';
import { useCalendarCategory } from '../hooks/useCalendarCategory';

interface CategoryBadgeProps {
  categoryId?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function CategoryBadge({ categoryId, size = 'md' }: CategoryBadgeProps) {
  const { category } = useCalendarCategory(categoryId);
  
  if (!category) return null;

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: `${category.color}15`,
        color: category.color
      }}
    >
      {category.name}
    </span>
  );
}