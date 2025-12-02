import React, { useEffect, useRef } from 'react';

type SnowEffectProps = {
  enabled: boolean;
};

export default function SnowEffect({ enabled }: SnowEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const lightsRef = useRef<HTMLDivElement>(null);

  // Snowflake varieties for more visual interest
  const snowflakeChars = ['❄', '❅', '❆', '✦', '✧', '•'];

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const snowflakes: HTMLDivElement[] = [];
    const snowflakeCount = 60;

    // Create snowflakes with variety
    for (let i = 0; i < snowflakeCount; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      // Mix of snowflake types - mostly regular snowflakes, some sparkles
      const charIndex = Math.random() > 0.7 ? Math.floor(Math.random() * snowflakeChars.length) : 0;
      snowflake.innerHTML = snowflakeChars[charIndex];
      snowflake.style.left = `${Math.random() * 100}%`;
      snowflake.style.animationDuration = `${Math.random() * 12 + 8}s`;
      snowflake.style.animationDelay = `${Math.random() * 10}s`;
      snowflake.style.fontSize = `${Math.random() * 12 + 6}px`;
      snowflake.style.opacity = `${Math.random() * 0.5 + 0.3}`;
      // Add slight horizontal sway variation
      snowflake.style.setProperty('--sway', `${Math.random() * 80 - 40}px`);
      container.appendChild(snowflake);
      snowflakes.push(snowflake);
    }

    // Cleanup
    return () => {
      snowflakes.forEach(sf => sf.remove());
    };
  }, [enabled]);

  // Create string lights
  useEffect(() => {
    if (!enabled || !lightsRef.current) return;

    const container = lightsRef.current;
    const lights: HTMLDivElement[] = [];
    const lightCount = 20;
    const colors = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#ff8a5c', '#a8e6cf', '#ff6b9d'];

    for (let i = 0; i < lightCount; i++) {
      const light = document.createElement('div');
      light.className = 'holiday-light';
      light.style.left = `${(i / lightCount) * 100 + 2}%`;
      light.style.backgroundColor = colors[i % colors.length];
      light.style.setProperty('--glow-color', colors[i % colors.length]);
      light.style.animationDelay = `${(i * 0.15)}s`;
      container.appendChild(light);
      lights.push(light);

      // Add wire segment
      if (i < lightCount - 1) {
        const wire = document.createElement('div');
        wire.className = 'holiday-wire';
        wire.style.left = `${(i / lightCount) * 100 + 2 + (50 / lightCount)}%`;
        wire.style.width = `${100 / lightCount}%`;
        container.appendChild(wire);
        lights.push(wire);
      }
    }

    return () => {
      lights.forEach(l => l.remove());
    };
  }, [enabled]);

  // Check if it's December
  const isDecember = new Date().getMonth() === 11;

  if (!enabled || !isDecember) return null;

  return (
    <>
      {/* Snow container */}
      <div 
        ref={containerRef} 
        className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
        aria-hidden="true"
      />
      
      {/* String lights at top */}
      <div 
        ref={lightsRef}
        className="fixed top-0 left-0 right-0 h-12 pointer-events-none z-[99] overflow-visible"
        aria-hidden="true"
      />

      {/* Festive corner decorations */}
      <div className="fixed top-4 left-4 pointer-events-none z-[98] opacity-60" aria-hidden="true">
        <div className="holiday-holly">🎄</div>
      </div>
      <div className="fixed top-4 right-16 pointer-events-none z-[98] opacity-60" aria-hidden="true">
        <div className="holiday-holly">🎁</div>
      </div>

      {/* Subtle festive vignette */}
      <div 
        className="fixed inset-0 pointer-events-none z-[97]"
        style={{
          background: 'radial-gradient(ellipse at top left, rgba(239, 68, 68, 0.03) 0%, transparent 50%), radial-gradient(ellipse at top right, rgba(34, 197, 94, 0.03) 0%, transparent 50%)',
        }}
        aria-hidden="true"
      />

      <style>{`
        .snowflake {
          position: absolute;
          top: -20px;
          color: white;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.6), 0 0 15px rgba(200, 220, 255, 0.4);
          animation: snowfall linear infinite;
          will-change: transform;
          filter: drop-shadow(0 0 2px rgba(255, 255, 255, 0.5));
        }

        @keyframes snowfall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          50% {
            transform: translateY(50vh) rotate(180deg) translateX(var(--sway, 30px));
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(calc(var(--sway, 30px) * -1));
            opacity: 0;
          }
        }

        /* String lights */
        .holiday-light {
          position: absolute;
          top: 8px;
          width: 10px;
          height: 14px;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          animation: lightTwinkle 2s ease-in-out infinite;
          box-shadow: 
            0 0 10px var(--glow-color),
            0 0 20px var(--glow-color),
            0 0 30px var(--glow-color);
          filter: brightness(1.2);
        }

        .holiday-light::before {
          content: '';
          position: absolute;
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 6px;
          background: #2a2f36;
          border-radius: 2px 2px 0 0;
        }

        .holiday-wire {
          position: absolute;
          top: 6px;
          height: 2px;
          background: linear-gradient(90deg, #1a1f24, #2a3038, #1a1f24);
          border-radius: 1px;
        }

        @keyframes lightTwinkle {
          0%, 100% {
            opacity: 1;
            filter: brightness(1.2);
          }
          50% {
            opacity: 0.7;
            filter: brightness(0.9);
          }
        }

        /* Holiday decorations */
        .holiday-holly {
          font-size: 24px;
          animation: hollyBob 3s ease-in-out infinite;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        @keyframes hollyBob {
          0%, 100% {
            transform: translateY(0) rotate(-5deg);
          }
          50% {
            transform: translateY(3px) rotate(5deg);
          }
        }

        /* Optional: Add festive accent to buttons when holiday mode is on */
        .holiday-accent {
          position: relative;
        }
        .holiday-accent::after {
          content: '';
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: linear-gradient(135deg, #ef4444, #22c55e);
          border-radius: 50%;
          animation: accentPulse 2s ease-in-out infinite;
        }

        @keyframes accentPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </>
  );
}

