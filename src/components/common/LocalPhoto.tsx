import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getPhotoUrl } from '../../services/photoStore';

interface LocalPhotoProps {
  photoId: string;
  alt?: string;
  className?: string;
}

/** Resolves a photoId from IndexedDB to an object URL for <img>. Shows
 * a placeholder when the blob isn't on this device (e.g. after sync). */
export const LocalPhoto: React.FC<LocalPhotoProps> = ({ photoId, alt, className }) => {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMissing(false);
    setUrl(null);
    getPhotoUrl(photoId).then((u) => {
      if (cancelled) return;
      if (u) setUrl(u);
      else setMissing(true);
    });
    return () => { cancelled = true; };
  }, [photoId]);

  if (missing) {
    return (
      <div className={`flex flex-col items-center justify-center bg-milk-tea-100 text-milk-tea-300 ${className ?? ''}`}>
        <ImageOff className="w-5 h-5" />
        <span className="text-[9px] mt-0.5">裝置端照片</span>
      </div>
    );
  }
  if (!url) {
    return <div className={`bg-milk-tea-100 animate-pulse ${className ?? ''}`} />;
  }
  return <img src={url} alt={alt} className={className} />;
};
