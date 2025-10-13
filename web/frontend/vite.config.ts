import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true, // Verhindert automatischen Port-Wechsel
    host: true, // Ermöglicht Zugriff aus dem Netzwerk
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
          
          // Validation and utilities
          'zod-vendor': ['zod'],
          'utils': [
            './src/lib/authUtils.ts',
            './src/lib/usernameGenerator.ts',
            './src/lib/urlUtils.ts'
          ],
          
          // Validation
          'validation': [
            './src/lib/validation/authValidation.ts',
            './src/lib/validation/commonValidation.ts',
            './src/lib/validation/profileValidation.ts'
          ],
          
          // Hooks
          'hooks': [
            './src/hooks/useAuth.ts',
            './src/hooks/useConversations.ts',
            './src/hooks/useMessages.ts'
          ],
          
          // Pages - split by functionality
          'auth-pages': [
            './src/pages/auth/Login.advanced.tsx',
            './src/pages/auth/AuthCallback.tsx',
            './src/pages/auth/ForgotPassword.tsx',
            './src/pages/auth/ResendConfirmation.tsx'
          ],
          
          'dashboard-pages': [
            './src/pages/dashboard/Dashboard.corporate.tsx'
          ],
          
          'recovery-pages': [
            './src/pages/account/AccountRecovery.tsx',
            './src/pages/account/AdminRecovery.tsx',
            './src/pages/account/RecoverAccount.tsx',
            './src/pages/account/EmailConfirmed.tsx',
            './src/pages/account/EmailChangeConfirmation.tsx',
            './src/pages/onboarding/UsernameOnboarding.tsx'
          ]
        }
      }
    }
  }
})
