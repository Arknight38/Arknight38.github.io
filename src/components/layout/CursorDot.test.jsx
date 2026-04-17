import { render } from '@testing-library/react';
import { CursorDot } from './CursorDot';

describe('CursorDot', () => {
  const originalMatchMedia = window.matchMedia;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
  });

  test('adds and removes hover/click state classes', () => {
    render(
      <>
        <CursorDot />
        <button type="button">Action</button>
      </>
    );

    const dot = document.querySelector('.cursor-dot');
    const button = document.querySelector('button');

    expect(dot).toBeInTheDocument();
    expect(button).toBeInTheDocument();

    button.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    expect(dot).toHaveClass('cursor-dot--hover');

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(dot).toHaveClass('cursor-dot--click');

    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    expect(dot).not.toHaveClass('cursor-dot--click');

    button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
    expect(dot).not.toHaveClass('cursor-dot--hover');
  });

  test('disables the dot for coarse pointers', () => {
    window.matchMedia = (query) => ({
      matches: query === '(pointer: coarse)',
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    });

    render(<CursorDot />);
    const dot = document.querySelector('.cursor-dot');
    expect(dot).toHaveStyle({ display: 'none' });
  });
});
