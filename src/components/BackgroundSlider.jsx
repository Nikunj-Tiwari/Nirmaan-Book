import React, { useState, useEffect, useCallback } from 'react';

/**
 * BackgroundSlider Component
 *
 * Features:
 * - Full-screen background slider behind content
 * - Automatic sliding every 4-6 seconds
 * - Smooth fade + subtle zoom animation
 * - Dark overlay for text readability
 * - Performance optimized with image preloading
 * - Responsive design with proper aspect ratio handling
 */

const BackgroundSlider = ({ images = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const [nextIndex, setNextIndex] = useState(1);

  // Preload images for smooth sliding
  const preloadImage = useCallback(
    (index) => {
      if (preloadedImages.has(index)) return;

      const img = new Image();
      img.onload = () => {
        setPreloadedImages((prev) => new Set(prev).add(index));
        if (index === 0) setIsLoading(false);
      };
      img.onerror = () => {
        setPreloadedImages((prev) => new Set(prev).add(index)); // Mark as attempted
        if (index === 0) setIsLoading(false);
      };
      img.src = images[index];
    },
    [images, preloadedImages]
  );

  // Preload first & next images on mount
  useEffect(() => {
    if (images.length === 0) return;
    preloadImage(0);
    preloadImage(1);
  }, [images, preloadImage]);

  // Auto-slide every 4-6 seconds
  useEffect(() => {
    if (images.length === 0) return;

    // Random interval between 4-6 seconds for natural feel
    const randomDelay = 4000 + Math.random() * 2000;

    const timer = setTimeout(() => {
      const newIndex = (currentIndex + 1) % images.length;
      setCurrentIndex(newIndex);
      setNextIndex((newIndex + 1) % images.length);
      preloadImage((newIndex + 1) % images.length);
    }, randomDelay);

    return () => clearTimeout(timer);
  }, [currentIndex, images.length, preloadImage]);

  if (images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const prevIndex = (currentIndex - 1 + images.length) % images.length;

  return (
    <>
      {/* Background Slider Container */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        {/* Current Image - Fade In */}
        <div
          key={`current-${currentIndex}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${currentImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            animation: 'backgroundFadeIn 1s ease-out forwards',
            willChange: 'opacity',
          }}
        />

        {/* Previous Image - Fade Out */}
        <div
          key={`prev-${prevIndex}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundImage: `url(${images[prevIndex]})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            animation: 'backgroundFadeOut 1s ease-out forwards',
            pointerEvents: 'none',
          }}
        />

        {/* Dark Overlay - For Text Readability */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(15, 13, 11, 0.65)',
            backdropFilter: 'blur(2px)',
            zIndex: 1,
          }}
        />

        {/* Subtle wood grain/noise texture overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            opacity: 0.12,
            mixBlendMode: 'overlay',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />

        {/* Optional Vignette for Premium Feel */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background:
              'radial-gradient(ellipse at center, transparent 0%, rgba(15, 13, 11, 0.4) 100%)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Ensure content stays on top */}
      <style>{`
        @keyframes backgroundFadeIn {
          from {
            opacity: 0;
            transform: scale(1.02);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes backgroundFadeOut {
          from {
            opacity: 1;
            transform: scale(1);
          }
          to {
            opacity: 0;
            transform: scale(0.98);
          }
        }

        /* Ensure app content stays above background */
        body {
          position: relative;
          z-index: 10;
        }
      `}</style>
    </>
  );
};

export default BackgroundSlider;
