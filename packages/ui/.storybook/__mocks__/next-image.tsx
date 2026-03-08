import React from 'react';

type ImageProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  quality?: number;
};

// Mock for next/image in Storybook
const Image = ({ src, alt, fill, sizes: _sizes, priority: _priority, quality: _quality, style, ...props }: ImageProps) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img
    src={src}
    alt={alt}
    style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style } : style}
    {...props}
  />
);

export default Image;
