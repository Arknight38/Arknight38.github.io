import { render, screen, fireEvent } from '@testing-library/react';
import { Accordion } from './Accordion';

const items = [
  { id: 'one', title: 'First item', content: 'First content' },
  { id: 'two', title: 'Second item', content: 'Second content' },
];

describe('Accordion', () => {
  test('keeps sections collapsed by default', () => {
    render(<Accordion items={items} />);

    expect(screen.queryByText('First content')).not.toBeInTheDocument();
    expect(screen.queryByText('Second content')).not.toBeInTheDocument();
  });

  test('expands and collapses a section when clicked', () => {
    render(<Accordion items={items} />);

    fireEvent.click(screen.getByRole('button', { name: 'First item' }));
    expect(screen.getByText('First content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'First item' }));
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
  });

  test('supports single-open mode', () => {
    render(<Accordion items={items} type="single" />);

    fireEvent.click(screen.getByRole('button', { name: 'First item' }));
    expect(screen.getByText('First content')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Second item' }));
    expect(screen.getByText('Second content')).toBeInTheDocument();
    expect(screen.queryByText('First content')).not.toBeInTheDocument();
  });
});
