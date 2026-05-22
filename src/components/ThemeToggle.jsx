'use client';

import { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { Moon, Sun, CircleHalf } from 'react-bootstrap-icons';

const themes = ['light', 'dark', 'system'];

export default function ThemeToggle() {
  const [mode, setMode] = useState('dark');
  const [actualMode, setActualMode] = useState('dark');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedMode = typeof window !== 'undefined' ? localStorage.getItem('theme-mode') : null;
    if (savedMode && themes.includes(savedMode)) {
      setMode(savedMode);
    } else {
      // If no preference saved, explicitly set 'dark'
      setMode('dark');
    }
  }, []);

  // Update actual theme based on selected mode and system preference
  useEffect(() => {
    if (!mounted) return;
    
    localStorage.setItem('theme-mode', mode);

    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateActualMode = (e) => {
        setActualMode(e.matches ? 'dark' : 'light');
      };
      
      setActualMode(mediaQuery.matches ? 'dark' : 'light');
      mediaQuery.addEventListener('change', updateActualMode);
      return () => mediaQuery.removeEventListener('change', updateActualMode);
    } else {
      setActualMode(mode);
    }
  }, [mode, mounted]);

  // Apply the theme to the document element
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute('data-bs-theme', actualMode);
  }, [actualMode, mounted]);

  const handleToggle = () => {
    const currentIndex = themes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % themes.length;
    setMode(themes[nextIndex]);
  };

  // Prevent hydration mismatch by returning a placeholder until mounted
  if (!mounted) {
    return (
      <div 
        style={{ width: '34px', height: '34px' }} 
        className="d-flex align-items-center justify-content-center"
      >
        <CircleHalf className="opacity-25" />
      </div>
    );
  }

  const getIcon = () => {
    if (actualMode === 'dark') return <Moon />;
    if (actualMode === 'light') return <Sun />;
    return <CircleHalf />;
  };

  const getLabel = () => {
    if (mode === 'light') return 'Light Mode';
    if (mode === 'dark') return 'Dark Mode';
    return 'System Default';
  };

  return (
    <Button
      variant="outline-secondary"
      onClick={handleToggle}
      title={getLabel()}
      className="d-flex align-items-center justify-content-center p-0 border-1"
      style={{
        width: '34px',
        height: '34px',
        borderRadius: '6px',
        transition: 'all 0.2s ease',
        flexShrink: 0
      }}
    >
      {getIcon()}
    </Button>
  );
}
