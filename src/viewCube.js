import * as THREE from 'three';

export class ViewCube {
  constructor(mainCamera, controls, container) {
    this.mainCamera = mainCamera;
    this.controls = controls;
    this.container = container;

    // ViewCube size and position
    this.size = 120;
    this.margin = 20;

    // Dragging state
    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.position = { bottom: this.margin, right: this.margin };

    this.init();
  }

  init() {
    // Create container element
    this.element = document.createElement('div');
    this.element.id = 'view-cube';
    this.element.style.position = 'absolute';
    this.element.style.bottom = `${this.margin}px`;
    this.element.style.right = `${this.margin}px`;
    this.element.style.width = `${this.size}px`;
    this.element.style.height = `${this.size}px`;
    this.element.style.cursor = 'pointer';
    this.element.style.userSelect = 'none';
    this.element.style.zIndex = '1000';
    this.container.appendChild(this.element);

    // Create separate scene for ViewCube
    this.scene = new THREE.Scene();

    // Camera for ViewCube
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    this.camera.position.set(0, 0, 3);

    // Renderer for ViewCube
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.size, this.size);
    this.renderer.setClearColor(0x000000, 0);
    this.element.appendChild(this.renderer.domElement);

    // Create the cube
    this.createCube();

    // Create axes helpers
    this.createAxes();

    // Add labels
    this.createLabels();

    // Setup interaction
    this.setupInteraction();

    // Start animation
    this.animate();
  }

  createCube() {
    // Create cube with edges
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Create materials for each face with different colors
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.3 }), // Right - Red (X+)
      new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.3 }), // Left - Light Red (X-)
      new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.3 }), // Top - Green (Y+)
      new THREE.MeshBasicMaterial({ color: 0x6bff6b, transparent: true, opacity: 0.3 }), // Bottom - Light Green (Y-)
      new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.3 }), // Front - Blue (Z+)
      new THREE.MeshBasicMaterial({ color: 0x6b6bff, transparent: true, opacity: 0.3 }), // Back - Light Blue (Z-)
    ];

    this.cube = new THREE.Mesh(geometry, materials);
    this.scene.add(this.cube);

    // Add edges
    const edges = new THREE.EdgesGeometry(geometry);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 2 });
    const wireframe = new THREE.LineSegments(edges, lineMaterial);
    this.cube.add(wireframe);

    // Store face data for interactions
    this.faceData = [
      { name: 'Right', position: [1, 0, 0], up: [0, 1, 0] },   // X+
      { name: 'Left', position: [-1, 0, 0], up: [0, 1, 0] },   // X-
      { name: 'Top', position: [0, 1, 0], up: [0, 0, -1] },    // Y+
      { name: 'Bottom', position: [0, -1, 0], up: [0, 0, 1] }, // Y-
      { name: 'Front', position: [0, 0, 1], up: [0, 1, 0] },   // Z+
      { name: 'Back', position: [0, 0, -1], up: [0, 1, 0] },   // Z-
    ];
  }

  createAxes() {
    const axisLength = 1.2;
    const axisRadius = 0.02;

    // X Axis - Red
    const xGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8);
    const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = -Math.PI / 2;
    xAxis.position.x = axisLength / 2;
    this.scene.add(xAxis);

    // X Arrow
    const xConeGeometry = new THREE.ConeGeometry(axisRadius * 2, axisRadius * 4, 8);
    const xCone = new THREE.Mesh(xConeGeometry, xMaterial);
    xCone.rotation.z = -Math.PI / 2;
    xCone.position.x = axisLength;
    this.scene.add(xCone);

    // Y Axis - Green
    const yGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = axisLength / 2;
    this.scene.add(yAxis);

    // Y Arrow
    const yConeGeometry = new THREE.ConeGeometry(axisRadius * 2, axisRadius * 4, 8);
    const yCone = new THREE.Mesh(yConeGeometry, yMaterial);
    yCone.position.y = axisLength;
    this.scene.add(yCone);

    // Z Axis - Blue
    const zGeometry = new THREE.CylinderGeometry(axisRadius, axisRadius, axisLength, 8);
    const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2;
    zAxis.position.z = axisLength / 2;
    this.scene.add(zAxis);

    // Z Arrow
    const zConeGeometry = new THREE.ConeGeometry(axisRadius * 2, axisRadius * 4, 8);
    const zCone = new THREE.Mesh(zConeGeometry, zMaterial);
    zCone.rotation.x = Math.PI / 2;
    zCone.position.z = axisLength;
    this.scene.add(zCone);
  }

  createLabels() {
    // We'll add text labels using CSS overlays
    this.labelContainer = document.createElement('div');
    this.labelContainer.style.position = 'absolute';
    this.labelContainer.style.top = '0';
    this.labelContainer.style.left = '0';
    this.labelContainer.style.width = '100%';
    this.labelContainer.style.height = '100%';
    this.labelContainer.style.pointerEvents = 'none';
    this.element.appendChild(this.labelContainer);

    const labels = [
      { text: 'X', color: '#ff0000', position: [1.4, 0, 0] },
      { text: 'Y', color: '#00ff00', position: [0, 1.4, 0] },
      { text: 'Z', color: '#0000ff', position: [0, 0, 1.4] },
    ];

    this.labels = labels.map(labelData => {
      const label = document.createElement('div');
      label.style.position = 'absolute';
      label.style.color = labelData.color;
      label.style.fontWeight = 'bold';
      label.style.fontSize = '14px';
      label.style.fontFamily = 'monospace';
      label.textContent = labelData.text;
      label.userData = { position: new THREE.Vector3(...labelData.position) };
      this.labelContainer.appendChild(label);
      return label;
    });
  }

  setupInteraction() {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    this.renderer.domElement.addEventListener('click', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(this.cube);

      if (intersects.length > 0) {
        // Get the camera direction (view direction from camera to cube)
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);

        // Get intersection point in world space
        const intersectPoint = intersects[0].point.clone();

        // Since cube is at origin in its scene, the point is already relative to cube center
        // Just need to account for the cube's rotation
        const inverseQuaternion = this.cube.quaternion.clone().invert();
        const localPoint = intersectPoint.clone().applyQuaternion(inverseQuaternion);

        // Determine which face based on which coordinate has the largest absolute value
        const absX = Math.abs(localPoint.x);
        const absY = Math.abs(localPoint.y);
        const absZ = Math.abs(localPoint.z);

        let faceIndex;
        const threshold = 0.4; // Reduced threshold for better detection

        if (absX >= absY && absX >= absZ) {
          // X axis (Red)
          faceIndex = localPoint.x > 0 ? 0 : 1; // Right : Left
        } else if (absY >= absX && absY >= absZ) {
          // Y axis (Green)
          faceIndex = localPoint.y > 0 ? 2 : 3; // Top : Bottom
        } else {
          // Z axis (Blue)
          faceIndex = localPoint.z > 0 ? 4 : 5; // Front : Back
        }

        console.log('Clicked face:', this.faceData[faceIndex].name, 'local point:', localPoint);
        this.snapToView(faceIndex);
      }
    });

    // Hover effect
    this.renderer.domElement.addEventListener('mousemove', (event) => {
      const rect = this.renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(this.cube);

      this.renderer.domElement.style.opacity = intersects.length > 0 ? '0.8' : '1';
    });

    // Drag functionality
    this.element.addEventListener('mousedown', (e) => {
      // Only start drag if clicking on the element but not on the canvas (face click)
      if (e.target !== this.renderer.domElement) {
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
        this.element.style.cursor = 'move';
        e.preventDefault();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStart.x;
        const dy = e.clientY - this.dragStart.y;

        // Update position (using bottom/right positioning)
        this.position.right = Math.max(0, this.position.right - dx);
        this.position.bottom = Math.max(0, this.position.bottom + dy);

        // Clamp to viewport
        const maxRight = window.innerWidth - this.size;
        const maxBottom = window.innerHeight - this.size;

        this.position.right = Math.min(maxRight, Math.max(0, this.position.right));
        this.position.bottom = Math.min(maxBottom, Math.max(0, this.position.bottom));

        this.element.style.right = `${this.position.right}px`;
        this.element.style.bottom = `${this.position.bottom}px`;

        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
      }
    });

    document.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.element.style.cursor = 'pointer';
      }
    });
  }

  snapToView(faceIndex) {
    const face = this.faceData[faceIndex];
    if (!face) return;

    // Get the model center from controls target
    const center = this.controls.target.clone();

    // Calculate distance based on current camera distance
    const currentDistance = this.mainCamera.position.distanceTo(center);
    const distance = currentDistance || 100;

    // Calculate new camera position
    const newPosition = new THREE.Vector3(
      center.x + face.position[0] * distance,
      center.y + face.position[1] * distance,
      center.z + face.position[2] * distance
    );

    // Animate camera to new position
    this.animateCamera(newPosition, center, new THREE.Vector3(...face.up));
  }

  animateCamera(targetPosition, targetLookAt, targetUp) {
    const startPosition = this.mainCamera.position.clone();
    const startUp = this.mainCamera.up.clone();
    const duration = 500; // ms
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease in-out
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // Interpolate position
      this.mainCamera.position.lerpVectors(startPosition, targetPosition, eased);

      // Interpolate up vector
      this.mainCamera.up.lerpVectors(startUp, targetUp, eased);

      // Look at target
      this.mainCamera.lookAt(targetLookAt);

      // Update controls
      this.controls.target.copy(targetLookAt);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Sync rotation with main camera
    this.cube.quaternion.copy(this.mainCamera.quaternion);

    // Update label positions
    this.updateLabels();

    this.renderer.render(this.scene, this.camera);
  }

  updateLabels() {
    this.labels.forEach((label, index) => {
      const position = label.userData.position.clone();
      position.applyQuaternion(this.cube.quaternion);
      position.project(this.camera);

      const x = (position.x * 0.5 + 0.5) * this.size;
      const y = (-position.y * 0.5 + 0.5) * this.size;

      label.style.left = `${x - 7}px`;
      label.style.top = `${y - 7}px`;

      // Hide label if it's behind
      label.style.display = position.z < 1 ? 'block' : 'none';
    });
  }

  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.renderer.dispose();
  }
}
