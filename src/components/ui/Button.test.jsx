import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  test('shows an accessible loading indicator when loading', () => {
    render(<Button isLoading>Save</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
