import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@contexts/ThemeContext';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  test('toggles document theme attribute', () => {
    // Ensure deterministic initial theme
    localStorage.setItem('theme', 'light');

    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    fireEvent.click(screen.getByRole('button'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});

