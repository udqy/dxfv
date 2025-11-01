import { Scene } from './scene.js';
import { DXFLoader } from './dxfLoader.js';
import { LayerManager } from './layers.js';
import { MeasurementTool } from './measurements.js';
import { ExportManager } from './export.js';

class DXFViewer {
  constructor() {
    // DOM Elements
    this.container = document.getElementById('viewer');
    this.dropZone = document.getElementById('drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.fileNameDisplay = document.getElementById('file-name');
    this.loading = document.getElementById('loading');

    // Panels
    this.layersPanel = document.getElementById('layers-panel');
    this.measurePanel = document.getElementById('measure-panel');
    this.exportPanel = document.getElementById('export-panel');

    // Buttons
    this.btnLayers = document.getElementById('btn-layers');
    this.btnMeasure = document.getElementById('btn-measure');
    this.btnExport = document.getElementById('btn-export');
    this.btnReset = document.getElementById('btn-reset');

    // Initialize modules
    this.scene = new Scene(this.container);
    this.dxfLoader = new DXFLoader();
    this.layerManager = new LayerManager(this.dxfLoader);
    this.measurementTool = new MeasurementTool(
      this.scene,
      this.scene.getCamera(),
      this.scene.getRenderer()
    );
    this.exportManager = new ExportManager(
      this.scene.getRenderer(),
      this.scene.getScene(),
      this.scene.getCamera()
    );

    this.currentFileName = '';

    this.init();
  }

  init() {
    this.setupDragAndDrop();
    this.setupToolbar();
    this.setupPanels();
    this.setupMeasurement();
  }

  setupDragAndDrop() {
    // Click to open file dialog
    this.dropZone.addEventListener('click', () => {
      this.fileInput.click();
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.loadFile(file);
      }
    });

    // Prevent default drag behaviors on drop zone
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Highlight drop zone when dragging over
    ['dragenter', 'dragover'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, () => {
        this.dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      this.dropZone.addEventListener(eventName, () => {
        this.dropZone.classList.remove('drag-over');
      });
    });

    // Handle dropped files on drop zone
    this.dropZone.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.dxf')) {
          this.loadFile(file);
        } else {
          alert('Please drop a DXF file');
        }
      }
    });

    // Also enable drag and drop on the entire container (for when a file is already loaded)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      this.container.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Show drop zone overlay when dragging over container
    this.container.addEventListener('dragenter', (e) => {
      if (e.dataTransfer.types.includes('Files')) {
        this.dropZone.classList.remove('hidden');
        this.dropZone.classList.add('drag-over');
      }
    });

    // Handle dropped files on container
    this.container.addEventListener('drop', (e) => {
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.name.toLowerCase().endsWith('.dxf')) {
          this.loadFile(file);
        } else {
          alert('Please drop a DXF file');
        }
      }
    });
  }

  setupToolbar() {
    // Layers button
    this.btnLayers.addEventListener('click', () => {
      this.togglePanel(this.layersPanel, this.btnLayers);
      this.closePanel(this.measurePanel, this.btnMeasure);
      this.closePanel(this.exportPanel, this.btnExport);
    });

    // Measure button
    this.btnMeasure.addEventListener('click', () => {
      this.togglePanel(this.measurePanel, this.btnMeasure);
      this.closePanel(this.layersPanel, this.btnLayers);
      this.closePanel(this.exportPanel, this.btnExport);

      if (!this.measurePanel.classList.contains('hidden')) {
        this.measurementTool.activate();
      } else {
        this.measurementTool.deactivate();
      }
    });

    // Export button
    this.btnExport.addEventListener('click', () => {
      this.togglePanel(this.exportPanel, this.btnExport);
      this.closePanel(this.layersPanel, this.btnLayers);
      this.closePanel(this.measurePanel, this.btnMeasure);
    });

    // Reset view button
    this.btnReset.addEventListener('click', () => {
      this.scene.resetView();
    });
  }

  setupPanels() {
    // Close buttons
    document.querySelectorAll('.panel .close-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const panel = btn.closest('.panel');
        this.closePanel(panel);

        // Deactivate measurement tool if measure panel is closed
        if (panel === this.measurePanel) {
          this.measurementTool.deactivate();
          this.btnMeasure.classList.remove('active');
        }

        // Remove active state from all buttons
        [this.btnLayers, this.btnMeasure, this.btnExport].forEach(b => {
          if (panel.id === 'layers-panel' && b === this.btnLayers) b.classList.remove('active');
          if (panel.id === 'measure-panel' && b === this.btnMeasure) b.classList.remove('active');
          if (panel.id === 'export-panel' && b === this.btnExport) b.classList.remove('active');
        });
      });
    });
  }

  setupMeasurement() {
    // Handle clicks for measurement
    this.scene.getRenderer().domElement.addEventListener('click', (e) => {
      if (this.measurementTool.active) {
        this.measurementTool.onClick(e);
      }
    });
  }

  togglePanel(panel, button) {
    const isHidden = panel.classList.contains('hidden');

    if (isHidden) {
      panel.classList.remove('hidden');
      if (button) button.classList.add('active');
    } else {
      panel.classList.add('hidden');
      if (button) button.classList.remove('active');
    }
  }

  closePanel(panel, button) {
    panel.classList.add('hidden');
    if (button) button.classList.remove('active');
  }

  async loadFile(file) {
    try {
      // Show loading
      this.loading.classList.remove('hidden');
      this.dropZone.classList.add('hidden');

      // Load DXF
      const result = await this.dxfLoader.load(file);

      // Add model to scene
      this.scene.addModel(result.model);

      // Update UI
      this.currentFileName = file.name;
      this.fileNameDisplay.textContent = file.name;

      // Update layers
      this.layerManager.updateLayerList();

      // Clear measurements
      this.measurementTool.clearAll();

      // Hide loading
      this.loading.classList.add('hidden');

      console.log('DXF loaded successfully:', result.info);
    } catch (error) {
      console.error('Error loading DXF:', error);
      alert(`Failed to load DXF file: ${error.message}`);

      // Show drop zone again
      this.dropZone.classList.remove('hidden');
      this.loading.classList.add('hidden');
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new DXFViewer();
});
