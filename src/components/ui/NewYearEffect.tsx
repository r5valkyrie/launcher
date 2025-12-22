import React, { useEffect, useRef, useState } from 'react';

type NewYearEffectProps = {
  enabled: boolean;
};

const NEW_YEAR_MESSAGES = [
  "Happy New Year!",
  "Cheers to 2026!",
  "New Year, New Games!",
  "Level Up in 2026!",
  "Welcome 2026!",
  "Celebrate!",
  "Let's Go 2026!",
];

export default function NewYearEffect({ enabled }: NewYearEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const fireworksRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<HTMLDivElement>(null);

  // Confetti shapes and colors
  const confettiColors = ['#FFD700', '#FF1493', '#00CED1', '#FF4500', '#9370DB', '#32CD32'];
  const confettiShapes = ['◆', '●', '■', '▲', '★'];

  // Floating confetti effect
  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const confettiPieces: HTMLDivElement[] = [];
    const confettiCount = 80;

    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'new-year-confetti';
      confetti.innerHTML = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      confetti.style.animationDuration = `${Math.random() * 8 + 6}s`;
      confetti.style.animationDelay = `${Math.random() * 8}s`;
      confetti.style.fontSize = `${Math.random() * 15 + 10}px`;
      confetti.style.opacity = `${Math.random() * 0.6 + 0.4}`;
      confetti.style.setProperty('--rotation', `${Math.random() * 720 - 360}deg`);
      confetti.style.setProperty('--sway', `${Math.random() * 100 - 50}px`);
      container.appendChild(confetti);
      confettiPieces.push(confetti);
    }

    return () => {
      confettiPieces.forEach(c => c.remove());
    };
  }, [enabled]);

  // Fireworks canvas animation
  useEffect(() => {
    if (!enabled || !fireworksRef.current) return;

    const canvas = fireworksRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    type Particle = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      life: number;
      maxLife: number;
    };

    const particles: Particle[] = [];
    let animationFrame: number;

    const createFirework = (x: number, y: number) => {
      const particleCount = 50; // Increased from 30
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      
      for (let i = 0; i < particleCount; i++) {
        const angle = (Math.PI * 2 * i) / particleCount;
        const velocity = Math.random() * 4 + 3; // Increased velocity
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color,
          life: 1,
          maxLife: Math.random() * 50 + 50, // Longer life
        });
      }
      
      // Add extra sparkle particles
      for (let i = 0; i < 20; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 6 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: '#FFFFFF',
          life: 1,
          maxLife: Math.random() * 30 + 20,
        });
      }
    };

    const animate = () => {
      // Clear canvas completely instead of black fade
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life++;

        const alpha = 1 - (p.life / p.maxLife);
        if (alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = p.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); // Slightly larger particles
        ctx.fill();
        
        // Add glow effect
        if (alpha > 0.5) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.color;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    // Create random fireworks - more frequent
    const fireworkInterval = setInterval(() => {
      if (Math.random() < 0.6) { // Increased from 0.3
        const x = Math.random() * canvas.width;
        const y = Math.random() * (canvas.height * 0.6); // Spread across more area
        createFirework(x, y);
      }
    }, 600); // More frequent (was 800ms)

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrame);
      clearInterval(fireworkInterval);
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled]);

  // Champagne bottle click handler
  const handleBottleClick = () => {
    if (!confettiRef.current) return;

    const container = confettiRef.current;
    const burstConfetti: HTMLDivElement[] = [];
    const burstCount = 50;

    for (let i = 0; i < burstCount; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-burst';
      piece.innerHTML = confettiShapes[Math.floor(Math.random() * confettiShapes.length)];
      piece.style.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      piece.style.left = '50%';
      piece.style.top = '50%';
      piece.style.setProperty('--tx', `${Math.random() * 400 - 200}px`);
      piece.style.setProperty('--ty', `${Math.random() * -300 - 100}px`);
      piece.style.setProperty('--rotation', `${Math.random() * 720}deg`);
      piece.style.animationDelay = `${Math.random() * 0.1}s`;
      container.appendChild(piece);
      burstConfetti.push(piece);
    }

    setTimeout(() => {
      burstConfetti.forEach(c => c.remove());
    }, 2000);
  };

  if (!enabled) return null;

  return (
    <>
      <div ref={containerRef} className="new-year-effect-container" />
      <canvas ref={fireworksRef} className="fireworks-canvas" />
      <div ref={confettiRef} className="confetti-burst-container" />

      {/* Champagne bottle decoration */}
      <div className="champagne-bottle" onClick={handleBottleClick}>
        🍾
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .new-year-effect-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9998;
          overflow: hidden;
        }

        .fireworks-canvas {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9997;
        }

        .confetti-burst-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 10000;
          overflow: hidden;
        }

        .new-year-confetti {
          position: absolute;
          top: -20px;
          font-size: 20px;
          animation: confetti-fall linear infinite;
          pointer-events: none;
        }

        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) translateX(var(--sway)) rotate(var(--rotation));
            opacity: 0;
          }
        }

        .confetti-burst {
          position: absolute;
          font-size: 18px;
          animation: burst 2s ease-out forwards;
          pointer-events: none;
        }

        @keyframes burst {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) rotate(var(--rotation)) scale(0.5);
            opacity: 0;
          }
        }

        .champagne-bottle {
          position: fixed;
          bottom: 30px;
          right: 30px;
          font-size: 3rem;
          cursor: pointer;
          z-index: 10001;
          animation: bottle-bounce 2s ease-in-out infinite;
          filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.4));
          transition: transform 0.2s ease;
        }

        .champagne-bottle:hover {
          transform: scale(1.2) rotate(15deg);
        }

        .champagne-bottle:active {
          transform: scale(0.9) rotate(-10deg);
        }

        @keyframes bottle-bounce {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(5deg);
          }
        }
      `}} />
    </>
  );
}
