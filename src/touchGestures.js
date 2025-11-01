import * as THREE from 'three';

export class TouchGestures {
  constructor(controls, camera) {
    this.controls = controls;
    this.camera = camera;
    this.initialDistance = 0;
    this.initialScale = 1;

    this.init();
  }

  init() {
    const element = this.controls.domElement;

    // Track touches
    let touches = [];

    element.addEventListener('touchstart', (e) => {
      touches = Array.from(e.touches);

      if (touches.length === 2) {
        // Two finger pinch
        this.initialDistance = this.getDistance(touches[0], touches[1]);
        this.initialScale = this.camera.position.distanceTo(this.controls.target);
      }
    });

    element.addEventListener('touchmove', (e) => {
      touches = Array.from(e.touches);

      if (touches.length === 2) {
        // Pinch to zoom
        e.preventDefault();
        const currentDistance = this.getDistance(touches[0], touches[1]);
        const scale = this.initialDistance / currentDistance;

        // Apply zoom
        const newDistance = this.initialScale * scale;
        const direction = new THREE.Vector3()
          .subVectors(this.camera.position, this.controls.target)
          .normalize();

        this.camera.position.copy(
          this.controls.target.clone().add(direction.multiplyScalar(newDistance))
        );
      }
    });

    element.addEventListener('touchend', () => {
      touches = [];
      this.initialDistance = 0;
    });
  }

  getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
