// HIGH SCORE REFERENCES
// Easy: highScores.easy
// Normal: highScores.normal
// Hard: highScores.hard


let gameFont;
let currentSpeed;
let gameState = "menu";
let difficulty = "easy";

let difficulties = {
  easy: { speed: 3, tolerance: 0.7 },
  medium: { speed: 5, tolerance: 0.5 },
  hard: { speed: 8, tolerance: 0.3 }
};

let blocks = [];
let currentBlock;
let direction = 1;
let game_score = 0;
let highScores = {};

let buttons = [];
let cameraY = 0; // NEW camera offset

function preload(){
  gameFont = loadFont("../static/content/_fonts/bluewave.ttf")
}


function setup() {
  let hei = document.getElementById("window").clientHeight;
  let wid = document.getElementById("window").clientWidth; 
  
  canvas = createCanvas(wid, hei).parent("window")
  loadScores();
  createMenuButtons();
  initBlobs();
  canvas = createCanvas(wid, hei).parent("window")
  loadScores();
  createMenuButtons();
  textFont(gameFont)
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  createMenuButtons();
  initBlobs();
  resizeCanvas(windowWidth, windowHeight);
  createMenuButtons();
}

function draw() {
  drawGradientSky();
  noStroke()
  if (gameState === "menu") drawMenu();
  else if (gameState === "playing") runGame();
  else if (gameState === "gameover") drawGameOver();
}

// Lava lamp style animated background
let blobs = [];

function initBlobs() {
  blobs = [];
  for (let i = 0; i < 6; i++) {
    blobs.push({
      x: random(width),
      y: random(height),
      r: random(150, 300),
      dx: random(-0.5, 0.5),
      dy: random(-0.5, 0.5),
      hue: random(360)
    });
  }
}

function drawGradientSky() {
  let t = frameCount * 0.05; // slow time

  let c1 = color(
    80 + sin(t * 0.5) * 30,   // slight drift
    100,
    200 + cos(t * 0.3) * 20
  );

  let c2 = color(
    200,
    100 + sin(t * 0.4) * 40,
    180 + cos(t * 0.2) * 20
  );

  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);

    // subtle vertical wave distortion (very small)
    let wave = sin(y * 0.01 + t) * 0.05;
    inter = constrain(inter + wave, 0, 1);

    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(0, y, width, y);
  }
}


function createMenuButtons() {
  buttons = [
    { label: "Easy", x: width/2 - 150, y: height/2, w: 100, h: 50, value: "easy" },
    { label: "Medium", x: width/2 - 50, y: height/2, w: 100, h: 50, value: "medium" },
    { label: "Hard", x: width/2 + 50, y: height/2, w: 100, h: 50, value: "hard" }
  ];
}

function drawMenu() {
  fill(255);
  textAlign(CENTER);
  textSize(200);
  text("STACK 3D", width/2, height/3);

  textSize(32);
  text("Select Difficulty", width/2, height/2 - 40);

  for (let b of buttons) {
    fill(difficulty === b.value ? 220 : 120);
    rect(b.x, b.y, b.w, b.h, 10);
    fill(0);
    text(b.label, b.x + b.w/2, b.y + 32);
  }

  textSize(48);
  text("Highscores:", width/2, height/2 + 100);
  text(`Easy: ${highScores.easy || 0}`, width/2, height/2 + 150);
  text(`Medium: ${highScores.medium || 0}`, width/2, height/2 + 200);
  text(`Hard: ${highScores.hard || 0}`, width/2, height/2 + 250);

  text("Click anywhere to start", width/2, height - 80);
}

function runGame() {
  updateCamera();

  push();
  translate(0, cameraY);

  drawBlocks();
  moveCurrentBlock();

  pop();
}

function updateCamera() {
  if (blocks.length === 0) return;

  let topBlock = blocks[blocks.length - 1];

  // Target: keep top block around middle of screen
  let targetY = height * 0.4 - topBlock.y;

  // Smooth follow
  cameraY = lerp(cameraY, targetY, 0.1);
}

function drawBlocks() {
  for (let b of blocks) b.show();
  if (currentBlock) currentBlock.show();
}

function moveCurrentBlock() {
  currentBlock.x += direction * currentSpeed;

  if (currentBlock.x > width || currentBlock.x < 0) {
    direction *= -1;
  }
}

function mousePressed() {
  if (gameState === "menu") {
    for (let b of buttons) {
      if (mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h) {
        difficulty = b.value;
        return;
      }
    }
    startGame();
  } else if (gameState === "playing") {
    placeBlock();
  } else if (gameState === "gameover") {
    gameState = "menu";
  }
}

function startGame() {
  blocks = [];
  game_score = 0;
  cameraY = 0;

  currentSpeed = difficulties[difficulty].speed; 

  let baseWidth = width * 0.5;
  let base = new Block(width/2 - baseWidth/2, height - 120, baseWidth, 40, 0);
  blocks.push(base);

  spawnBlock();
  gameState = "playing";
}

function spawnBlock() {
  let last = blocks[blocks.length - 1];
  currentBlock = new Block(0, last.y - 40, last.w, 40, blocks.length);
}

function placeBlock() {
  let last = blocks[blocks.length - 1];

  let overlap = min(currentBlock.x + currentBlock.w, last.x + last.w) - max(currentBlock.x, last.x);

  if (overlap > currentBlock.w * difficulties[difficulty].tolerance) {
    currentBlock.w = overlap;
    currentBlock.x = max(currentBlock.x, last.x);

    blocks.push(currentBlock);
    game_score++;
    currentSpeed = min(currentSpeed * 1.05, difficulties[difficulty].speed * 3);
    spawnBlock();
  } else {
    saveScore();
    gameState = "gameover";
  }
}

function drawGameOver() {
  fill(255);
  textAlign(CENTER);
  textSize(48);
  text("Game Over", width/2, height/3);

  textSize(48);
  text(`Score: ${game_score}`, width/2, height/2);
  text(`High Score: ${highScores[difficulty] || 0}`, width/2, height/2 + 35);

  text("Click to return", width/2, height/2 + 90);
}

function saveScore() {
  if (!highScores[difficulty] || game_score > highScores[difficulty]) {
    highScores[difficulty] = game_score;
    localStorage.setItem("stackScores", JSON.stringify(highScores));
  }
}

function loadScores() {
  let data = localStorage.getItem("stackScores");
  if (data) highScores = JSON.parse(data);
}

class Block {
  constructor(x, y, w, h, level) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.level = level;
  }

  show() {
    let hue = (this.level * 15) % 360;

    let topColor = color(`hsl(${hue},70%,70%)`);
    let frontColor = color(`hsl(${hue},70%,55%)`);
    let sideColor = color(`hsl(${hue},70%,40%)`);

    let d = 20;
    noStroke()
    fill(topColor);
    quad(
      this.x, this.y,
      this.x + this.w, this.y,
      this.x + this.w + d, this.y - d,
      this.x + d, this.y - d
    );

    fill(frontColor);
    rect(this.x, this.y, this.w, this.h);

    fill(sideColor);
    quad(
      this.x + this.w, this.y,
      this.x + this.w + d, this.y - d,
      this.x + this.w + d, this.y + this.h - d,
      this.x + this.w, this.y + this.h
    );
  }
}

