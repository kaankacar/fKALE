import React from 'react';
import { Button } from '@stellar/design-system';
import { useTheme } from '../providers/ThemeProvider';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="tertiary"
      size="md"
      onClick={toggleTheme}
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(10px)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '0.75rem',
        transition: 'all 0.3s ease',
        color: 'var(--text-primary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
      }}
    >
      {theme === 'light' ? (
        <span style={{ fontSize: '1.2rem' }}>🌙</span>
      ) : (
        <span style={{ fontSize: '1.2rem' }}>☀️</span>
      )}
    </Button>
  );
};

export default ThemeToggle;
