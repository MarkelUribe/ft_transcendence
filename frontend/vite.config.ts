import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

const certPath = (file: string) =>
  path.resolve(new URL('.', import.meta.url).pathname, '../certs', file);

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    https: {
      key: fs.readFileSync(certPath('localhost+2-key.pem')),
      cert: fs.readFileSync(certPath('localhost+2.pem')),
    },
    host: 'localhost',
    port: 5173,
  },
});