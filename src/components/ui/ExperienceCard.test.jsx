import { render, screen, fireEvent } from '@testing-library/react';
import { ExperienceCard } from './ExperienceCard';

const baseExperience = {
  id: 'r365',
  period: '2025',
  type: 'internship',
  role: 'Data Analyst Intern',
  organization: 'Restaurant365',
  organizationDetail: 'R&D',
  bullets: ['Worked with SQL.', 'Presented analytics.'],
};

describe('ExperienceCard', () => {
  test('renders base role and organization info', () => {
    render(<ExperienceCard experience={baseExperience} />);

    expect(screen.getByText('Data Analyst Intern')).toBeInTheDocument();
    expect(screen.getByText(/Restaurant365/)).toBeInTheDocument();
    expect(screen.getByText('2025')).toBeInTheDocument();
  });

  test('expands and collapses bullet details', () => {
    render(<ExperienceCard experience={baseExperience} />);

    expect(screen.queryByText('Worked with SQL.')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /show details/i }));
    expect(screen.getByText('Worked with SQL.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /hide details/i }));
    expect(screen.queryByText('Worked with SQL.')).not.toBeInTheDocument();
  });
});
