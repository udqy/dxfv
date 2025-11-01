export class ExportManager {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    this.exportPngBtn = document.getElementById('export-png');
    this.exportPrintBtn = document.getElementById('export-print');

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.exportPngBtn.addEventListener('click', () => this.exportPNG());
    this.exportPrintBtn.addEventListener('click', () => this.print());
  }

  exportPNG() {
    try {
      // Render the scene
      this.renderer.render(this.scene, this.camera);

      // Get image data
      const dataURL = this.renderer.domElement.toDataURL('image/png');

      // Create download link
      const link = document.createElement('a');
      link.download = `dxf-view-${Date.now()}.png`;
      link.href = dataURL;
      link.click();

      console.log('PNG exported successfully');
    } catch (error) {
      console.error('Error exporting PNG:', error);
      alert('Failed to export PNG. Please try again.');
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
