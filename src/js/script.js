import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

// Tạo scene, camera, renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 190);
camera.position.set(0, 0, 15);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Thêm ánh sáng
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Khởi tạo OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.target.set(0, 0, 0);
// controls.update();

// const controls = new TrackballControls(camera, renderer.domElement);
// controls.noZoom = true;
// controls.noPan = true;
// controls.rotateSpeed = 5.0;
// controls.update();

// Khai báo loader
const loader = new GLTFLoader();
let bird;

// Load model GLTF
loader.load(
  './assets/scene.gltf', // Đảm bảo đường dẫn chính xác
  function(gltf) {
    const model = gltf.scene;
    scene.add(model);
    bird = model;
  },
  undefined,
  function(error) {
    console.error('Error loading model:', error);
  }
);

// Vòng lặp render
function animate() {
  requestAnimationFrame(animate);

  controls.update();
  renderer.render(scene, camera);
}

animate();

// Xử lý resize cửa sổ
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
