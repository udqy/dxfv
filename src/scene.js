import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ViewCube } from './viewCube.js';

export class Scene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.orthographicCamera = null;
    this.perspectiveCamera = null;
    this.renderer = null;
    this.controls = null;
    this.currentModel = null;
    this.animationId = null;
    this.viewCube = null;
    this.viewMode = '3D';

    this.init();
  }

  init() {
    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf5f7fa);

    // Cameras
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      45,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      10000
    );
    this.perspectiveCamera.position.set(100, 100, 100);

    this.orthographicCamera = new THREE.OrthographicCamera(
      -100, 100, 100, -100, 0.1, 10000
    );
    this.orthographicCamera.position.set(0, 0, 100);

    this.camera = this.perspectiveCamera;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 50);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-100, -100, -50);
    this.scene.add(directionalLight2);

    // Grid Helper (initially hidden)
    this.gridHelper = new THREE.GridHelper(1000, 50, 0xcccccc, 0xe0e0e0);
    this.gridHelper.visible = false;
    this.scene.add(this.gridHelper);

    // Axes Helper (initially hidden)
    this.axesHelper = new THREE.AxesHelper(100);
    this.axesHelper.visible = false;
    this.scene.add(this.axesHelper);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = true;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 5000;

    // ViewCube
    this.viewCube = new ViewCube(this.camera, this.controls, this.container);

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const aspect = this.container.clientWidth / this.container.clientHeight;
    
    // Update perspective camera
    this.perspectiveCamera.aspect = aspect;
    this.perspectiveCamera.updateProjectionMatrix();
    
    // Update orthographic camera
    const frustumSize = 200;
    this.orthographicCamera.left = -frustumSize * aspect / 2;
    this.orthographicCamera.right = frustumSize * aspect / 2;
    this.orthographicCamera.top = frustumSize / 2;
    this.orthographicCamera.bottom = -frustumSize / 2;
    this.orthographicCamera.updateProjectionMatrix();
    
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  }

  addModel(model) {
    // Remove previous model
    if (this.currentModel) {
      this.scene.remove(this.currentModel);
      this.disposeModel(this.currentModel);
    }

    this.currentModel = model;
    this.scene.add(model);

    // Show grid and axes when model is loaded
    this.gridHelper.visible = true;
    this.axesHelper.visible = true;

    // Fit camera to model
    this.fitCameraToModel(model);
  }

  fitCameraToModel(model) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 1.5; // Zoom out a bit

    // Position camera
    this.camera.position.set(center.x + cameraZ, center.y + cameraZ, center.z + cameraZ);
    this.camera.lookAt(center);

    // Update controls target
    this.controls.target.copy(center);
    this.controls.update();

    // Update grid size based on model
    if (this.gridHelper) {
      this.scene.remove(this.gridHelper);
      const gridSize = Math.ceil(maxDim * 2);
      const divisions = Math.min(Math.ceil(gridSize / 10), 100);
      this.gridHelper = new THREE.GridHelper(gridSize, divisions, 0xcccccc, 0xe0e0e0);
      this.gridHelper.position.y = box.min.y;
      this.scene.add(this.gridHelper);
    }
  }

  resetView() {
    if (this.currentModel) {
      this.fitCameraToModel(this.currentModel);
    }
  }

  disposeModel(model) {
    model.traverse((child) => {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.currentModel) {
      this.disposeModel(this.currentModel);
    }
    if (this.viewCube) {
      this.viewCube.dispose();
    }
    this.renderer.dispose();
    this.controls.dispose();
    window.removeEventListener('resize', this.onWindowResize);
  }

  getRenderer() {
    return this.renderer;
  }

  getCamera() {
    return this.camera;
  }

  getScene() {
    return this.scene;
  }

  getControls() {
    return this.controls;
  }

  getCurrentModel() {
    return this.currentModel;
  }

  setViewMode(mode) {
    if (this.viewMode === mode) return;
    
    this.viewMode = mode;
    
    if (mode === '2D') {
      // Switch to 2D orthographic view
      this.camera = this.orthographicCamera;
      this.controls.object = this.orthographicCamera;
      
      // Position camera for top-down view
      if (this.currentModel) {
        const box = new THREE.Box3().setFromObject(this.currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        const maxDim = Math.max(size.x, size.y);
        const aspect = this.container.clientWidth / this.container.clientHeight;
        
        this.orthographicCamera.left = -maxDim * aspect / 2;
        this.orthographicCamera.right = maxDim * aspect / 2;
        this.orthographicCamera.top = maxDim / 2;
        this.orthographicCamera.bottom = -maxDim / 2;
        this.orthographicCamera.position.set(center.x, center.y, center.z + maxDim);
        this.orthographicCamera.lookAt(center);
      }
      
      // Disable rotation for 2D view
      this.controls.enableRotate = false;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      
    } else {
      // Switch to 3D perspective view
      this.camera = this.perspectiveCamera;
      this.controls.object = this.perspectiveCamera;
      
      // Re-enable rotation for 3D view
      this.controls.enableRotate = true;
      this.controls.enablePan = true;
      this.controls.enableZoom = true;
      
      // Reset to a good 3D view if we have a model
      if (this.currentModel) {
        this.fitCameraToModel(this.currentModel);
      }
    }
    
    this.controls.update();
  }
}
