import React, { useRef, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import { savePhoto, deletePhoto } from '../../services/photoStore';
import { LocalPhoto } from './LocalPhoto';
import { useUIStore } from '../../stores/uiStore';

interface PhotoGalleryEditorProps {
  photoIds: string[];
  onChange: (photoIds: string[]) => void;
  max?: number;
}

export const PhotoGalleryEditor: React.FC<PhotoGalleryEditorProps> = ({
  photoIds,
  onChange,
  max = 9,
}) => {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToast = useUIStore((s) => s.addToast);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const slots = max - photoIds.length;
    if (slots <= 0) {
      addToast(`最多只能加 ${max} 張照片`, 'warning');
      return;
    }
    setUploading(true);
    try {
      const picked = Array.from(files).slice(0, slots);
      const ids: string[] = [];
      for (const f of picked) {
        const id = await savePhoto(f);
        ids.push(id);
      }
      onChange([...photoIds, ...ids]);
      addToast(`✅ 已加入 ${ids.length} 張照片`, 'success');
    } catch (e) {
      console.error('[photo upload]', e);
      addToast('照片儲存失敗', 'error');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = async (id: string) => {
    onChange(photoIds.filter((x) => x !== id));
    await deletePhoto(id);
  };

  return (
    <div className="grid grid-cols-3 gap-2">
      {photoIds.map((id) => (
        <div key={id} className="relative aspect-square rounded-2xl overflow-hidden border border-milk-tea-200 bg-milk-tea-50">
          <LocalPhoto photoId={id} className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => handleRemove(id)}
            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/80"
            aria-label="移除"
          >
            <X size={14} />
          </button>
        </div>
      ))}

      {photoIds.length < max && (
        <label
          className={`aspect-square rounded-2xl border-2 border-dashed flex flex-col items-center justify-center text-milk-tea-400 cursor-pointer transition-colors ${
            uploading ? 'border-milk-tea-200 bg-milk-tea-50' : 'border-milk-tea-300 hover:border-milk-tea-500 hover:bg-milk-tea-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Plus className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold">加照片</span>
            </>
          )}
        </label>
      )}
    </div>
  );
};
