import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(mode),
      VITE_SUPABASE_URL: JSON.stringify(process.env.VITE_SUPABASE_URL),
      VITE_SUPABASE_ANON_KEY: JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
      VITE_API_BASE_URL: JSON.stringify(process.env.VITE_API_BASE_URL),
      VITE_FLUVIO_WSL_IP: JSON.stringify(process.env.VITE_FLUVIO_WSL_IP),
    },
    'process.platform': JSON.stringify('browser'),
    'process.version': JSON.stringify('v16.0.0'),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@radix-ui/react-tooltip'],
    exclude: ['@types/three'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
}));
