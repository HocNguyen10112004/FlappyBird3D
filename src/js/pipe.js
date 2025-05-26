import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class PipePair {
  constructor(scene, x, gapHeight = 5) {
    this.scene = scene;
    this.x = x;
    this.gapHeight = gapHeight;
    this.gap = 15;
    this.upperPipe = null;
    this.lowerPipe = null;
    this.loaded = false;

    // Sinh vị trí gap ngẫu nhiên cho mỗi cột (ví dụ trong khoảng -5 đến +5)
    this.gapCenterY = Math.random() * 10 - 5;

    const loader = new GLTFLoader();
    loader.load(
      './assets/flappy_bird_pipes_single_long_pipe/scene.gltf',
      (gltf) => {
        this.upperPipe = gltf.scene.clone();
        this.upperPipe.scale.set(1, 1, 1);
        this.upperPipe.rotation.set(0, 0, Math.PI);
        this.upperPipe.position.set(this.x, this.gapCenterY + this.gapHeight / 2 + this.gap, 0);

        this.lowerPipe = gltf.scene;
        this.lowerPipe.scale.set(1, 1, 1);
        this.lowerPipe.rotation.set(0, 0, 0);
        this.lowerPipe.position.set(this.x, this.gapCenterY - this.gapHeight / 2 - this.gap, 0);

        scene.add(this.upperPipe);
        scene.add(this.lowerPipe);

        this.loaded = true;
      },
      undefined,
      (error) => {
        console.error('Lỗi load model pipe:', error);
      }
    );

    this.scored = false;
  }

  setPosition(x) {
    this.x = x;
    if (!this.loaded) return;

    // Khi thay đổi vị trí x, vẫn giữ nguyên vị trí y theo gapCenterY
    this.upperPipe.position.x = x;
    this.lowerPipe.position.x = x;

    this.upperPipe.position.y = this.gapCenterY + this.gapHeight / 2 + this.gap;
    this.lowerPipe.position.y = this.gapCenterY - this.gapHeight / 2 - this.gap;
  }

  update(speed = 0.05) {
    if (!this.loaded) return;

    this.setPosition(this.x - speed);

    if (this.x < -5) {
      // Khi reset vị trí, sinh lại vị trí gapCenterY mới cho random gap vị trí
      this.gapCenterY = Math.random() * 10 - 5;

      this.setPosition(5 + 10 * (this.scene.pipesCount - 1));
      this.scored = false;
    }
  }

  get position() {
    return new THREE.Vector3(this.x, this.gapCenterY, 0);
  }
}
