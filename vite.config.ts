import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // API Key provided explicitly for deployment
  const DEFAULT_API_KEY = 'AIzaSyCxKIgmXjXVUm8T4SNsL2w7K5cjl2IDfTw';

  return {
    plugins: [react()],
    define: {
      // Polyfill process.env.API_KEY so it works in the browser
      // Uses the provided key if no environment variable is found
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || DEFAULT_API_KEY)
    }
  };
});