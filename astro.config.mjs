// @ts-check
import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

// Previews on GitHub Pages live under /<repo>/: the workflow sets SITE_URL and SITE_BASE.
// A local build has neither, so the base is '/'. The production domain is set as SITE_URL
// in the Cloudflare Pages build settings (human task).
const site = process.env.SITE_URL || 'https://example.com';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  output: 'static',
  integrations: [
    preact(),
    sitemap({
      // the sitemap lists the real pages only, never the 404
      filter: (page) => !/\/404\/?$/.test(page),
    }),
  ],
});
