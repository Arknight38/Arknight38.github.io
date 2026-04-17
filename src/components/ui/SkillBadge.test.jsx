import { render, screen } from '@testing-library/react';
import { SkillBadge } from './SkillBadge';

describe('SkillBadge', () => {
  test('renders skill name and proficiency meter', () => {
    render(<SkillBadge name="Rust" level={4} />);

    expect(screen.getByText('Rust')).toBeInTheDocument();
    expect(screen.getByText('4/5')).toBeInTheDocument();
    expect(screen.getByRole('meter', { name: /rust proficiency/i })).toBeInTheDocument();
  });
});
