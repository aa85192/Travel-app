/**
 * Local-only photo store backed by IndexedDB.
 * Blobs never leave the device — only photo IDs are persisted in trip data
 * and synced to other devices, which then show a placeholder if the blob is
 * missing locally.
 */
import { get, set, del, keys, createStore } from 'idb-keyval';
import imageCompression from 'browser-image-compression';

const photoStore = createStore('travel-app-photos', 'photos');

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.3,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
  fileType: 'image/webp' as const,
  initialQuality: 0.8,
};

function newPhotoId(): string {
  return `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function savePhoto(file: File | Blob): Promise<string> {
  const compressed = file instanceof File && file.size > COMPRESSION_OPTIONS.maxSizeMB * 1024 * 1024
    ? await imageCompression(file, COMPRESSION_OPTIONS)
    : file;
  const id = newPhotoId();
  await set(id, compressed, photoStore);
  return id;
}

const urlCache = new Map<string, string>();

export async function getPhotoUrl(id: string): Promise<string | null> {
  if (urlCache.has(id)) return urlCache.get(id)!;
  const blob = await get<Blob>(id, photoStore);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  urlCache.set(id, url);
  return url;
}

export async function deletePhoto(id: string): Promise<void> {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
  await del(id, photoStore);
}

/** Garbage-collect blobs no longer referenced by any spot/trip. */
export async function pruneOrphanPhotos(referencedIds: Set<string>): Promise<number> {
  const all = await keys(photoStore);
  let removed = 0;
  for (const k of all) {
    const id = String(k);
    if (!referencedIds.has(id)) {
      await deletePhoto(id);
      removed++;
    }
  }
  return removed;
}
