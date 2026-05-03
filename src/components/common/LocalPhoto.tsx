import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getPhotoUrl } from '../../services/photoStore';

interface LocalPhotoProps {
  photoId: string;
  alt?: string;
  className?: string;
}

/** Resolves a photoId to <img>. Falls back to ImageOff placeholder if both
 *  the local IndexedDB cache and the Worker/Drive proxy can't serve the photo. */
export const LocalPhoto: React.FC<LocalPhotoProps> = ({ photoId, alt, className }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    setUrl(null);
    getPhotoUrl(photoId).then((u) => {
      if (cancelled) return;
      if (u) setUrl(u);
      else setFailed(true);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, [photoId]);

  if (failed) {
    return (
      <div className={`flex flex-col items-center justify-center bg-milk-tea-100 text-milk-tea-300 ${className ?? ''}`}>
        <ImageOff className="w-5 h-5" />
      </div>
    );
  }
  if (!url) {
    return <div className={`bg-milk-tea-100 animate-pulse ${className ?? ''}`} />;
  }
  return (
    <img
      src={url}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={() => {
        console.warn('[LocalPhoto] failed to load:', photoId, url);
        setFailed(true);
      }}
    />
  );
};
