export class KeyboardShortcuts {
  constructor(viewer) {
    this.viewer = viewer;
    this.shortcuts = {
      'f': () => this.viewer.scene.resetView(), // Fit to view
      'r': () => this.viewer.scene.resetView(), // Reset view
      'l': () => this.togglePanel('layers'), // Toggle layers
      'e': () => this.togglePanel('export'), // Toggle export
      'h': () => this.viewer.toggleHelp(), // Toggle help
      '?': () => this.viewer.toggleHelp(), // Toggle help
      'Escape': () => this.closeAllPanels(), // Close all panels
    };

    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      // Don't trigger shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key;
      const handler = this.shortcuts[key];

      if (handler) {
        e.preventDefault();
        handler();
      }
    });
  }

  togglePanel(panelType) {
    switch (panelType) {
      case 'layers':
        this.viewer.btnLayers.click();
        break;
      case 'export':
        this.viewer.btnExport.click();
        break;
    }
  }

  closeAllPanels() {
    this.viewer.closePanel(this.viewer.layersPanel, this.viewer.btnLayers);
    this.viewer.closePanel(this.viewer.exportPanel, this.viewer.btnExport);

    // Also close help if open
    const helpOverlay = document.getElementById('help-overlay');
    if (helpOverlay && !helpOverlay.classList.contains('hidden')) {
      this.viewer.toggleHelp();
    }
  }
}
