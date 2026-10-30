import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || 'https://plbqzqfuslulbqqfquvg.supabase.co';
const SUPABASE_ANON_KEY = 
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || 
  'sb_publishable_yp8RnL2irA5t9qhzZDOrYg_Yav9yS8i';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
