@echo off
setlocal

set "ROOT=%~dp0"
if "%ROOT:~-1%"=="\" set "ROOT=%ROOT:~0,-1%"

powershell -NoLogo -NoProfile -Command "$ErrorActionPreference = 'Stop'; $root = $env:ROOT; Set-Location -LiteralPath $root; $tmp = Join-Path ([System.IO.Path]::GetTempPath()) ('suishi_calendar_pkg_' + [guid]::NewGuid().ToString('N')); New-Item -ItemType Directory -Path $tmp | Out-Null; try { $files = @('index.js','index.css','plugin.json','README.md','README_zh_CN.md','LICENSE','icon.png','preview.png'); foreach ($f in $files) { Copy-Item -LiteralPath (Join-Path $root $f) -Destination (Join-Path $tmp $f) -Force }; Copy-Item -LiteralPath (Join-Path $root 'i18n') -Destination (Join-Path $tmp 'i18n') -Recurse -Force; if (Test-Path -LiteralPath 'package.zip') { Remove-Item -LiteralPath 'package.zip' -Force }; Compress-Archive -Path (Join-Path $tmp '*') -DestinationPath 'package.zip' -Force; Write-Host ('Done: ' + (Join-Path $root 'package.zip')) } finally { if (Test-Path -LiteralPath $tmp) { Remove-Item -LiteralPath $tmp -Recurse -Force } }"
if errorlevel 1 (
  echo Failed to build package.zip
  exit /b 1
)

endlocal


