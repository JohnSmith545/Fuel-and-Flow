import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import path from 'path'

const isE2E = process.env.VITE_E2E_TEST === 'true'

// Normalize Windows backslashes to forward slashes
const toForwardSlash = (p: string) => p.replace(/\\/g, '/')

// Vite plugin to redirect imports to mock files during E2E testing.
// Uses resolveId hook to match import suffixes, which works reliably
// across relative paths on all platforms.
function e2eMocks(): Plugin {
  const mocks: Record<string, string> = {
    '/providers/AuthProvider': toForwardSlash(
      path.resolve(__dirname, 'src/providers/MockAuthProvider.tsx')
    ),
    // Match both './useUserProfile' (within hooks/) and '../hooks/useUserProfile'
    '/useUserProfile': toForwardSlash(
      path.resolve(__dirname, 'src/hooks/MockUserProfile.ts')
    ),
    '/lib/firebase': toForwardSlash(
      path.resolve(__dirname, 'src/lib/firebase.mock.ts')
    ),
  }

  return {
    name: 'e2e-mocks',
    enforce: 'pre',
    resolveId(source) {
      for (const [suffix, replacement] of Object.entries(mocks)) {
        if (source.endsWith(suffix)) {
          return replacement
        }
      }
      return null
    },
  }
}

export default defineConfig({
  plugins: [TanStackRouterVite(), ...(isE2E ? [e2eMocks()] : []), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
