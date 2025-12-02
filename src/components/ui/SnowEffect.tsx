import React, { useEffect, useRef } from 'react';

type SnowEffectProps = {
  enabled: boolean;
};

export default function SnowEffect({ enabled }: SnowEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const snowflakes: HTMLDivElement[] = [];
    const snowflakeCount = 50;

    // Create snowflakes
    for (let i = 0; i < snowflakeCount; i++) {
      const snowflake = document.createElement('div');
      snowflake.className = 'snowflake';
      snowflake.innerHTML = '❄';
      snowflake.style.left = `${Math.random() * 100}%`;
      snowflake.style.animationDuration = `${Math.random() * 10 + 10}s`;
      snowflake.style.animationDelay = `${Math.random() * 10}s`;
      snowflake.style.fontSize = `${Math.random() * 10 + 8}px`;
      snowflake.style.opacity = `${Math.random() * 0.6 + 0.2}`;
      container.appendChild(snowflake);
      snowflakes.push(snowflake);
    }

    // Cleanup
    return () => {
      snowflakes.forEach(sf => sf.remove());
    };
  }, [enabled]);

  // Check if it's December
  const isDecember = new Date().getMonth() === 11; // 0-indexed, so 11 = December

  if (!enabled || !isDecember) return null;

  return (
    <>
      <div 
        ref={containerRef} 
        className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
        aria-hidden="true"
      />
      <style>{`
        .snowflake {
          position: absolute;
          top: -20px;
          color: white;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
          animation: snowfall linear infinite;
          will-change: transform;
        }

        @keyframes snowfall {
          0% {
            transform: translateY(-20px) rotate(0deg) translateX(0px);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg) translateX(50px);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}

