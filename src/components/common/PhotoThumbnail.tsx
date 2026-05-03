import React, { useState, useEffect } from 'react';
import { ImageOff } from 'lucide-react';

interface PhotoThumbnailProps {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  onError?: () => void;
}

export const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ src, alt, size = 'md', onError }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  return (
    <div className={`${sizeClasses[size]} rounded-photo overflow-hidden border-2 border-milk-tea-200 shadow-sm flex-shrink-0 bg-milk-tea-100 relative`}>
      {failed || !src ? (
        <div className="w-full h-full flex flex-col items-center justify-center text-milk-tea-300">
          <ImageOff className="w-4 h-4" />
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => {
            console.warn('[PhotoThumbnail] image failed to load:', src);
            setFailed(true);
            onError?.();
          }}
        />
      )}
    </div>
  );
};
