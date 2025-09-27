import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Verhindert automatischen Port-Wechsel
  },
  build: {
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Supabase and auth
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // UI and utilities
          'utils': [
            './src/lib/authUtils.ts',
            './src/lib/logger.ts',
            './src/lib/usernameGenerator.ts'
          ],
          
          // Validation
          'validation': [
            './src/lib/validation/authValidation.ts',
            './src/lib/validation/commonValidation.ts',
            './src/lib/validation/profileValidation.ts'
          ],
          
          // Pages - split by functionality
          'auth-pages': [
            './src/pages/Login.advanced.tsx',
            './src/pages/AuthCallback.tsx',
            './src/pages/ForgotPassword.tsx',
            './src/pages/RecoverAccount.tsx',
            './src/pages/ResendConfirmation.tsx',
            './src/pages/EmailConfirmed.tsx',
            './src/pages/UsernameOnboarding.tsx'
          ],
          
          'dashboard-pages': [
            './src/pages/Dashboard.advanced.tsx',
            './src/pages/UserSettings.advanced.tsx'
          ],
          
          'recovery-pages': [
            './src/pages/AccountRecovery.tsx',
            './src/pages/AdminRecovery.tsx'
          ]
        }
      }
    }
  }
})
