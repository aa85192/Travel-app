import React, { useRef, useState, useCallback } from 'react';
import { Image as ImageIcon, Upload, Loader2, X, CheckCircle } from 'lucide-react';
import { compressImage, formatBytes, CompressResult } from '../../utils/imageCompressor';

interface ImageUploaderProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Max long edge in px. Default 1280 */
  maxDimension?: number;
  /** Target size in bytes. Default 300 KB */
  targetBytes?: number;
  /** Preview shape: 'square' | 'wide'. Default 'square' */
  previewShape?: 'square' | 'wide';
  /** Label shown above (optional – caller may render its own label) */
  label?: string;
  /** Show auto-fetch button slot */
  extra?: React.ReactNode;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value,
  onChange,
  placeholder = 'https://... 或上傳圖片',
  maxDimension = 1280,
  targetBytes = 300 * 1024,
  previewShape = 'square',
  extra,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [lastResult, setLastResult] = useState<CompressResult | null>(null);
  const [showStats, setShowStats] = useState(false);

  const processFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsCompressing(true);
    setLastResult(null);
    setShowStats(false);
    try {
      const result = await compressImage(file, { maxDimension, targetBytes });
      onChange(result.dataUrl);
      setLastResult(result);
      setShowStats(true);
      // Hide stats after 4 seconds
      setTimeout(() => setShowStats(false), 4000);
    } finally {
      setIsCompressing(false);
    }
  }, [maxDimension, targetBytes, onChange]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setLastResult(null);
    setShowStats(false);
  };

  const previewClasses =
    previewShape === 'wide'
      ? 'w-16 h-10 rounded-lg'
      : 'w-12 h-12 rounded-xl';

  return (
    <div className="space-y-1.5">
      {/* Input row */}
      <div
        className={`flex space-x-2 transition-all ${isDragging ? 'ring-2 ring-milk-tea-400 ring-offset-1 rounded-xl' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* URL text input */}
        <div className="flex-1 relative">
          <ImageIcon size={16} className="absolute left-4 top-3.5 text-milk-tea-300 pointer-events-none" />
          <input
            type="text"
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-milk-tea-200 rounded-xl text-sm focus:border-milk-tea-400 outline-none transition-colors"
            placeholder={value.startsWith('data:') ? '（已上傳本地圖片）' : placeholder}
            readOnly={value.startsWith('data:')}
          />
        </div>

        {/* Upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isCompressing}
          title="上傳圖片（支援拖曳）"
          className="flex items-center justify-center w-11 h-11 rounded-xl border border-milk-tea-200 bg-white hover:bg-milk-tea-50 hover:border-milk-tea-400 text-milk-tea-400 hover:text-milk-tea-600 transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {isCompressing
            ? <Loader2 size={16} className="animate-spin" />
            : <Upload size={16} />}
        </button>

        {/* Extra slot (e.g., auto-fetch button rendered as icon-button) */}
        {extra}

        {/* Preview / clear */}
        {isCompressing ? (
          <div className={`${previewClasses} overflow-hidden border border-milk-tea-200 flex-shrink-0 bg-milk-tea-50 flex items-center justify-center`}>
            <Loader2 size={16} className="animate-spin text-milk-tea-300" />
          </div>
        ) : value ? (
          <div className={`relative ${previewClasses} overflow-hidden border border-milk-tea-200 flex-shrink-0 bg-milk-tea-50 group`}>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/placeholder/100/100';
              }}
              referrerPolicy="no-referrer"
            />
            <button
              type="button"
              onClick={clearImage}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="移除圖片"
            >
              <X size={14} className="text-white" />
            </button>
          </div>
        ) : null}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Compression stats toast */}
      {showStats && lastResult && (
        <div className="flex items-center space-x-1.5 text-[11px] text-milk-tea-500 animate-fade-in">
          <CheckCircle size={11} className="text-green-500 flex-shrink-0" />
          <span>
            壓縮完成：{formatBytes(lastResult.originalSize)} → {formatBytes(lastResult.compressedSize)}
            <span className="ml-1 text-green-600 font-semibold">
              （節省 {Math.round((1 - lastResult.ratio) * 100)}%）
            </span>
            · {lastResult.width}×{lastResult.height} · {lastResult.format.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
};
