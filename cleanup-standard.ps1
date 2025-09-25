# PowerShell script to clean up unused files
Write-Host "Cleaning up unused files..."

# Standard Vite files we don't need anymore
$filesToDelete = @(
    "src\App.tsx",
    "src\App.css", 
    "src\index.css",
    "src\assets\react.svg"
)

foreach ($file in $filesToDelete) {
    $fullPath = "e:\DegixDAW\web\frontend\$file"
    if (Test-Path $fullPath) {
        Remove-Item $fullPath -Force
        Write-Host "Deleted: $file"
    } else {
        Write-Host "File not found: $file"
    }
}

Write-Host "Cleanup of standard Vite files completed!"