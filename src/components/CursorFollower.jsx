import React, { useEffect, useState, useRef } from 'react';

/**
 * CursorFollower — A Premium Drafting Pen that "sketches" architectural lines on the background.
 * Features a sleek pen design and a fading canvas trail for a high-end architectural feel.
 */
const CursorFollower = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [followerPos, setFollowerPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(-45);
  const [isVisible, setIsVisible] = useState(false);

  const canvasRef = useRef(null);
  const requestRef = useRef();
  const trailRef = useRef([]); // Stores historical points for the trail

  // Handle Mouse Movement
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      setMousePos({ x: clientX, y: clientY });
      if (!isVisible) setIsVisible(true);

      // Add point to trail
      trailRef.current.push({ x: clientX, y: clientY, alpha: 1, age: 0 });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible]);

  // Animation Logic (Lerp + Trail Rendering)
  const animate = () => {
    // 1. Smooth Follower Position (Lerp)
    setFollowerPos((prev) => {
      const dx = mousePos.x - prev.x;
      const dy = mousePos.y - prev.y;

      // Subtle tilt based on movement speed
      const speed = Math.sqrt(dx * dx + dy * dy);
      const tilt = Math.min(Math.max(speed * 0.5, 0), 20);
      setRotation(-45 + (dx > 0 ? tilt : -tilt));

      return {
        x: prev.x + dx * 0.12,
        y: prev.y + dy * 0.12,
      };
    });

    // 2. Update and Render Trail on Canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update trail points
      trailRef.current = trailRef.current
        .map((p) => ({ ...p, alpha: p.alpha - 0.015, age: p.age + 1 }))
        .filter((p) => p.alpha > 0);

      if (trailRef.current.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trailRef.current[0].x, trailRef.current[0].y);

        for (let i = 1; i < trailRef.current.length; i++) {
          const p = trailRef.current[i];
          ctx.strokeStyle = `rgba(197, 139, 78, ${p.alpha * 0.4})`; // Using --accent color
          ctx.lineWidth = 1.5;
          ctx.lineCap = 'round';
          ctx.lineTo(p.x, p.y);
          ctx.stroke();

          // Start a new path for fading effect per segment
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
        }
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    // Resize canvas to window size
    const handleResize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = window.innerWidth;
        canvasRef.current.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    requestRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(requestRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [mousePos]);

  if (!isVisible) return null;

  return (
    <>
      {/* Canvas for the sketch trail */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9998, // Just below the pen
          opacity: 0.6,
        }}
      />

      {/* The Drafting Pen */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 40,
          height: 40,
          pointerEvents: 'none',
          zIndex: 10000,
          transform: `translate(${followerPos.x}px, ${followerPos.y}px) translate(-2px, -38px) rotate(${rotation}deg)`,
          transformOrigin: 'bottom left',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            width: '100%',
            height: '100%',
            filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))',
          }}
        >
          {/* Pen Body */}
          <path
            d="M3 21L5 16L17.5 3.5C18.3284 2.67157 19.6716 2.67157 20.5 3.5C21.3284 4.32843 21.3284 5.67157 20.5 6.5L8 19L3 21Z"
            fill="#2b2118" // Dark walnut / slate
            stroke="#c58b4e" // Accent gold/wood
            strokeWidth="1"
          />
          {/* Grip Detail */}
          <rect
            x="6"
            y="14"
            width="4"
            height="6"
            transform="rotate(-45 6 14)"
            fill="#c58b4e"
            opacity="0.3"
          />
          {/* Nib Detail */}
          <path d="M3 21L4.5 17.5L6.5 19.5L3 21Z" fill="#c58b4e" />
        </svg>
      </div>

      <style>{`
        @media (max-width: 768px) {
          canvas, div { display: none !important; }
        }
      `}</style>
    </>
  );
};

export default CursorFollower;
