import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://ooxbligcarljrdjievjn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9veGJsaWdjYXJsanJkamlldmpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwMzg3NDUsImV4cCI6MjA5MDYxNDc0NX0.cfMRuUMKqrlryx2N79FvrIEOyKncPEwXOXO_qafFJHs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});