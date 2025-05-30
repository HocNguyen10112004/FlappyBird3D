import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Bird } from './bird.js';
import { PipePair } from './pipe.js'; 
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';

const hitSound = new Audio('./assets/sounds/low-metal-hit-2-81779.mp3');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.01, 1000);
camera.position.set(0, 2, 10);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xaaaaaa);
document.body.appendChild(renderer.domElement);

// Ánh sáng
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5,10,7);
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0,0,0);
controls.update();

const bird = new Bird(scene, './assets/phoenix_bird/scene.gltf');

const pipes = [];
const pipeCount = 5;
const pipeSpacing = 10;

for(let i=0; i<pipeCount; i++){
  const pipePair = new PipePair(scene, 5 + i*pipeSpacing);
  pipes.push(pipePair);
}
scene.pipes = pipes;
// Gán pipesCount để tính toán vị trí reset trong PipePair
scene.pipesCount = pipeCount;

let score = 0;
let gameStarted = false;
let pipesStarted = false;
let pipesDelayTimer = 0;
const pipesStartDelay = 3; // delay 3 giây trước khi pipe chạy

function checkCollision() {
  if (!bird.model) return false;
  const birdBox = new THREE.Box3().setFromObject(bird.model);

  for (let pipeGroup of pipes) {
    for (let pipeIndex = 0; pipeIndex < 3; pipeIndex++){
      // Kiểm tra pipe đã load chưa
      if (!pipeGroup.lowerPipes[pipeIndex] || !pipeGroup.upperPipes[pipeIndex]) continue;

      const lowerBox = new THREE.Box3().setFromObject(pipeGroup.lowerPipes[pipeIndex]);
      const upperBox = new THREE.Box3().setFromObject(pipeGroup.upperPipes[pipeIndex]);

      if (birdBox.intersectsBox(lowerBox) || birdBox.intersectsBox(upperBox)) {
        return true;
      }
    }
  }
  return false;
}

function checkScore(){
  pipes.forEach(pipe=>{
    if(pipe.position.x < bird.position.x && !pipe.scored){
      pipe.scored = true;
      score++;
      console.log('Điểm: ' + score);
    }
  });
}

function resetGame(){
  score = 0;
  pipesStarted = false;    // reset lại flag pipesStarted
  pipesDelayTimer = 0;     // reset lại bộ đếm delay
  console.log('Điểm: 0');

  pipes.forEach((pipe,i)=>{
    pipe.gapCenterY = Math.random() * 10 - 5;
    pipe.setPosition(5 + i * pipeSpacing);
    pipe.scored = false;
  });

  if(bird.model) bird.model.position.set(0,0,0);
  bird.velocityY = 0;

  gameStarted = false;
  const btn = document.getElementById('startButton');
  if(btn) btn.style.display = 'block';
}


function startGame(){
  if(!bird.model){
    alert('Vui lòng đợi mô hình chim tải xong!');
    return;
  }
  gameStarted = true;
  pipesStarted = false;
  pipesDelayTimer = 0;
  const btn = document.getElementById('startButton');
  if(btn) btn.style.display = 'none';
}

window.addEventListener('keydown', e=>{
  if(e.code==='Space' && gameStarted) bird.jump();
});
window.addEventListener('click', ()=>{
  if(gameStarted) bird.jump();
});

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (gameStarted && !gamePaused) {
    // Cập nhật game, di chuyển chim, pipes, check va chạm
    const delta = clock.getDelta();
    bird.update(delta, pipes);

    if (!pipesStarted) {
      pipesDelayTimer += delta;
      if (pipesDelayTimer >= pipesStartDelay) {
        pipesStarted = true;
      }
    }

    if (pipesStarted) {
      pipes.forEach(pipe => pipe.update(0.05));
      checkScore();

      if (checkCollision()) {
        hitSound.currentTime = 0;
        hitSound.play().catch(e => console.log('Lỗi phát âm thanh hit:', e));
        alert('Game Over! Điểm: ' + score);
        resetGame();
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();

document.getElementById('startButton').addEventListener('click', startGame);

window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const loader = new THREE.TextureLoader();
loader.load('./assets/qwantani_puresky.webp', function(texture){
  const geometry = new THREE.SphereGeometry(100, 32, 32);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(geometry, material);
  scene.add(sky);
});

//
// Tạo hình hộp chữ nhật rất mỏng (thay cho mặt phẳng)
const boxWidth = 200;
const boxHeight = 10;   // cao rất thấp để giống mặt phẳng
const boxDepth = 20;

const boxGeometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load('./assets/perfect-green-grass.jpg');
// Tạo vật liệu màu xanh nhẹ, có thể trong suốt
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.repeat.set(10, 1); // lặp 10 lần ngang, 1 lần dọc

const boxMaterial = new THREE.MeshPhongMaterial({
  map: texture,
  side: THREE.DoubleSide,
  transparent: false,
});

// Tạo 2 hộp
const cuttingBox1 = new THREE.Mesh(boxGeometry, boxMaterial);
const cuttingBox2 = new THREE.Mesh(boxGeometry, boxMaterial);

// Đặt vị trí và xoay nằm ngang (giữ nguyên trục x,y,z)
cuttingBox1.position.set(0, -15, 0);
cuttingBox2.position.set(0, 15, 0);

// Thêm vào scene
scene.add(cuttingBox1);
scene.add(cuttingBox2);

//
window.addEventListener('keydown', e => {
  // Chặn hành vi mặc định của các phím mũi tên
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'Enter') {
    if (gameStarted && !gamePaused && bird.model) {
      bird.boost();
      
      console.log('Chim bay nhanh đột ngột!');
    }
    return;
  }
  if (e.code === 'ArrowDown') {
    togglePause();
    return; // dừng xử lý tiếp theo khi toggle pause
  }

  if (e.code === 'Space') {
    if (!gameStarted) {
      startGame();
    } else if (gameStarted && pipesStarted && checkCollision()) {
      resetGame();
    } else if (!gamePaused) {
      bird.jump();
    }
  }

  if (!gameStarted || gamePaused) return;

  switch (e.code) {
    case 'ArrowLeft':
    case 'KeyA':
      bird.jumpToLeftPipe(pipes);
      break;
    case 'ArrowRight':
    case 'KeyD':
      bird.jumpToRightPipe(pipes);
      break;
    case 'ArrowUp':
    case 'KeyW':
      bird.jump();
      break;
  }
});
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
    e.preventDefault();
  }
});
let gamePaused = false;

function togglePause() {
  if (!gameStarted) return; // Chỉ cho phép pause khi game đang chạy
  gamePaused = !gamePaused;

  const pauseBtn = document.getElementById('pauseButton');
  if (gamePaused) {
    pauseBtn.innerText = 'Resume';
    console.log('Game tạm dừng');
  } else {
    pauseBtn.innerText = 'Pause';
    console.log('Game tiếp tục');
  }
}
