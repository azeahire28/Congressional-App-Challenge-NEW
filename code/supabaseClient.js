import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const URL = 'https://ktsljnfeazyjxadijaxs.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt0c2xqbmZlYXp5anhhZGlqYXhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE2Mzk4NDIsImV4cCI6MjEwNzIxNTg0Mn0.llkQzNdnlL1seCsbytjV8Pxl1-5oCBZNpMQni3hOGlE';

// using cdn export here cause standard require was breaking electron renderer build
export const supabase = createClient(URL, KEY);