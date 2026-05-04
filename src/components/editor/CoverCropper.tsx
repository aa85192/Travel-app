import React, { useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface Props {
  src: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

// Output size: 7:4 aspect (matches h-64 cover at max-w-md)
const OUT_W = 1120;
const OUT_H = 640;

export const CoverCropper: React.FC<Props> = ({ src, onConfirm, onCancel }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [csize, setCsize] = useState({ w: 0, h: 0 });
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ px: number; py: number; ox: number; oy: number } | null>(null);

  const minScale = nat.w && csize.w
    ? Math.max(csize.w / nat.w, csize.h / nat.h)
    : 1;

  const clamp = useCallback((x: number, y: number, s: number, cw: number, ch: number, nw: number, nh: number) => ({
    x: Math.max(cw - nw * s, Math.min(0, x)),
    y: Math.max(ch - nh * s, Math.min(0, y)),
  }), []);

  const handleLoad = () => {
    const img = imgRef.current;
    const el = containerRef.current;
    if (!img || !el) return;
    const nw = img.naturalWidth, nh = img.naturalHeight;
    const cw = el.clientWidth, ch = el.clientHeight;
    setNat({ w: nw, h: nh });
    setCsize({ w: cw, h: ch });
    const s = Math.max(cw / nw, ch / nh);
    setScale(s);
    setPos(clamp((cw - nw * s) / 2, (ch - nh * s) / 2, s, cw, ch, nw, nh));
  };

  // ── drag ────────────────────────────────────────────────────────────────
  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragStart({ px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const nx = dragStart.ox + (e.clientX - dragStart.px);
    const ny = dragStart.oy + (e.clientY - dragStart.py);
    setPos(clamp(nx, ny, scale, csize.w, csize.h, nat.w, nat.h));
  };
  const onPointerUp = () => setDragStart(null);

  // ── zoom (keeps container center fixed) ──────────────────────────────────
  const applyScale = (s: number) => {
    const ns = Math.max(minScale, Math.min(4 * minScale, s));
    const cx = csize.w / 2, cy = csize.h / 2;
    const ncx = (cx - pos.x) / scale;
    const ncy = (cy - pos.y) / scale;
    setScale(ns);
    setPos(clamp(cx - ncx * ns, cy - ncy * ns, ns, csize.w, csize.h, nat.w, nat.h));
  };

  const sliderVal = minScale ? Math.round((scale / minScale) * 100) : 100;

  // ── export ───────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !nat.w) return;
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext('2d')!;
    const srcX = -pos.x / scale;
    const srcY = -pos.y / scale;
    const srcW = csize.w / scale;
    const srcH = csize.h / scale;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUT_W, OUT_H);
    canvas.toBlob((blob) => { if (blob) onConfirm(blob); }, 'image/webp', 0.88);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-milk-tea-500 text-center">拖曳調整位置・滑桿縮放</p>

      {/* Preview */}
      <div
        ref={containerRef}
        className="w-full rounded-2xl overflow-hidden border-2 border-milk-tea-400 cursor-grab active:cursor-grabbing select-none bg-milk-tea-100"
        style={{ height: 200, touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <img
          ref={imgRef}
          src={src}
          alt=""
          draggable={false}
          onLoad={handleLoad}
          style={{
            position: 'relative',
            transform: `translate(${pos.x}px,${pos.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            width: nat.w || 'auto',
            height: nat.h || 'auto',
            maxWidth: 'none',
            display: 'block',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Zoom */}
      <div className="flex items-center gap-2 px-1">
        <button onClick={() => applyScale(scale / 1.25)}
          className="p-1.5 rounded-lg bg-milk-tea-100 text-milk-tea-600 hover:bg-milk-tea-200 flex-shrink-0">
          <ZoomOut size={16} />
        </button>
        <input type="range" min={100} max={400} value={sliderVal}
          onChange={(e) => applyScale(minScale * Number(e.target.value) / 100)}
          className="flex-1 accent-milk-tea-500" />
        <button onClick={() => applyScale(scale * 1.25)}
          className="p-1.5 rounded-lg bg-milk-tea-100 text-milk-tea-600 hover:bg-milk-tea-200 flex-shrink-0">
          <ZoomIn size={16} />
        </button>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-milk-tea-200 text-milk-tea-500 rounded-xl text-sm font-bold hover:bg-milk-tea-50">
          取消
        </button>
        <button onClick={handleConfirm}
          className="flex-1 py-2.5 bg-milk-tea-500 text-white rounded-xl text-sm font-bold shadow-sm active:scale-95">
          ✂️ 確認裁切
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
