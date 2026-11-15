import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Supabase Storage for report and resolution photos. The app keeps its
// own JWT auth (NOT Supabase Auth), so uploads run server-side with
// the service-role key, which bypasses Storage RLS. The anon key is
// never used here, and the service-role key must never reach the
// browser — this module is server-only.
export const REPORT_IMAGES_BUCKET = 'report-images';

let supabase = null;

function getSupabase() {
  if (supabase) return supabase;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'Supabase Storage is not configured (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)'
    );
  }
  supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabase;
}

// Upload a buffer to the bucket and return its public URL, which is
// what gets stored in report_images.url / reports.resolution_image_url.
export async function uploadToBucket(path, buffer, contentType) {
  const { error } = await getSupabase()
    .storage.from(REPORT_IMAGES_BUCKET)
    .upload(path, buffer, { contentType, upsert: false });
  if (error) {
    throw new Error(`Supabase Storage upload failed: ${error.message}`);
  }
  const { data } = getSupabase()
    .storage.from(REPORT_IMAGES_BUCKET)
    .getPublicUrl(path);
  return data.publicUrl;
}

// Best-effort delete; logs and swallows failures (callers use this
// for rollback/cleanup, where a failed delete must not mask the
// original result).
export async function deleteFromBucket(path) {
  const { error } = await getSupabase()
    .storage.from(REPORT_IMAGES_BUCKET)
    .remove([path]);
  if (error) {
    console.error('Supabase Storage delete failed:', path, error.message);
  }
}

// Delete whatever a stored image URL points at: a Storage object for
// Supabase URLs, or the legacy local file for pre-migration
// /uploads/... URLs (kept so deleting old reports still cleans up).
export async function deleteByUrl(url) {
  if (!url) return;
  if (url.startsWith('/uploads/')) {
    const { unlink } = await import('fs/promises');
    const { default: path } = await import('path');
    try {
      await unlink(path.join(process.cwd(), 'public', url));
    } catch (err) {
      console.error('deleteByUrl: failed to delete legacy file', url, err);
    }
    return;
  }
  const marker = `/storage/v1/object/public/${REPORT_IMAGES_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return;
  await deleteFromBucket(url.slice(idx + marker.length));
}
