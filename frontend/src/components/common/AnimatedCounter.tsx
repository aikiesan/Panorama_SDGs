import { useState, useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatter?: (value: number) => string;
}

/**
 * A simple component that animates a numeric value from its previous state to a new one.
 */
export default function AnimatedCounter({ 
  value, 
  duration = 800, 
  formatter = (v) => Math.floor(v).toLocaleString() 
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Stop any current animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    startValueRef.current = countRef.current;
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
      
      // Easing function (outQuart)
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      const currentCount = startValueRef.current + (value - startValueRef.current) * easeProgress;
      
      countRef.current = currentCount;
      setCount(currentCount);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  return <span>{formatter(count)}</span>;
}
