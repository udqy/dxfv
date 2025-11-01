import * as THREE from 'three';

export class ExportManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.originalBackground = null;

    this.exportPngBtn = document.getElementById('export-png');
    this.exportPngTransparentBtn = document.getElementById('export-png-transparent');
    this.exportSvgBtn = document.getElementById('export-svg');
    this.exportPrintBtn = document.getElementById('export-print');

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.exportPngBtn.addEventListener('click', () => this.exportPNG(false));
    this.exportPngTransparentBtn.addEventListener('click', () => this.exportPNG(true));
    this.exportSvgBtn.addEventListener('click', () => this.exportSVG());
    this.exportPrintBtn.addEventListener('click', () => this.print());
  }

  exportPNG(transparent = false) {
    try {
      // Save original settings
      const originalBackground = this.scene.background;
      const originalAlpha = this.renderer.getClearAlpha();

      if (transparent) {
        // Set transparent background
        this.scene.background = null;
        this.renderer.setClearColor(0x000000, 0);
      }

      // Render the scene
      this.renderer.render(this.scene, this.camera);

      // Get image data
      const dataURL = this.renderer.domElement.toDataURL('image/png');

      // Restore original settings
      this.scene.background = originalBackground;
      this.renderer.setClearColor(0x000000, originalAlpha);

      // Create download link
      const link = document.createElement('a');
      const suffix = transparent ? '-transparent' : '';
      link.download = `dxf-view${suffix}-${Date.now()}.png`;
      link.href = dataURL;
      link.click();

      console.log(`PNG${transparent ? ' (transparent)' : ''} exported successfully`);
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
    }
  }

  exportSVG() {
    try {
      // Get the DXF model
      const model = this.scene.getObjectByName('DXF Model');
      if (!model) {
        alert('No DXF model loaded');
        return;
      }

      // Create SVG content
      let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 1000 1000">
  <g transform="scale(1,-1) translate(500,500)">
`;

      // Process each line in the model
      model.traverse((child) => {
        if (child.isLine || child.isLineLoop || child.isLineSegments) {
          const positions = child.geometry.attributes.position.array;
          const color = child.material.color ? `#${child.material.color.getHexString()}` : '#000000';

          // Create polyline or path from positions
          let points = '';
          for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            points += `${x},${y} `;
          }

          if (child.isLineLoop) {
            svg += `    <polygon points="${points}" fill="none" stroke="${color}" stroke-width="0.5"/>\n`;
          } else {
            svg += `    <polyline points="${points}" fill="none" stroke="${color}" stroke-width="0.5"/>\n`;
          }
        }
      });

      svg += `  </g>
</svg>`;

      // Create download link
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `dxf-view-${Date.now()}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      console.log('SVG exported successfully');
    } catch (error) {
      console.error('Error exporting SVG:', error);
      alert('Failed to export SVG. Please try again.');
    }
  }

  print() {
    try {
      // Render the scene
      this.renderer.render(this.scene, this.camera);

      // Get image data
      const dataURL = this.renderer.domElement.toDataURL('image/png');

      // Create print window
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print DXF View</title>
          <style>
            body {
              margin: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              max-height: 100vh;
              object-fit: contain;
            }
            @media print {
              body {
                margin: 0;
              }
              img {
                max-width: 100%;
                height: auto;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <img src="${dataURL}" alt="DXF View">
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing:', error);
      alert('Failed to print. Please try again.');
    }
  }
}
