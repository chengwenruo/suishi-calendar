# SuiShi Calendar

SuiShi Calendar is a sidebar calendar plugin for SiYuan Notes with Gregorian/Lunar dates, Chinese holidays, 24 solar terms, and quick daily-note create/open.

## Features

- Month view with ISO week numbers
- Lunar display with festival/solar-term priority
- Built-in 2026 holiday and make-up workday schedule
- Click any date to create/open its daily note
- 1-3 activity dots based on note length (configurable threshold)
- Font modes: follow SiYuan / follow sidebar / fixed size
- Quarter label modes: numeric or seasons
- Appearance styles: card or minimal

## Settings Entry

- SiYuan: `Settings -> Marketplace -> Installed -> SuiShi Calendar -> Settings`
- Top bar button: `SuiShi Calendar Settings`
- Command palette: `Open SuiShi Calendar Settings`

## Packaging for Marketplace

Follow SiYuan plugin sample marketplace requirements:

- Use semantic versioning in `plugin.json`
- Keep plugin folder name equal to `plugin.json.name` (`suishi-calendar`)
- Zip runtime files at root level (no extra parent folder)
- Exclude `node_modules` and development artifacts

### Build

- Windows: `build.bat`
- macOS/Linux: `bash build.sh`

This generates `package.zip` ready for release.

## Runtime Files

```text
index.js
index.css
plugin.json
i18n/
README.md
README_zh_CN.md
LICENSE
icon.png
preview.png
```
