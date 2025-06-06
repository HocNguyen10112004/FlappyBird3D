import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class BuildingManager {
  constructor(scene, modelLeftPath, modelRightPath, count, offsetX, speedRef) {
    this.scene = scene;
    this.loader = new GLTFLoader();

    this.modelLeftPath = modelLeftPath;
    this.modelRightPath = modelRightPath;
    this.count = count;
    this.offsetX = offsetX; // ví dụ 0
    this.speedRef = speedRef; // biến tham chiếu speed bên main

    this.leftBuildings = [];
    this.rightBuildings = [];

    this.totalLength = 0; // chiều dài 1 dãy building (tính sau khi load xong)

    this.loaded = false;

    this.loadModels();
  }

  loadModels() {
    Promise.all([
      this.loader.loadAsync(this.modelLeftPath),
      this.loader.loadAsync(this.modelRightPath)
    ]).then(([gltfLeft, gltfRight]) => {
      this.leftModel = gltfLeft.scene;
      this.rightModel = gltfRight.scene;

      // Tính tổng chiều dài 1 model (theo trục x)
      const bboxLeft = new THREE.Box3().setFromObject(this.leftModel);
      const bboxRight = new THREE.Box3().setFromObject(this.rightModel);

      // Lấy chiều dài lớn hơn làm tổng chiều dài building 1 cái
      this.modelLength = Math.max(
        bboxLeft.max.x - bboxLeft.min.x,
        bboxRight.max.x - bboxRight.min.x
      );

      // Tạo building cho bên trái
      for(let i=0; i<this.count; i++) {
        const cloneLeft = this.leftModel.clone();
        cloneLeft.position.set(this.offsetX + i * this.modelLength, -12, -12);
        this.scene.add(cloneLeft);
        this.leftBuildings.push(cloneLeft);
      }

      // Tạo building cho bên phải
      for(let i=0; i<this.count; i++) {
        const cloneRight = this.rightModel.clone();
        cloneRight.position.set(this.offsetX + i * this.modelLength, -12, 12);
        this.scene.add(cloneRight);
        this.rightBuildings.push(cloneRight);
      }

      this.totalLength = this.count * this.modelLength;

      this.loaded = true;
    });
  }

  update(delta) {
    if (!this.loaded) return;

    const moveX = -this.speedRef;
    console.log("Current speed: ", this.speedRef);
    console.log("Moving buildings by: ", moveX);

    // Cập nhật vị trí building bên trái
    this.leftBuildings.forEach(b => {
      b.position.x += moveX;
      if (b.position.x < this.offsetX - this.totalLength) {
        b.position.x += this.totalLength;
      }
    });

    // Cập nhật vị trí building bên phải
    this.rightBuildings.forEach(b => {
      b.position.x += moveX;
      if (b.position.x < this.offsetX - this.totalLength) {
        b.position.x += this.totalLength;
      }
    });
  }
}
