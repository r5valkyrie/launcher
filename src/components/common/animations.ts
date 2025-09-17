import {
  animate,
  createTimeline,
  stagger
} from 'animejs';
import React from 'react';

// Animation configuration constants
export const ANIMATION_CONFIG = {
  duration: {
    fast: 200,
    normal: 400,
    slow: 600,
  },
  stagger: {
    small: 50,
    medium: 100,
    large: 150,
  }
};

// Common animation presets using proper anime.js v4+ syntax
export const animations = {
  // Fade in animations
  fadeIn: (element: string | Element | NodeListOf<Element>, delay = 0) => {
    if (!element) return;
    return animate(element, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outQuart',
      delay
    });
  },

  // Fade out animations
  fadeOut: (element: string | Element | NodeListOf<Element>, delay = 0) => {
    if (!element) return;
    return animate(element, {
      opacity: [1, 0],
      translateY: [0, -20],
      duration: ANIMATION_CONFIG.duration.fast,
      ease: 'outQuart',
      delay
    });
  },

  // Scale in (for modals, buttons)
  scaleIn: (element: string | Element | NodeListOf<Element>, delay = 0) => {
    if (!element) return;
    return animate(element, {
      scale: [0.8, 1],
      opacity: [0, 1],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outBack',
      delay
    });
  },

  // Slide in from left (for sidebar items)
  slideInLeft: (element: string | Element | NodeListOf<Element>, delay = 0) => {
    if (!element) return;
    return animate(element, {
      translateX: [-30, 0],
      opacity: [0, 1],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outQuart',
      delay
    });
  },

  // Slide in from right
  slideInRight: (element: string | Element | NodeListOf<Element>, delay = 0) => {
    if (!element) return;
    return animate(element, {
      translateX: [30, 0],
      opacity: [0, 1],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outQuart',
      delay
    });
  },

  // Staggered animations for lists
  staggerFadeIn: (elements: string | Element | NodeListOf<Element>, staggerDelay = ANIMATION_CONFIG.stagger.small) => {
    if (!elements) return;
    return animate(elements, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outQuart',
      delay: stagger(staggerDelay)
    });
  },

  // Button hover effects
  buttonHover: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      scale: 1.05,
      duration: ANIMATION_CONFIG.duration.fast,
      ease: 'outQuart'
    });
  },

  buttonHoverOut: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      scale: 1,
      duration: ANIMATION_CONFIG.duration.fast,
      ease: 'outQuart'
    });
  },

  // Pulse effect for important elements
  pulse: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      scale: [1, 1.1, 1],
      duration: ANIMATION_CONFIG.duration.slow,
      ease: 'inOutSine',
      loop: true
    });
  },

  // Shimmer effect for loading states
  shimmer: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      opacity: [0.6, 1, 0.6],
      duration: 1500,
      ease: 'inOutSine',
      loop: true
    });
  },

  // Hero banner entrance
  heroBannerEntrance: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      opacity: [0, 1],
      scale: [0.95, 1],
      duration: ANIMATION_CONFIG.duration.slow,
      ease: 'outQuart'
    });
  },

  // Tab navigation animations
  tabSlideIn: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      translateY: [10, 0],
      opacity: [0, 1],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outQuart'
    });
  },

  // Progress bar animations
  progressFill: (element: string | Element | NodeListOf<Element>, progress: number) => {
    if (!element) return;
    return animate(element, {
      width: `${progress}%`,
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outQuart'
    });
  },

  // Glass panel entrance
  glassPanelIn: (element: string | Element | NodeListOf<Element>, delay = 0) => {
    if (!element) return;
    return animate(element, {
      opacity: [0, 1],
      translateY: [30, 0],
      scale: [0.98, 1],
      duration: ANIMATION_CONFIG.duration.slow,
      ease: 'outQuart',
      delay
    });
  },

  // Modal animations
  modalIn: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      opacity: [0, 1],
      scale: [0.9, 1],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outBack'
    });
  },

  modalOut: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      opacity: [1, 0],
      scale: [1, 0.9],
      duration: ANIMATION_CONFIG.duration.fast,
      ease: 'outQuart'
    });
  },

  // Logo animations
  logoFloat: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      translateY: [-2, 2, -2],
      duration: 3000,
      ease: 'inOutSine',
      loop: true
    });
  },

  // Icon animations
  iconSpin: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      rotate: '1turn',
      duration: 1000,
      ease: 'inOutQuad'
    });
  },

  // Text typing effect
  typeWriter: (element: string | Element | NodeListOf<Element>, text: string) => {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el || el instanceof NodeList) return;
    
    const targetEl = el as HTMLElement;
    targetEl.textContent = '';
    
    return animate({ textLength: 0 }, {
      textLength: text.length,
      duration: text.length * 50,
      ease: 'linear',
      update: (animation: any) => {
        const currentLength = Math.floor(animation.progress * text.length / 100);
        targetEl.textContent = text.substring(0, currentLength);
      }
    });
  }
};

// Hook for React components to use animations on mount/unmount
export const useAnimationOnMount = (
  elementRef: React.RefObject<HTMLElement>,
  animationType: keyof typeof animations,
  delay = 0
) => {
  React.useEffect(() => {
    if (elementRef.current) {
      const animationFunc = animations[animationType] as any;
      if (typeof animationFunc === 'function') {
        animationFunc(elementRef.current, delay);
      }
    }
  }, [animationType, delay]);
};

// Utility to animate page transitions
export const pageTransition = {
  out: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      opacity: [1, 0],
      translateY: [0, -20],
      duration: ANIMATION_CONFIG.duration.fast,
      ease: 'outQuart'
    });
  },
  
  in: (element: string | Element | NodeListOf<Element>) => {
    if (!element) return;
    return animate(element, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: ANIMATION_CONFIG.duration.normal,
      ease: 'outQuart'
    });
  }
};

// Timeline utilities for complex animations
export const createAnimationTimeline = () => {
  return createTimeline();
};

// Export stagger for external use
export { stagger };
