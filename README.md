# DXF Viewer

A minimal, client-side DXF file viewer built with Three.js. View 2D and 3D DXF files directly in your browser with no signup required.

## Features

- **Drag & Drop**: Simply drag and drop DXF files to view them
- **Pan/Zoom/Rotate**: Full 3D navigation with mouse controls
- **Layer Management**: Toggle visibility of individual layers
- **Measurements**: Measure distances with metric/imperial units
- **Export**: Save screenshots as PNG or print directly
- **Cross-platform**: Works on Windows, Linux, and macOS
- **No Backend**: 100% client-side, your files never leave your browser

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start dev server:
```bash
npm run dev
```

3. Open your browser to the URL shown (typically http://localhost:5173)

## Stack:

- **Three.js**: 3D rendering engine
- **three-dxf**: DXF file parsing
- **Vite**: Build tool and dev server
- **Vanilla JavaScript**: No heavy frameworks

