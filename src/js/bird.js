import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const jumpSound = new Audio('./assets/sounds/boing-spring-mouth-harp-04-20-13-4-103346.mp3');
export class Bird {
  constructor(scene, modelPath = './assets/phoenix_bird/scene.gltf') {
    this.velocityY = 0;
    this.gravity = -0.003;
    this.jumpPower = 0.11;
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
  if (this.model.position.y < -10) {
    this.model.position.y = -10;
    this.velocityY = 0;
  }
  if (this.model.position.y > 9) {
    this.model.position.y = 9;
    this.velocityY = 0;
  }
  if (this.mixer) {
    this.mixer.update(deltaTime);
  }
}


  get position() {
    return this.model ? this.model.position : new THREE.Vector3();
  }
  jumpToLeftPipe(pipes) {
    if (!this.model || !pipes) return;

    const birdX = this.model.position.x;
    const frontPipes = pipes.filter(pipe => pipe.centerX > birdX);
    if (frontPipes.length === 0) return;

    const nearestPipe = frontPipes.reduce((prev, curr) => (curr.centerX < prev.centerX ? curr : prev));

    if (this.currentPipeIndex === undefined) this.currentPipeIndex = 1; // mặc định giữa

    // Nếu chim đang ở pipe giữa (1), nhảy sang pipe trái (0)
    // Nếu chim đang ở pipe phải (2), nhảy về pipe giữa (1)
    if (this.currentPipeIndex === 1) {
      this.currentPipeIndex = 0;
    } else if (this.currentPipeIndex === 2) {
      this.currentPipeIndex = 1;
    }

    const leftPipeZ = nearestPipe.lowerPipes[this.currentPipeIndex].position.z;

    this.model.position.z = leftPipeZ;
    this.jump();
  }

  jumpToRightPipe(pipes) {
    if (!this.model || !pipes) return;

    const birdX = this.model.position.x;
    const frontPipes = pipes.filter(pipe => pipe.centerX > birdX);
    if (frontPipes.length === 0) return;

    const nearestPipe = frontPipes.reduce((prev, curr) => (curr.centerX < prev.centerX ? curr : prev));

    if (this.currentPipeIndex === undefined) this.currentPipeIndex = 1; // mặc định giữa

    // Nếu chim đang ở pipe giữa (1), nhảy sang pipe phải (2)
    // Nếu chim đang ở pipe trái (0), nhảy về pipe giữa (1)
    if (this.currentPipeIndex === 1) {
      this.currentPipeIndex = 2;
    } else if (this.currentPipeIndex === 0) {
      this.currentPipeIndex = 1;
    }

    const rightPipeZ = nearestPipe.lowerPipes[this.currentPipeIndex].position.z;

    this.model.position.z = rightPipeZ;
    this.jump();
  }
  boost() {
  if (!this.model) return;

  // Tăng vận tốc lên để chim bay lên nhanh hơn
  // Bạn có thể điều chỉnh giá trị boostPower theo ý muốn
  const boostPower = 1;
  this.velocityY = boostPower;

  // Có thể chơi âm thanh nếu muốn
  // jumpSound.currentTime = 0;
  // jumpSound.play().catch(e => console.log('Lỗi phát âm thanh boost:', e));
}

}
