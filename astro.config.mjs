// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  base: './',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
    server: {
      port: 4321,
      strictPort: true
    }
  }
});