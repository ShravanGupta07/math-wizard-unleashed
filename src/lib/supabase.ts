import { createClient } from '@supabase/supabase-js';
import { Database } from '@/integrations/supabase/types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

// Create a single instance of the Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function uploadFile(file: File, bucket: string, path: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase storage is not available in local mode');
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file);

  if (error) {
    throw error;
  }

  return data;
}

export async function getFileUrl(bucket: string, path: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase storage is not available in local mode');
  }

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
} 