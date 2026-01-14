import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteStaticCopy } from 'vite-plugin-static-copy';

// Build configuration for Chrome extension
// Content scripts and service workers need IIFE format (no ES module imports)
export default defineConfig(({ mode }) => {
  const isContentBuild = mode === 'content';
  const isBackgroundBuild = mode === 'background';

  // Separate builds for content script and background script
  if (isContentBuild) {
    return {
      plugins: [],
      build: {
        rollupOptions: {
          input: resolve(__dirname, 'src/content/content.ts'),
          output: {
            format: 'iife',
            entryFileNames: 'content/content.js',
            inlineDynamicImports: true,
          }
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: false,
        minify: true
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        }
      }
    };
  }

  if (isBackgroundBuild) {
    return {
      plugins: [],
      build: {
        rollupOptions: {
          input: resolve(__dirname, 'src/background/service-worker.ts'),
          output: {
            format: 'iife',
            entryFileNames: 'background/service-worker.js',
            inlineDynamicImports: true,
          }
        },
        outDir: 'dist',
        emptyOutDir: false,
        sourcemap: false,
        minify: true
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src'),
        }
      }
    };
  }

  // Main build for popup and dashboard (HTML pages support ES modules)
  return {
    plugins: [
      react(),
      viteStaticCopy({
        targets: [
          {
            src: 'public/icons/*',
            dest: 'icons'
          },
          {
            src: 'manifest.json',
            dest: '.'
          },
          {
            src: 'src/content/content.css',
            dest: 'content'
          }
        ]
      })
    ],
    build: {
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'src/popup/index.html'),
          dashboard: resolve(__dirname, 'src/dashboard/index.html'),
        },
        output: {
          entryFileNames: '[name]/[name].js',
          chunkFileNames: 'chunks/[name].[hash].js',
          assetFileNames: 'assets/[name].[ext]'
        }
      },
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: true
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      }
    }
  };
});
