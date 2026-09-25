import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string | undefined => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
  } catch (e) {}
  try {
    const globalProcess = (globalThis as any).process;
    if (typeof globalProcess !== 'undefined' && globalProcess.env) {
      if (globalProcess.env[key] !== undefined) {
        return globalProcess.env[key];
      }
      if (typeof window === 'undefined') {
        try {
          const getModule = (name: string) => {
            if (typeof globalProcess.getBuiltinModule === 'function') {
              return globalProcess.getBuiltinModule(name);
            }
            if (typeof (globalThis as any).require === 'function') {
              return (globalThis as any).require(name);
            }
            return null;
          };
          const fs = getModule('fs');
          const path = getModule('path');
          if (fs && path) {
            const envFile = path.resolve(globalProcess.cwd(), '.env');
            if (fs && fs.existsSync(envFile)) {
              const text = fs.readFileSync(envFile, 'utf8');
              for (const line of text.split('\n')) {
                const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
                if (match && match[1] === key) {
                  let val = (match[2] || '').trim();
                  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                  }
                  globalProcess.env[key] = val;
                  return val;
                }
              }
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {}
  return undefined;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Check whether real Supabase credentials are provided
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('your-project-ref') &&
  supabaseUrl.startsWith('http')
);

// Client instance; instantiated if credentials are provided
export const supabase: SupabaseClient | null = isSupabaseConfigured && supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
