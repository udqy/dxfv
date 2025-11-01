import * as THREE from 'three';
import DxfParser from 'dxf-parser';

export class DXFLoader {
  constructor() {
    this.parser = new DxfParser();
    this.layers = new Map();
  }

  async load(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const dxfString = event.target.result;
          const dxf = this.parser.parseSync(dxfString);

          if (!dxf) {
            throw new Error('Failed to parse DXF file');
          }

          const model = this.createModel(dxf);
          this.extractLayers(model);

          resolve({
            model,
            layers: this.layers,
            info: {
              version: dxf.header?.$ACADVER || 'Unknown',
              entities: dxf.entities?.length || 0,
              layers: this.layers.size
            }
          });
        } catch (error) {
          reject(new Error(`Error parsing DXF: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };

      reader.readAsText(file);
    });
  }

  createModel(dxf) {
    const group = new THREE.Group();
    group.name = 'DXF Model';

    if (!dxf.entities || dxf.entities.length === 0) {
      console.warn('No entities found in DXF file');
      return group;
    }

    // Process entities
    dxf.entities.forEach((entity) => {
      try {
        const mesh = this.createEntityMesh(entity);
        if (mesh) {
          mesh.userData.layer = entity.layer || '0';
          mesh.userData.entityType = entity.type;
          group.add(mesh);
        }
      } catch (error) {
        console.warn(`Failed to create entity: ${entity.type}`, error);
      }
    });

    return group;
  }

  createEntityMesh(entity) {
    const color = this.getEntityColor(entity);

    switch (entity.type) {
      case 'LINE':
        return this.createLine(entity, color);
      case 'POLYLINE':
      case 'LWPOLYLINE':
        return this.createPolyline(entity, color);
      case 'CIRCLE':
        return this.createCircle(entity, color);
      case 'ARC':
        return this.createArc(entity, color);
      case 'SPLINE':
        return this.createSpline(entity, color);
      case 'POINT':
        return this.createPoint(entity, color);
      default:
        return null;
    }
  }

  createLine(entity, color) {
    const startPoint = entity.vertices?.[0] || entity.start;
    const endPoint = entity.vertices?.[1] || entity.end;

    if (!startPoint || !endPoint) return null;

    const points = [
      new THREE.Vector3(startPoint.x, startPoint.y, startPoint.z || 0),
      new THREE.Vector3(endPoint.x, endPoint.y, endPoint.z || 0)
    ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geometry, material);
  }

  createPolyline(entity, color) {
    const vertices = entity.vertices || [];
    if (vertices.length < 2) return null;

    const points = vertices.map(v =>
      new THREE.Vector3(v.x, v.y, v.z || 0)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });

    // Close the polyline if it's marked as closed
    if (entity.shape) {
      return new THREE.LineLoop(geometry, material);
    }
    return new THREE.Line(geometry, material);
  }

  createCircle(entity, color) {
    const radius = entity.radius;
    const center = entity.center;

    if (!center || !radius) return null;

    const segments = Math.max(32, Math.floor(radius * 2));

    const curve = new THREE.EllipseCurve(
      center.x, center.y,
      radius, radius,
      0, 2 * Math.PI,
      false, 0
    );

    const points = curve.getPoints(segments).map(p =>
      new THREE.Vector3(p.x, p.y, center.z || 0)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.LineLoop(geometry, material);
  }

  createArc(entity, color) {
    const radius = entity.radius;
    const center = entity.center;

    if (!center || !radius) return null;

    const startAngle = (entity.startAngle || 0) * Math.PI / 180;
    const endAngle = (entity.endAngle || 360) * Math.PI / 180;
    const segments = Math.max(16, Math.floor(radius));

    const curve = new THREE.EllipseCurve(
      center.x, center.y,
      radius, radius,
      startAngle, endAngle,
      false, 0
    );

    const points = curve.getPoints(segments).map(p =>
      new THREE.Vector3(p.x, p.y, center.z || 0)
    );

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geometry, material);
  }

  createSpline(entity, color) {
    if (!entity.controlPoints || entity.controlPoints.length < 2) return null;

    const points = entity.controlPoints.map(p =>
      new THREE.Vector3(p.x, p.y, p.z || 0)
    );

    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(50);

    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineBasicMaterial({ color });
    return new THREE.Line(geometry, material);
  }

  createPoint(entity, color) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      entity.position.x,
      entity.position.y,
      entity.position.z || 0
    ]);
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({ color, size: 2 });
    return new THREE.Points(geometry, material);
  }

  getEntityColor(entity) {
    // DXF color index to RGB (simplified)
    const dxfColors = {
      1: 0xff0000, // Red
      2: 0xffff00, // Yellow
      3: 0x00ff00, // Green
      4: 0x00ffff, // Cyan
      5: 0x0000ff, // Blue
      6: 0xff00ff, // Magenta
      7: 0xffffff, // White/Black
      8: 0x808080, // Gray
    };

    if (entity.color) {
      return dxfColors[entity.color] || 0x000000;
    }

    return 0x000000; // Default black
  }

  extractLayers(model) {
    this.layers.clear();

    model.traverse((child) => {
      if (child.userData.layer) {
        const layerName = child.userData.layer;

        if (!this.layers.has(layerName)) {
          // Get color from first entity in layer
          let color = 0x000000;
          if (child.material && child.material.color) {
            color = child.material.color.getHex();
          }

          this.layers.set(layerName, {
            name: layerName,
            visible: true,
            color: color,
            objects: []
          });
        }

        this.layers.get(layerName).objects.push(child);
      }
    });
  }

  toggleLayer(layerName, visible) {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.visible = visible;
      layer.objects.forEach(obj => {
        obj.visible = visible;
      });
    }
  }

  showAllLayers() {
    this.layers.forEach((layer, name) => {
      this.toggleLayer(name, true);
    });
  }

  hideAllLayers() {
    this.layers.forEach((layer, name) => {
      this.toggleLayer(name, false);
    });
  }

  getLayers() {
    return Array.from(this.layers.values());
  }
}
