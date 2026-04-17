import { render, screen, act } from '@testing-library/react';
import { ScrambleText } from './ScrambleText';

describe('ScrambleText', () => {
  test('eventually resolves to the final text', async () => {
    vi.useFakeTimers();

    render(<ScrambleText text="HELLO" durationMs={200} />);

    expect(screen.getByText(/./)).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByText('HELLO')).toBeInTheDocument();

    vi.useRealTimers();
  });

  test('shows final text immediately when reduced motion is forced', () => {
    render(<ScrambleText text="STATIC" forceReducedMotion />);

    expect(screen.getByText('STATIC')).toBeInTheDocument();
  });
});

