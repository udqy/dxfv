import * as THREE from 'three';

export class MeasurementTool {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.points = [];
    this.markers = [];
    this.lines = [];
    this.active = false;
    this.units = 'metric'; // 'metric' or 'imperial'

    this.resultElement = document.getElementById('measure-result');
    this.clearBtn = document.getElementById('clear-measurements');

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Unit toggle
    document.querySelectorAll('input[name="units"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.units = e.target.value;
        if (this.points.length === 2) {
          this.displayResult();
        }
      });
    });

    // Clear measurements
    this.clearBtn.addEventListener('click', () => this.clear());
  }

  activate() {
    this.active = true;
    this.renderer.domElement.style.cursor = 'crosshair';
  }

  deactivate() {
    this.active = false;
    this.renderer.domElement.style.cursor = 'default';
  }

  onClick(event) {
    if (!this.active) return;

    // Calculate mouse position
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const model = this.scene.getObjectByName('DXF Model');

    if (!model) return;

    const intersects = this.raycaster.intersectObjects(model.children, true);

    if (intersects.length > 0) {
      const point = intersects[0].point;
      this.addPoint(point);

      if (this.points.length === 2) {
        this.drawLine();
        this.displayResult();
        this.points = []; // Reset for next measurement
      }
    }
  }

  addPoint(point) {
    this.points.push(point);

    // Create marker
    const geometry = new THREE.SphereGeometry(0.5, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.copy(point);
    marker.userData.isMeasurement = true;

    this.scene.scene.add(marker);
    this.markers.push(marker);
  }

  drawLine() {
    if (this.points.length !== 2) return;

    const geometry = new THREE.BufferGeometry().setFromPoints(this.points);
    const material = new THREE.LineBasicMaterial({
      color: 0xff0000,
      linewidth: 2,
      depthTest: false
    });
    const line = new THREE.Line(geometry, material);
    line.userData.isMeasurement = true;

    this.scene.scene.add(line);
    this.lines.push(line);
  }

  displayResult() {
    if (this.points.length !== 2) return;

    const distance = this.points[0].distanceTo(this.points[1]);
    const converted = this.convertUnits(distance);

    this.resultElement.innerHTML = `
      <p>Distance</p>
      <div class="value">${converted}</div>
    `;
  }

  convertUnits(value) {
    if (this.units === 'metric') {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(3)} m`;
      } else if (value >= 1) {
        return `${value.toFixed(2)} mm`;
      } else {
        return `${(value * 1000).toFixed(2)} μm`;
      }
    } else {
      // Convert to inches (assuming DXF units are mm)
      const inches = value / 25.4;
      if (inches >= 12) {
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        return `${feet}' ${remainingInches.toFixed(2)}"`;
      } else {
        return `${inches.toFixed(2)}"`;
      }
    }
  }

  clear() {
    // Remove markers
    this.markers.forEach(marker => {
      this.scene.scene.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
    });
    this.markers = [];

    // Remove lines
    this.lines.forEach(line => {
      this.scene.scene.remove(line);
      line.geometry.dispose();
      line.material.dispose();
    });
    this.lines = [];

    // Reset points
    this.points = [];

    // Reset result
    this.resultElement.innerHTML = '<p>Click two points to measure distance</p>';
  }

  clearAll() {
    this.clear();
    this.deactivate();
  }
}
