/**
 * Claude Image Compression Engine
 *
 * Multi-pass smart compression that:
 * 1. Resizes to optimal dimensions
 * 2. Binary-searches for best quality/size balance
 * 3. Prefers WebP (better ratio), falls back to JPEG
 * 4. Applies mild sharpening after downscale to recover perceptual quality
 */

export interface CompressResult {
  dataUrl: string;
  originalSize: number;   // bytes
  compressedSize: number; // bytes
  width: number;
  height: number;
  format: 'webp' | 'jpeg';
  ratio: number; // 0–1, compressed/original
}

interface CompressOptions {
  /** Max long-edge in pixels. Default: 1280 */
  maxDimension?: number;
  /** Target max size in bytes. Default: 300 KB */
  targetBytes?: number;
  /** Minimum acceptable quality (0–1). Default: 0.55 */
  minQuality?: number;
}

// Detect WebP support once
const supportsWebP: boolean = (() => {
  try {
    const c = document.createElement('canvas');
    c.width = 1; c.height = 1;
    return c.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
})();

/** Load a File / Blob into an HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Apply a very mild unsharp-mask to a canvas context to recover crispness after downscale */
function applySharpen(ctx: CanvasRenderingContext2D, w: number, h: number, amount = 0.25) {
  const data = ctx.getImageData(0, 0, w, h);
  const d = data.data;
  const blurred = ctx.getImageData(0, 0, w, h); // will be computed via temp canvas
  // Simple 3×3 box-blur for base
  const tmp = new Uint8ClampedArray(d.length);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      for (let c = 0; c < 3; c++) {
        tmp[i + c] = (
          d[((y-1)*w+(x-1))*4+c] + d[((y-1)*w+x)*4+c] + d[((y-1)*w+(x+1))*4+c] +
          d[(y*w+(x-1))*4+c]     + d[(y*w+x)*4+c]     + d[(y*w+(x+1))*4+c] +
          d[((y+1)*w+(x-1))*4+c] + d[((y+1)*w+x)*4+c] + d[((y+1)*w+(x+1))*4+c]
        ) / 9;
      }
      tmp[i + 3] = d[i + 3];
    }
  }
  // Unsharp: result = original + amount*(original - blur)
  for (let i = 0; i < d.length - 4; i += 4) {
    for (let c = 0; c < 3; c++) {
      d[i + c] = Math.min(255, Math.max(0, d[i + c] + amount * (d[i + c] - tmp[i + c])));
    }
  }
  ctx.putImageData(data, 0, 0);
}

/** Convert dataURL to byte count */
function dataUrlBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}

/** Render image to canvas at target dimensions */
function renderToCanvas(img: HTMLImageElement, tw: number, th: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, tw, th);
  return ctx;
}

/**
 * Compress an image File using Claude's smart multi-pass algorithm.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<CompressResult> {
  const {
    maxDimension = 1280,
    targetBytes = 300 * 1024,
    minQuality = 0.55,
  } = options;

  const originalSize = file.size;
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);
    const { naturalWidth: ow, naturalHeight: oh } = img;

    // ── 1. Compute target dimensions ─────────────────────────────────────────
    const scale = Math.min(1, maxDimension / Math.max(ow, oh));
    const tw = Math.round(ow * scale);
    const th = Math.round(oh * scale);

    // ── 2. Render to canvas ───────────────────────────────────────────────────
    const ctx = renderToCanvas(img, tw, th);

    // Sharpen only when we actually downscaled
    if (scale < 0.95) {
      applySharpen(ctx, tw, th, 0.3);
    }

    const canvas = ctx.canvas;
    const mime = supportsWebP ? 'image/webp' : 'image/jpeg';
    const format: 'webp' | 'jpeg' = supportsWebP ? 'webp' : 'jpeg';

    // ── 3. Binary-search quality ──────────────────────────────────────────────
    let lo = minQuality;
    let hi = 0.95;
    let bestDataUrl = canvas.toDataURL(mime, hi);

    // Fast path: already small enough at high quality
    if (dataUrlBytes(bestDataUrl) <= targetBytes) {
      const compressedSize = dataUrlBytes(bestDataUrl);
      return {
        dataUrl: bestDataUrl,
        originalSize,
        compressedSize,
        width: tw,
        height: th,
        format,
        ratio: compressedSize / originalSize,
      };
    }

    // Binary search for the quality that just fits under targetBytes
    for (let pass = 0; pass < 8; pass++) {
      const mid = (lo + hi) / 2;
      const candidate = canvas.toDataURL(mime, mid);
      if (dataUrlBytes(candidate) <= targetBytes) {
        bestDataUrl = candidate;
        lo = mid; // could go higher quality
      } else {
        hi = mid; // need to compress more
      }
    }

    // If even minQuality is too large (very large photo), accept it
    if (dataUrlBytes(bestDataUrl) > targetBytes) {
      bestDataUrl = canvas.toDataURL(mime, minQuality);
    }

    const compressedSize = dataUrlBytes(bestDataUrl);
    return {
      dataUrl: bestDataUrl,
      originalSize,
      compressedSize,
      width: tw,
      height: th,
      format,
      ratio: compressedSize / originalSize,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Format bytes as human-readable string */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
