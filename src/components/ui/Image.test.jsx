import { render, screen, fireEvent } from '@testing-library/react';
import { Image } from './Image';

describe('Image', () => {
  test('renders blur placeholder until image loads', () => {
    render(
      <Image
        src="/mock-image.jpg"
        alt="Demo image"
        placeholderSrc="/placeholder.jpg"
      />
    );

    const image = screen.getByAltText('Demo image');
    expect(image).toHaveAttribute('data-loaded', 'false');
    expect(screen.getByTestId('image-blur-placeholder')).toBeInTheDocument();

    fireEvent.load(image);
    expect(image).toHaveAttribute('data-loaded', 'true');
    expect(screen.queryByTestId('image-blur-placeholder')).not.toBeInTheDocument();
  });
});
