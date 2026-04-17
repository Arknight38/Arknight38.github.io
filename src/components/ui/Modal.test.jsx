import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  test('renders dialog content when open', () => {
    render(
      <Modal open onClose={() => {}} title="Example dialog">
        <p>Dialog body</p>
      </Modal>
    );

    expect(screen.getByRole('dialog', { name: 'Example dialog' })).toBeInTheDocument();
    expect(screen.getByText('Dialog body')).toBeInTheDocument();
  });

  test('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Esc test">
        <p>Dialog body</p>
      </Modal>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when clicking backdrop', () => {
    const onClose = vi.fn();

    render(
      <Modal open onClose={onClose} title="Backdrop test">
        <p>Dialog body</p>
      </Modal>
    );

    fireEvent.mouseDown(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
