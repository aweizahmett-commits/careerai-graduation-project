import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const CursorGlow: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const location = useLocation();
  const { theme } = useTheme();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  // Auth & Landing pages get a colorful multi-matte glow
  const isAuthPage = ['/', '/login', '/register', '/register/dual'].includes(location.pathname);

  if (!isVisible) return null;

  if (isAuthPage) {
    return (
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.15), rgba(56, 189, 248, 0.15), rgba(236, 72, 153, 0.05), transparent 40%)`,
          mixBlendMode: 'multiply'
        }}
      />
    );
  }

  // Determine glow color automatically from theme CSS variables by forcing it to inherit from current active theme class variables, 
  // or explicitly defining an energetic glow mapping:
  const getThemeGlowColor = () => {
    switch (theme) {
      case 'vanilla':
        return 'rgba(234, 88, 12, 0.12)'; // Orange
      case 'dark':
        return 'rgba(236, 72, 153, 0.15)'; // Pink/Magenta
      case 'light':
      default:
        return 'rgba(99, 102, 241, 0.1)'; // Indigo/Blue
    }
  };

  const mixBlend = theme === 'dark' ? 'screen' : 'multiply';

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-[1] transition-opacity duration-300 transition-colors"
      style={{
        background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, ${getThemeGlowColor()} 0%, transparent 40%)`,
        mixBlendMode: mixBlend as any
      }}
    />
  );
};

export default CursorGlow;
