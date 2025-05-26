import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const jumpSound = new Audio('./assets/sounds/boing-spring-mouth-harp-04-20-13-4-103346.mp3');
export class Bird {
  constructor(scene, modelPath = './assets/phoenix_bird/scene.gltf') {
    this.velocityY = 0;
    this.gravity = -0.006;
    this.jumpPower = 0.18;
    this.lowestPoint = -10;
    this.scale = 0.004;
    this.scene = scene;
    this.mixer = null;
    this.model = null;

    const loader = new GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        this.model = gltf.scene;
        this.model.scale.set(this.scale, this.scale, this.scale);
        this.scene.add(this.model);

        if (gltf.animations && gltf.animations.length > 0) {
          this.mixer = new THREE.AnimationMixer(this.model);
          const action = this.mixer.clipAction(gltf.animations[0]);
          action.play();
        }
      },
      undefined,
      (error) => {
        console.error('Lỗi load model chim:', error);
      }
    );
  }

  jump() {
    this.velocityY = this.jumpPower;
    jumpSound.currentTime = 0; // đảm bảo chơi lại từ đầu
    jumpSound.play().catch(e => console.log('Lỗi phát âm thanh jump:', e));
  }

  update(deltaTime, pipes) {
  if (!this.model) return;

  this.velocityY += this.gravity;
  this.model.position.y += this.velocityY;

  const birdX = this.model.position.x;
  let minY = this.lowestPoint; // mặc định điểm rơi thấp nhất cũ

  // Tìm cột gần nhất phía trước chim
  if (pipes && pipes.length > 0) {
    const frontPipes = pipes.filter(pipe => pipe.x > birdX);

    if (frontPipes.length > 0) {
      const nearestPipe = frontPipes.reduce((prev, curr) => (curr.x < prev.x ? curr : prev));

      // Giới hạn trên (đáy ống trên)
      const upperPipeBottomY = nearestPipe.gapCenterY + nearestPipe.gapHeight / 2 + nearestPipe.gap;
      const maxY = upperPipeBottomY - 0.5;

      if (this.model.position.y > maxY) {
        this.model.position.y = maxY;
        if (this.velocityY > 0) this.velocityY = 0;
      }

      // Giới hạn dưới (đỉnh ống dưới)
      const lowerPipeTopY = nearestPipe.gapCenterY - nearestPipe.gapHeight / 2 - nearestPipe.gap;
      minY = lowerPipeTopY + 0.5;  // cộng 0.5 làm đệm tránh kẹt

    }
  }

  // Giới hạn dưới chim không rơi quá thấp
  if (this.model.position.y < minY) {
    this.model.position.y = minY;
    this.velocityY = 0;
  }

  if (this.mixer) {
    this.mixer.update(deltaTime);
  }
}


  get position() {
    return this.model ? this.model.position : new THREE.Vector3();
  }
}
