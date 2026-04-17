import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ComingSoon } from './ComingSoon';

describe('ComingSoon', () => {
  test('renders placeholder content and navigation link', () => {
    render(
      <MemoryRouter>
        <ComingSoon />
      </MemoryRouter>
    );

    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to profile/i })).toBeInTheDocument();
  });
});
