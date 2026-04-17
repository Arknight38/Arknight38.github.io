import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Skills } from './Skills';

describe('Skills page', () => {
  test('renders evidence-first skill items without proficiency scores', () => {
    render(
      <MemoryRouter>
        <Skills />
      </MemoryRouter>
    );

    expect(screen.getByText(/MOST EVIDENCED/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Rust/).length).toBeGreaterThan(0);
    expect(screen.queryByText('5/5')).not.toBeInTheDocument();
  });
});

