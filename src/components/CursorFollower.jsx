import React, { useEffect, useState, useRef } from 'react';

/**
 * CursorFollower — A decorative chainsaw that follows the mouse with smooth easing.
 * Includes a "rotating" chain effect and subtle tilt based on velocity.
 */
const CursorFollower = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [followerPos, setFollowerPos] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const requestRef = useRef();

  // Smoothing (Lerp)
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isVisible]);

  const animate = () => {
    setFollowerPos((prev) => {
      const dx = mousePos.x - prev.x;
      const dy = mousePos.y - prev.y;

      // Calculate rotation based on movement direction
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        setRotation(angle + 45); // Adjust offset for the SVG orientation
      }

      return {
        x: prev.x + dx * 0.15, // Smoothness factor
        y: prev.y + dy * 0.15,
      };
    });
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [mousePos]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 60,
        height: 60,
        pointerEvents: 'none',
        zIndex: 10000,
        transform: `translate(${followerPos.x}px, ${followerPos.y}px) translate(-50%, -50%) rotate(${rotation}deg)`,
        transition: 'opacity 0.5s ease',
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Chainsaw SVG */}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
      >
        {/* Handle */}
        <path
          d="M20 70C20 70 10 70 10 60C10 50 20 50 20 50"
          stroke="#333"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Body */}
        <rect x="20" y="45" width="30" height="25" rx="4" fill="#C58B4E" />
        <rect x="25" y="48" width="20" height="15" rx="2" fill="#9B6735" opacity="0.5" />
        {/* Blade */}
        <path
          d="M50 52H85C90 52 90 63 85 63H50V52Z"
          fill="#94a3b8"
          stroke="#475569"
          strokeWidth="1"
        />
        {/* Chain Details */}
        <g className="chainsaw-chain">
          <line x1="55" y1="52" x2="55" y2="50" stroke="#334155" strokeWidth="2" />
          <line x1="65" y1="52" x2="65" y2="50" stroke="#334155" strokeWidth="2" />
          <line x1="75" y1="52" x2="75" y2="50" stroke="#334155" strokeWidth="2" />
          <line x1="85" y1="55" x2="87" y2="55" stroke="#334155" strokeWidth="2" />
          <line x1="55" y1="63" x2="55" y2="65" stroke="#334155" strokeWidth="2" />
          <line x1="65" y1="63" x2="65" y2="65" stroke="#334155" strokeWidth="2" />
          <line x1="75" y1="63" x2="75" y2="65" stroke="#334155" strokeWidth="2" />
        </g>
      </svg>

      <style>{`
        @keyframes chainMove {
          0% { transform: translateX(0); }
          100% { transform: translateX(10px); }
        }
        .chainsaw-chain line {
          animation: chainMove 0.1s linear infinite;
        }
        @media (max-width: 768px) {
          div { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default CursorFollower;
