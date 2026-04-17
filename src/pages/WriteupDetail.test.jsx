import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { WriteupDetail } from './WriteupDetail';

describe('WriteupDetail', () => {
  test('shows skeleton while loading', () => {
    vi.useFakeTimers();

    render(
      <MemoryRouter initialEntries={['/writeups/flux-messaging']}>
        <Routes>
          <Route path="/writeups/:slug" element={<WriteupDetail />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('writeup-skeleton')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(150);
    });

    vi.useRealTimers();
  });
});

