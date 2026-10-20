'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

type StarRatingProps = {
  value: number | null;
  max?: number;
  size?: number;
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
};

export function StarRating({
  value,
  max = 5,
  size = 18,
  readOnly = false,
  onChange,
  className,
}: StarRatingProps) {
  const current = value ?? 0;
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const idx = i + 1;
        const filled = idx <= current;
        return (
          <button
            key={idx}
            type="button"
            disabled={readOnly}
            onClick={() => !readOnly && onChange?.(idx)}
            className={cn(
              'transition-transform',
              !readOnly && 'hover:scale-110 active:scale-95'
            )}
            aria-label={`${idx} étoile${idx > 1 ? 's' : ''}`}
          >
            <Star
              style={{ width: size, height: size }}
              className={cn(
                filled
                  ? 'fill-[hsl(var(--amber))] text-[hsl(var(--amber))]'
                  : 'text-muted-foreground/40'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
