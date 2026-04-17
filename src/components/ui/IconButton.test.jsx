import { render, screen } from '@testing-library/react';
import { Star } from 'lucide-react';
import { IconButton } from './IconButton';

describe('IconButton', () => {
  test('renders icon-only button with accessible label', () => {
    render(
      <IconButton aria-label="Favorite project">
        <Star data-testid="icon" size={16} />
      </IconButton>
    );

    expect(screen.getByRole('button', { name: 'Favorite project' })).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
