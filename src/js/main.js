import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Bird } from './bird.js';
import { PipePair } from './pipe.js'; 
import { EXRLoader } from 'three/examples/jsm/loaders/EXRLoader.js';
import { PowerUp, POWERUP_TYPES } from './powerup.js';

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
updateScoreBoard(); // Thêm dòng này ngay sau khai báo score
let gameStarted = false;
let pipesStarted = false;
let pipesDelayTimer = 0;
const pipesStartDelay = 3; // delay 3 giây trước khi pipe chạy

let immune = false;
let immuneTimer = 0;
let speedModifier = 1;
let speedTimer = 0;

const powerUps = [];

function spawnPowerUp() {
  // Nếu đã có power up đang active thì không spawn mới
  if (powerUps.some(pu => pu.active)) return;

  if (!pipes.length) return;
  const nextPipe = pipes.find(pipe => pipe.centerX > bird.model.position.x && pipe.loaded);
  if (!nextPipe) return;
  const typeArr = [POWERUP_TYPES.POINT, POWERUP_TYPES.SPEED_UP, POWERUP_TYPES.SLOW_DOWN];
  const type = typeArr[Math.floor(Math.random() * typeArr.length)];

  // Random vị trí Z: 0 (giữa), 1 (phải), 2 (trái)
  const pipeIndex = Math.floor(Math.random() * 3); // 0, 1, 2
  const pos = new THREE.Vector3(
    nextPipe.centerX,
    nextPipe.gapCenterY,
    nextPipe.lowerPipes[pipeIndex].position.z // Lấy đúng vị trí z của pipe tương ứng
  );
  const powerUp = new PowerUp(scene, type, pos);
  powerUp.pipe = nextPipe;
  powerUps.push(powerUp);
}

// setInterval(() => {
//   if (gameStarted && pipesStarted) spawnPowerUp();
// }, 5000); // 5 giây 1 lần

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
        if (immune) {
          immune = false;
          immuneTimer = 0;
          return false; // Không chết, chỉ mất hiệu ứng miễn nhiễm
        }
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
      pipesPassed++; // tăng số pipe đã vượt qua
      updateScoreBoard(); // <-- Thêm dòng này
      // Spawn power up nếu đủ số pipe
      if (pipesPassed >= pipesToNextPowerUp) {
        spawnPowerUp();
        pipesPassed = 0;
        pipesToNextPowerUp = getRandomPipeCount();
      }
      console.log('Điểm: ' + score);
    }
  });
}

function resetGame(){
  score = 0;
  updateScoreBoard(); // <-- Thêm dòng này
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

let pipesPassed = 0;
let pipesToNextPowerUp = getRandomPipeCount();
let pipeSpeed = 0.1; // tốc độ ban đầu

function getRandomPipeCount() {
  return Math.floor(Math.random() * 6) + 5; // 5 đến 10
}

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
      pipes.forEach(pipe => pipe.update(pipeSpeed * speedModifier));
      checkScore();

      if (checkCollision()) {
        hitSound.currentTime = 0;
        hitSound.play().catch(e => console.log('Lỗi phát âm thanh hit:', e));
        alert('Game Over! Điểm: ' + score);
        resetGame();
      }
      // Tăng tốc độ dần
      pipeSpeed += 0.00005; // điều chỉnh giá trị này nếu muốn tăng nhanh/chậm hơn
    }
  }

  // Xoay power up cho dễ nhìn
powerUps.forEach(pu => {
  if (pu.active && pu.pipe && pu.pipe.loaded) {
    pu.mesh.position.x = pu.pipe.centerX;
    pu.mesh.position.y = pu.pipe.gapCenterY;
    // Không đặt lại pu.mesh.position.z!
  }
  if (pu.active) pu.mesh.rotation.y += 0.05;
});

// Kiểm tra va chạm với chim
if (bird.model) {
  const birdBox = new THREE.Box3().setFromObject(bird.model);
  powerUps.forEach(pu => {
    if (!pu.active) return;
    const puBox = new THREE.Box3().setFromObject(pu.mesh);
    if (birdBox.intersectsBox(puBox)) {
      // Áp dụng hiệu ứng
      if (pu.type === POWERUP_TYPES.POINT) {
        score += 5;
        updateScoreBoard();
        showItemMessage('+5 điểm');
      }
      if (pu.type === POWERUP_TYPES.SPEED_UP) {
        speedModifier = 1.5;
        speedTimer = 5;
        showItemMessage('Tăng tốc');
      }
      if (pu.type === POWERUP_TYPES.SLOW_DOWN) {
        speedModifier = 0.5;
        speedTimer = 5;
        showItemMessage('Chậm lại');
      }
      pu.remove(scene);
    }
  });
}

// Giảm thời gian hiệu ứng
if (immuneTimer > 0) {
  immuneTimer -= 1/60;
  if (immuneTimer <= 0) immune = false;
}
if (speedTimer > 0) {
  speedTimer -= 1/60;
  if (speedTimer <= 0) speedModifier = 1;
}

  updateScoreBoard(); // Thêm dòng này vào cuối hàm animate
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
  } console.log('Game tiếp tục');
}

function showItemMessage(message) {
  const timerDiv = document.getElementById('item-timer');
  timerDiv.style.display = 'block';
  timerDiv.textContent = message;

  // Clear timeout cũ nếu có
  if (showItemMessage.timeout) clearTimeout(showItemMessage.timeout);

  showItemMessage.timeout = setTimeout(() => {
    timerDiv.style.display = 'none';
  }, 1200); // 1.2 giây
}

function updateScoreBoard() {
  const scoreDiv = document.getElementById('score-board');
  if (scoreDiv) scoreDiv.textContent = `Điểm: ${score}`;
}