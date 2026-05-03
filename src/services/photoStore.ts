/**
 * Photo store
 *  - Source of truth: Google Drive (via Cloudflare Worker proxy)
 *  - Cache: IndexedDB on the uploading device for instant / offline access
 *
 * Photo IDs are Google Drive file IDs and are persisted inside trip JSON,
 * so syncing trip data is enough — every device can resolve the URL via
 * the Worker proxy.
 */
import { get, set, del, keys, createStore } from 'idb-keyval';
import imageCompression from 'browser-image-compression';

const photoStore = createStore('travel-app-photos', 'photos');
const WORKER_URL = 'https://visa-rate.aa85192.workers.dev';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.8,
};

async function compressImage(file: File): Promise<Blob> {
  return imageCompression(file, COMPRESSION_OPTIONS);
}

/** Compress, upload to Drive via Worker, cache locally. Returns Drive fileId. */
export async function savePhoto(file: File | Blob): Promise<string> {
  const blob = file instanceof File ? await compressImage(file) : file;
  const res = await fetch(`${WORKER_URL}/photo`, {
    method: 'POST',
    headers: { 'Content-Type': blob.type || 'image/webp' },
    body: blob,
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new Error(`upload failed (${res.status}): ${errBody.slice(0, 200)}`);
  }
  const { id } = (await res.json()) as { id: string };
  await set(id, blob, photoStore);
  return id;
}

const urlCache = new Map<string, string>();

/**
 * Resolve a photoId to a displayable URL.
 *   IndexedDB hit → blob URL (fast, offline)
 *   miss          → Worker proxy URL (pulls from Drive on demand)
 */
export async function getPhotoUrl(id: string): Promise<string | null> {
  if (!id) return null;
  if (urlCache.has(id)) return urlCache.get(id)!;
  try {
    const blob = await get<Blob>(id, photoStore);
    if (blob) {
      const url = URL.createObjectURL(blob);
      urlCache.set(id, url);
      return url;
    }
  } catch (e) {
    console.warn('[photoStore] IndexedDB read failed, falling back to remote:', e);
  }
  const url = `${WORKER_URL}/photo/${encodeURIComponent(id)}`;
  urlCache.set(id, url);
  return url;
}

/** Remove a Worker URL from the in-memory cache so the next render retries the network. */
export function evictPhotoUrl(id: string): void {
  const cached = urlCache.get(id);
  if (cached && cached.startsWith('blob:')) URL.revokeObjectURL(cached);
  urlCache.delete(id);
}

export async function deletePhoto(id: string): Promise<void> {
  const cached = urlCache.get(id);
  if (cached && cached.startsWith('blob:')) URL.revokeObjectURL(cached);
  urlCache.delete(id);
  await del(id, photoStore);
  fetch(`${WORKER_URL}/photo/${encodeURIComponent(id)}`, { method: 'DELETE' })
    .catch((e) => console.warn('[photoStore] remote delete failed:', e));
}

/** GC stale local cache entries. Drive remains source of truth. */
export async function pruneOrphanPhotos(referencedIds: Set<string>): Promise<number> {
  const all = await keys(photoStore);
  let removed = 0;
  for (const k of all) {
    const id = String(k);
    if (!referencedIds.has(id)) {
      const cached = urlCache.get(id);
      if (cached && cached.startsWith('blob:')) URL.revokeObjectURL(cached);
      urlCache.delete(id);
      await del(id, photoStore);
      removed++;
    }
  }
  return removed;
}
