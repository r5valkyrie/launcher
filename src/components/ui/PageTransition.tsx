import React, { useEffect, useRef, useState } from 'react';
import { animations } from '../common/animations';

type PageTransitionProps = {
  children: React.ReactNode;
  pageKey: string;
  className?: string;
  staggerContent?: boolean;
};

export default function PageTransition({ 
  children, 
  pageKey, 
  className = '', 
  staggerContent = false 
}: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentKey, setCurrentKey] = useState(pageKey);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (pageKey !== currentKey && !isTransitioning) {
      setIsTransitioning(true);
      
      // Add enter animation
      if (containerRef.current) {
        // Reset any existing animations
        containerRef.current.classList.remove('page-enter', 'page-exit');
        
        // Trigger reflow to ensure classes are removed
        containerRef.current.offsetHeight;
        
        // Add entrance animation
        containerRef.current.classList.add('page-enter');
        
        // Optional: Add anime.js enhancement
        try {
          animations.glassPanelIn(containerRef.current, 0);
        } catch (error) {
          console.warn('Page transition animation error:', error);
        }
      }
      
      setCurrentKey(pageKey);
      
      // Reset transition state after animation completes
      setTimeout(() => {
        setIsTransitioning(false);
        if (containerRef.current) {
          containerRef.current.classList.remove('page-enter');
        }
      }, 350);
    }
  }, [pageKey, currentKey, isTransitioning]);

  const baseClasses = `page-transition-container ${className}`;
  const contentClasses = staggerContent ? 'content-stagger' : '';

  return (
    <div 
      ref={containerRef}
      className={baseClasses}
      key={currentKey}
    >
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
}
