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

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## GitHub Pages Deployment

1. Push this repository to GitHub

2. Go to Settings > Pages

3. Set up GitHub Actions deployment:
   - Source: GitHub Actions
   - The workflow in `.github/workflows/deploy.yml` will automatically build and deploy

4. Access your viewer at: `https://your-username.github.io/dxf-view/`

## Usage

1. **Load a DXF file**:
   - Drag and drop a DXF file onto the viewer, or
   - Click to browse and select a file

2. **Navigate**:
   - Left mouse: Rotate view
   - Right mouse: Pan
   - Scroll wheel: Zoom
   - Reset button: Return to default view

3. **Layers** (button in toolbar):
   - View all layers in your DXF file
   - Click checkboxes to show/hide layers
   - Use Show All / Hide All for quick control

4. **Measure** (button in toolbar):
   - Click to activate measurement mode
   - Click two points to measure distance
   - Toggle between metric and imperial units
   - Clear button removes all measurements

5. **Export** (button in toolbar):
   - Export as PNG: Download current view as image
   - Print: Print the current view

## Technologies

- **Three.js**: 3D rendering engine
- **three-dxf**: DXF file parsing
- **Vite**: Build tool and dev server
- **Vanilla JavaScript**: No heavy frameworks

## Browser Support

Works in all modern browsers that support WebGL:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## License

MIT License - feel free to use and modify as needed.
