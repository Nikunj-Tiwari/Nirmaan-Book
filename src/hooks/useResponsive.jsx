import React, { useState, useEffect } from 'react';

export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
        setIsMobile(true);
        setIsTablet(false);
      } else if (width < 1024) {
        setBreakpoint('tablet');
        setIsMobile(false);
        setIsTablet(true);
      } else {
        setBreakpoint('desktop');
        setIsMobile(false);
        setIsTablet(false);
      }
    };

    handleResize(); // Call on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return { breakpoint, isMobile, isTablet };
};

export const ResponsiveLayout = ({ children }) => {
  const { isMobile } = useResponsive();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        width: '100%',
        minHeight: '100vh',
      }}
    >
      {children}
    </div>
  );
};

export default { useResponsive, ResponsiveLayout };
