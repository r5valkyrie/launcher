import React, { useEffect, useRef, useState } from 'react';

type ListItemWrapperProps = {
  children: React.ReactNode;
  itemKey: string | number;
  type?: 'news' | 'mod' | 'generic';
  className?: string;
  delay?: number;
};

export default function ListItemWrapper({ 
  children, 
  itemKey, 
  type = 'generic',
  className = '',
  delay = 0
}: ListItemWrapperProps) {
  const itemRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(true);

  useEffect(() => {
    // Add a small delay to trigger the animation after the element is in the DOM
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      if (itemRef.current && shouldAnimate) {
        // Store original spacing values as CSS custom properties
        const computedStyle = window.getComputedStyle(itemRef.current);
        const element = itemRef.current;
        
        element.style.setProperty('--original-padding-top', computedStyle.paddingTop);
        element.style.setProperty('--original-padding-bottom', computedStyle.paddingBottom);
        element.style.setProperty('--original-margin-top', computedStyle.marginTop);
        element.style.setProperty('--original-margin-bottom', computedStyle.marginBottom);
        
        // Add entrance animation class
        const animationClass = type === 'news' ? 'news-item-enter' : 
                              type === 'mod' ? 'mod-item-enter' : 
                              'list-item-enter';
        
        element.classList.add(animationClass);
        
        // Remove animation class after animation completes
        setTimeout(() => {
          element.classList.remove(animationClass);
          setShouldAnimate(false);
        }, type === 'news' ? 600 : type === 'mod' ? 400 : 500);
      }
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [itemKey, type, delay, shouldAnimate]);

  const baseClasses = `list-item-wrapper ${className}`;

  return (
    <div 
      ref={itemRef}
      className={baseClasses}
      data-item-key={itemKey}
      style={{ opacity: isVisible ? undefined : 0 }}
    >
      {children}
    </div>
  );
}

// Hook to add list animations to existing components
export const useListAnimation = (
  items: any[], 
  type: 'news' | 'mod' | 'generic' = 'generic'
) => {
  const prevItemsRef = useRef<any[]>([]);
  const [newItems, setNewItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    const prevItems = prevItemsRef.current;
    const currentItemIds = items.map(item => item.id || item.key || item.name || JSON.stringify(item));
    const prevItemIds = prevItems.map(item => item.id || item.key || item.name || JSON.stringify(item));
    
    // Find newly added items
    const addedItems = currentItemIds.filter(id => !prevItemIds.includes(id));
    
    if (addedItems.length > 0) {
      setNewItems(new Set(addedItems));
      
      // Clear the new items set after animations complete
      setTimeout(() => {
        setNewItems(new Set());
      }, type === 'news' ? 600 : type === 'mod' ? 400 : 500);
    }
    
    prevItemsRef.current = items;
  }, [items, type]);

  return {
    isNewItem: (item: any) => {
      const itemId = item.id || item.key || item.name || JSON.stringify(item);
      return newItems.has(itemId);
    },
    getAnimationClass: (item: any) => {
      if (!newItems.has(item.id || item.key || item.name || JSON.stringify(item))) return '';
      return type === 'news' ? 'news-item-enter' : 
             type === 'mod' ? 'mod-item-enter' : 
             'list-item-enter';
    }
  };
};
