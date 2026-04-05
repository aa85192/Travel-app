import React from 'react';

interface PhotoThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ src, alt, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-photo overflow-hidden border-2 border-milk-tea-200 shadow-sm flex-shrink-0 bg-milk-tea-100`}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
      />
    </div>
  );
};
