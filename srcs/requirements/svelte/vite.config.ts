import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
    host: true,
    port: 5173,
    https: {
      key: readFileSync('/run/secrets/ssl_key'),
      cert: readFileSync('/run/secrets/ssl_cert'),
    },
  },
});
