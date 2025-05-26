import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class PipePair {
  constructor(scene, centerX, gapHeight = 5, pipeCount = 3, pipeSpacing = 5) {
    this.scene = scene;
    this.centerX = centerX;
    this.gapHeight = gapHeight;
    this.gap = 13;
    this.pipeCount = pipeCount;
    this.pipeSpacing = pipeSpacing;
    this.upperPipes = [];
    this.lowerPipes = [];
    this.loaded = false;
    this.scored = false;

    this.gapCenterY = Math.random() * 10 - 5;

    const loader = new GLTFLoader();
    loader.load(
      './assets/flappy_bird_pipes_single_long_pipe/scene.gltf',
      (gltf) => {
        for(let i = 0; i < this.pipeCount; i++) {
          // Tính offset theo trục Z (khác biệt với trước)
          const offsetZ = (i - (this.pipeCount - 1) / 2) * this.pipeSpacing;

          // Pipe trên
          const upperPipe = gltf.scene.clone();
          upperPipe.scale.set(1,1,1);
          upperPipe.rotation.set(0, 0, Math.PI);
          upperPipe.position.set(this.centerX, this.gapCenterY + this.gapHeight / 2 + this.gap, offsetZ);
          scene.add(upperPipe);
          this.upperPipes.push(upperPipe);

          // Pipe dưới
          const lowerPipe = gltf.scene.clone();
          lowerPipe.scale.set(1,1,1);
          lowerPipe.rotation.set(0, 0, 0);
          lowerPipe.position.set(this.centerX, this.gapCenterY - this.gapHeight / 2 - this.gap, offsetZ);
          scene.add(lowerPipe);
          this.lowerPipes.push(lowerPipe);
        }
        this.loaded = true;
      },
      undefined,
      (error) => {
        console.error('Lỗi load model pipe:', error);
      }
    );
  }

  setPosition(centerX) {
    this.centerX = centerX;
    if (!this.loaded) return;

    for(let i = 0; i < this.pipeCount; i++) {
      const offsetZ = (i - (this.pipeCount - 1) / 2) * this.pipeSpacing;
      this.upperPipes[i].position.x = centerX;
      this.upperPipes[i].position.y = this.gapCenterY + this.gapHeight / 2 + this.gap;
      this.upperPipes[i].position.z = offsetZ;

      this.lowerPipes[i].position.x = centerX;
      this.lowerPipes[i].position.y = this.gapCenterY - this.gapHeight / 2 - this.gap;
      this.lowerPipes[i].position.z = offsetZ;
    }
  }

  update(speed = 0.05) {
    if (!this.loaded) return;

    this.setPosition(this.centerX - speed);

    if (this.centerX < -5) {
      this.gapCenterY = Math.random() * 10 - 5;

      const maxX = Math.max(...this.scene.pipes.map(p => p.centerX));
      this.setPosition(maxX + 10);
      this.scored = false;
    }
  }

  get position() {
    return new THREE.Vector3(this.centerX, this.gapCenterY, 0);
  }
}
