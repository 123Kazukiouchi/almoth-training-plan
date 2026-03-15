import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ydanbmpnfiixcdqwdaok.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlkYW5ibXBuZmlpeGNkcXdkYW9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0OTIxNTQsImV4cCI6MjA4OTA2ODE1NH0.2o0J-p-q2Id9DXApJiR9SZ-Fbi6fOMRHLE7lRrUVy1g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
