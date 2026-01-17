// ==========================================
// CONFIGURAÇÃO DO SUPABASE
// ==========================================

const SUPABASE_URL = 'https://lzqxhgndbgkhgxjmaofv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cXhoZ25kYmdraGd4am1hb2Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MDE4MzEsImV4cCI6MjA4NDE3NzgzMX0.Sh706V4Hg0B1lgDh4NOzQXuXRwbLy3lhrLgDQ1epf4s';

// Inicializar cliente Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
