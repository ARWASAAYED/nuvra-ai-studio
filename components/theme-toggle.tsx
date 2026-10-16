'use client';

import { useTheme } from '@/lib/theme-context';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();

  const toggle = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <button
      id="theme-toggle"
      onClick={toggle}
      aria-label="Toggle theme"
      className={`btn-ghost h-9 w-9 rounded-lg p-0 ${className}`}
    >
      {resolvedTheme === 'dark' ? (
        <Sun size={16} className="text-muted-foreground" />
      ) : (
        <Moon size={16} className="text-muted-foreground" />
      )}
    </button>
  );
}
