@echo off
echo Cleaning up unused standard Vite files...

if exist "src\App.tsx" (
    del "src\App.tsx"
    echo Deleted: src\App.tsx
) else (
    echo File not found: src\App.tsx
)

if exist "src\App.css" (
    del "src\App.css"
    echo Deleted: src\App.css
) else (
    echo File not found: src\App.css
)

if exist "src\index.css" (
    del "src\index.css"
    echo Deleted: src\index.css
) else (
    echo File not found: src\index.css
)

if exist "src\assets\react.svg" (
    del "src\assets\react.svg"
    echo Deleted: src\assets\react.svg
) else (
    echo File not found: src\assets\react.svg
)

echo Standard Vite files cleanup completed!