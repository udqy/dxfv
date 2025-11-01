export class LayerManager {
  constructor(dxfLoader) {
    this.dxfLoader = dxfLoader;
    this.listElement = document.getElementById('layers-list');
    this.showAllBtn = document.getElementById('show-all-layers');
    this.hideAllBtn = document.getElementById('hide-all-layers');

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.showAllBtn.addEventListener('click', () => {
      this.dxfLoader.showAllLayers();
      this.updateLayerList();
    });

    this.hideAllBtn.addEventListener('click', () => {
      this.dxfLoader.hideAllLayers();
      this.updateLayerList();
    });
  }

  updateLayerList() {
    const layers = this.dxfLoader.getLayers();

    if (layers.length === 0) {
      this.listElement.innerHTML = '<p class="placeholder">No layers loaded</p>';
      return;
    }

    this.listElement.innerHTML = '';

    layers.forEach(layer => {
      const item = document.createElement('div');
      item.className = 'layer-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'layer-checkbox';
      checkbox.checked = layer.visible;
      checkbox.addEventListener('change', (e) => {
        this.dxfLoader.toggleLayer(layer.name, e.target.checked);
      });

      const colorBox = document.createElement('div');
      colorBox.className = 'layer-color';
      colorBox.style.backgroundColor = `#${layer.color.toString(16).padStart(6, '0')}`;

      const name = document.createElement('span');
      name.className = 'layer-name';
      name.textContent = layer.name;

      item.appendChild(checkbox);
      item.appendChild(colorBox);
      item.appendChild(name);

      item.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      });

      this.listElement.appendChild(item);
    });
  }

  clear() {
    this.listElement.innerHTML = '<p class="placeholder">No layers loaded</p>';
  }
}
