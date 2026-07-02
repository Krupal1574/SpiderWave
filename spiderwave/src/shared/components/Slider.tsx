import React, { useRef, useState, useEffect } from 'react';
import { cn } from '../utils/cn';

interface SliderProps {
  value: number; // 0.0 to 1.0 or exact value
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: (value: number) => void;
  className?: string;
  trackClassName?: string;
  fillClassName?: string;
  thumbClassName?: string;
  disabled?: boolean;
}

export function Slider({
  value,
  min = 0,
  max = 1,
  onChange,
  onDragStart,
  onDragEnd,
  className,
  trackClassName,
  fillClassName,
  thumbClassName,
  disabled = false,
}: SliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync local state if not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const calculateValue = (clientX: number) => {
    if (!trackRef.current) return min;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    return min + percentage * (max - min);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
    onDragStart?.();
    const newValue = calculateValue(e.clientX);
    setLocalValue(newValue);
    onChange?.(newValue);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: PointerEvent) => {
      e.preventDefault();
      const newValue = calculateValue(e.clientX);
      setLocalValue(newValue);
      onChange?.(newValue);
    };

    const handlePointerUp = (e: PointerEvent) => {
      setIsDragging(false);
      const newValue = calculateValue(e.clientX);
      onDragEnd?.(newValue);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDragging, min, max, onChange, onDragEnd]);

  const percentage = Math.max(0, Math.min(((localValue - min) / (max - min)) * 100, 100));

  return (
    <div
      className={cn("relative flex items-center group w-full py-2", disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer", className)}
      onPointerDown={handlePointerDown}
    >
      <div 
        ref={trackRef}
        className={cn("h-1.5 w-full bg-surface-hover rounded-full overflow-hidden relative", trackClassName)}
      >
        <div
          className={cn("absolute inset-y-0 left-0 bg-text-primary group-hover:bg-primary transition-colors", fillClassName)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div
        className={cn(
          "absolute h-3 w-3 bg-primary rounded-full shadow transition-opacity",
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          thumbClassName
        )}
        style={{ left: `calc(${percentage}% - 6px)` }}
      />
    </div>
  );
}
