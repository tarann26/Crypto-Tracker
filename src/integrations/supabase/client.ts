import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cdccawkflcwfgpekyrjh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkY2Nhd2tmbGN3ZmdwZWt5cmpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5Mzg2NDIsImV4cCI6MjA2NTUxNDY0Mn0.HWziQlgyPpPsMyvEqvm3WNhe-aeZrCL1Ypk8OS2U2ds";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);