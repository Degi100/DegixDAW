#!/bin/bash
# Clean up old toast system from all pages

PAGES=(
  "Dashboard.advanced.tsx"
  "UserSettings.advanced.tsx" 
  "UsernameOnboarding.tsx"
  "ResendConfirmation.tsx"
  "ForgotPassword.tsx"
  "AccountRecovery.tsx"
  "RecoverAccount.tsx"
  "AdminRecovery.tsx"
)

for page in "${PAGES[@]}"; do
  echo "Cleaning $page..."
  
  # Remove ToastContainer import
  sed -i '/import.*ToastContainer.*from/d' "src/pages/$page"
  
  # Remove toasts, removeToast from useToast destructuring
  sed -i 's/, toasts, removeToast//g' "src/pages/$page"
  
  # Remove ToastContainer JSX usage (multi-line removal)
  sed -i '/<ToastContainer/,/\/>/d' "src/pages/$page"
  
  echo "$page cleaned"
done

echo "All pages cleaned!"