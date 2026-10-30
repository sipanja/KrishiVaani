import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://plbqzqfuslulbqqfquvg.supabase.co';
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'sb_publishable_yp8RnL2irA5t9qhzZDOrYg_Yav9yS8i';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Upload an image or audio file to Supabase Storage.
 * Creates/uses 'crop-photos' or 'recordings' bucket.
 */
export async function uploadToSupabaseStorage(
  bucket: string,
  filePath: string,
  file: File | Blob,
  contentType?: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        upsert: true,
        contentType: contentType || file.type || 'application/octet-stream',
      });

    if (error) {
      console.error('Supabase storage upload error:', error.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  } catch (err) {
    console.error('Failed to upload to Supabase storage:', err);
    return null;
  }
}
