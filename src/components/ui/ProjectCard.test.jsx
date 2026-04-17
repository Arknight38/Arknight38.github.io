import { render, screen } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

const baseProject = {
  id: 'flux',
  name: 'Flux',
  description: 'Realtime messaging platform.',
  tags: ['fullstack', 'featured'],
  chips: ['React', 'Rust'],
  link: 'https://example.com/project',
  linkType: 'github',
};

describe('ProjectCard', () => {
  test('renders project content and metadata', () => {
    render(<ProjectCard project={baseProject} />);

    expect(screen.getByText('Flux')).toBeInTheDocument();
    expect(screen.getByText('Realtime messaging platform.')).toBeInTheDocument();
    expect(screen.getByText('fullstack')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  test('renders external action link for github projects', () => {
    render(<ProjectCard project={baseProject} />);

    const link = screen.getByRole('link', { name: /open project/i });
    expect(link).toHaveAttribute('href', 'https://example.com/project');
    expect(link).toHaveAttribute('target', '_blank');
  });
});
