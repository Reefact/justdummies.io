// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
    site: 'https://justdummies.io',

    // The whole deployment is one static directory at the repository root, and the
    // published playground is copied into it under /playground/ afterwards
    // (scripts/build-site.sh). Building straight into it keeps the two halves from
    // ever being assembled in two different places.
    outDir: '../../dist',

    // Directory format writes /tooling/index.html rather than /tooling.html, so a
    // static host serves /tooling and /tooling/ alike without a redirect rule.
    build: {
        format: 'directory',

        // Astro inlines small stylesheets into the document by default. Every one it
        // inlines is an inline <style>, and an inline <style> forces the Content
        // Security Policy to allow 'unsafe-inline' for styles — which disables the
        // protection for every stylesheet on the site, to save one request. Emitting
        // stylesheets as files keeps style-src at 'self'. scripts/verify-output.sh
        // asserts the result rather than trusting this setting.
        inlineStylesheets: 'never',
    },
});
