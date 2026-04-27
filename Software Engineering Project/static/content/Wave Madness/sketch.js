// HIGH SCORE REFERENCES
// Easy: highScores.Easy
// Normal: highScores.Normal
// Hard: highScores.Hard
// Extreme: highScores.Extreme


let gameFont;
let state = "menu";
let player;
let obstacles = [];
let speed;
let difficulty = "Normal";
let game_score = 0;
let scoreSubmitted = false;
let highScores = {};

//////////////////// SETUP ////////////////////

function preload(){
  gameFont = loadFont("../static/content/_fonts/NEONLEDLight.otf")
}
function setup() {
  textFont(gameFont)
  let hei = document.getElementById("window").clientHeight;
  let wid = document.getElementById("window").clientWidth; 
  
  canvas = createCanvas(wid, hei).parent("window")
  loadScores();
  player = new Player();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

//////////////////// MAIN LOOP ////////////////////
function draw() {
  drawTechBackground();

  if (state === "menu") drawMenu();
  else if (state === "game") runGame();
  else if (state === "gameover") drawGameOver();
  else if (state === "scores") drawScores();
}

//////////////////// INPUT ////////////////////
function mousePressed() {
  if (state === "menu") {
    if (clicked(height / 2)) startGame("Easy");
    else if (clicked(height / 2 + 90)) startGame("Normal");
    else if (clicked(height / 2 + 180)) startGame("Hard");
    else if (clicked(height / 2 + 270)) startGame("Extreme");
    else if (clicked(height / 2 + 360)) state = "scores";
  }
  
}

function keyPressed() {
  if (state === "gameover" || state === "scores") {
    state = "menu";
  }
}

//////////////////// BACKGROUND ////////////////////
function drawTechBackground() {
  let horizon = height * 0.6;

  // THEME COLORS
  let isExtreme = difficulty === "Extreme";

  let skyTop = isExtreme ? color(80, 0, 0) : color(255, 140, 200);
  let skyBottom = isExtreme ? color(10, 0, 0) : color(30, 0, 60);

  // Gradient sky
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    stroke(lerpColor(skyTop, skyBottom, inter));
    line(0, y, width, y);
  }

  // Sun with stripes
  drawSun(isExtreme);

  // Mountains (with glow)
  drawMountains(horizon, isExtreme);

  // Fog at horizon
  drawFog(horizon);

  // Grid floor
  let gridColor = isExtreme ? color(255, 0, 0, 120) : color(0, 255, 255, 120);
  stroke(gridColor);


}

function drawSun(isExtreme) {
  push();
  translate(width / 2, height * 0.3);

  let sunCol = isExtreme ? color(255, 60, 60) : color(255, 160, 200);

  noStroke();
  fill(sunCol);
  ellipse(0, 200, 800);

  // subtle horizon blend (NOT stripes)
  let skyMatch = isExtreme ? color(80, 0, 0) : color(255, 140, 200);

  for (let i = 0; i < 30; i++) {
    fill(lerpColor(sunCol, skyMatch, i / 30), 20);
    ellipse(0, 200 + i * 2, 800 - i * 10);
  }

  pop();
}


// Mountains 

function drawMountains(horizon, isExtreme) {
  noStroke();

  let baseColors = isExtreme
    ? [
        [20, 0, 0, 160],
        [50, 0, 0, 170],
        [80, 0, 0, 180],
        [110, 0, 0, 190],
        [140, 0, 0, 200],
        [170, 0, 0, 210],
        [200, 0, 0, 220],
        [230, 0, 0, 230]
      ]
    : [
        [40, 0, 100, 160],
        [60, 0, 120, 170],
        [80, 0, 140, 180],
        [100, 0, 160, 190],
        [120, 0, 180, 200],
        [140, 0, 200, 210],
        [160, 0, 220, 220],
        [180, 0, 240, 230]
      ];

  let layers = [
    { scale: 0.0025, heightMul: 320, speed: 0.01 },
    { scale: 0.005, heightMul: 280, speed: 0.01 },
    { scale: 0.0075, heightMul: 240, speed: 0.01 },
    { scale: 0.01, heightMul: 200, speed: 0.01 },
    { scale: 0.015, heightMul: 160, speed: 0.01 },
    { scale: 0.02, heightMul: 120, speed: 0.01 },
    { scale: 0.03, heightMul: 80, speed: 0.01 },
    { scale: 0.04, heightMul: 40, speed: 0.01 },
  
  ];

  for (let i = 0; i < layers.length; i++) {
    let layer = layers[i];

    // glow
    fill(baseColors[i][0], baseColors[i][1], baseColors[i][2], 80);
    drawMountainShape(layer, horizon, 10);

    // main layer
    fill(...baseColors[i]);
    drawMountainShape(layer, horizon, -i*40);
  }
}

function drawMountainShape(layer, horizon, offset) {
  beginShape();
  for (let x = 0; x <= width; x += 15) {
    let y =
      horizon -
      noise(x * layer.scale, frameCount * layer.speed) *
        layer.heightMul;

    vertex(x, y - offset);
  }
  vertex(width, height);
  vertex(0, height);
  endShape(CLOSE);
}

function drawFog(horizon) {
  noStroke();
  for (let i = 0; i < 100; i++) {
    fill(255, 255, 255, 5);
    rect(0, horizon + i, width, 1);
  }
}

//////////////////// MENU ////////////////////
function drawMenu() {
  textAlign(CENTER, CENTER);

  fill(0, 255, 255);
  textSize(120);
  text("Wave Madness", width / 2, height / 4);

  textSize(50);
  fill(255);

  drawButton("Easy", height / 2);
  drawButton("Normal", height / 2 + 90);
  drawButton("Hard", height / 2 + 180);
drawButton("Extreme", height / 2 + 270);
  textSize(40)
drawButton("High Scores", height / 2 + 360);

}

function drawButton(label, y) {
  fill(20, 20, 40, 200);
  stroke(0, 255, 255);
  rect(width / 2 - 140, y - 25, 280, 50, 12);
  noStroke();
  fill(255);
  text(label, width / 2, y);
}

function clicked(y) {
  return (
    mouseX > width / 2 - 140 &&
    mouseX < width / 2 + 140 &&
    mouseY > y - 25 &&
    mouseY < y + 25
  );
}

//////////////////// GAME ////////////////////
function startGame(diff) {
  difficulty = diff;
  obstacles = [];
  player = new Player();
  game_score = 0;
  scoreSubmitted = false;

  speed =
  diff === "Easy" ? 4 :
  diff === "Normal" ? 8 :
  diff === "Hard" ? 12 :
  diff === "Extreme" ? 18: 1;// Extreme

  state = "game";
}

function runGame() {
  game_score++;

  player.update();
  player.show();

  spawnObstacles();

  for (let i = obstacles.length - 1; i >= 0; i--) {
    let o = obstacles[i];
    o.update();
    o.show();

    if (player.hits(o)) {
      saveScore();
      state = "gameover";
    }

    if (o.offscreen()) obstacles.splice(i, 1);
  }

  drawHUD();
}

//////////////////// OBSTACLES ////////////////////
function spawnObstacles() {
let spacing =
  difficulty === "Easy" ? 260 :
  difficulty === "Normal" ? 220 :
  difficulty === "Hard" ? 180 :
  180; // Extreme

  if (
    obstacles.length === 0 ||
    obstacles[obstacles.length - 1].x < width - spacing
  ) {
    obstacles.push(new Obstacle());
  }
}

class Obstacle {
  constructor() {
    this.x = width;
    this.w = random(60, 120);

    let prev = obstacles.length > 0 ? obstacles[obstacles.length - 1] : null;

    let gapSize = random(140, 220);
    let center;

    if (prev) {
      let prevCenter = (prev.gapTop + prev.gapBottom) / 2;
      center = prevCenter + random(-120, 120);
    } else {
      center = height / 2;
    }

    center = constrain(center, gapSize / 2 + 20, height - gapSize / 2 - 20);

    this.gapTop = center - gapSize / 2;
    this.gapBottom = center + gapSize / 2;

    this.color = color(random(100,255), 0, random(200,255)); // pink/purple palette
  }

  update() {
    this.x -= speed;
  }
show() {
  let isExtreme = difficulty === "Extreme";

  let main = isExtreme ? color(200, 0, 0) : this.color;
  let dark = isExtreme ? color(80, 0, 0) : color(0, 100, 150);
  let light = isExtreme ? color(255, 80, 80) : color(150, 255, 255);

  // front face
  fill(main);
  rect(this.x, 0, this.w, this.gapTop);
  rect(this.x, this.gapBottom, this.w, height);

  // side face (3D effect)
  fill(dark);
  beginShape();
  vertex(this.x + this.w, 0);
  vertex(this.x + this.w + 10, 10);
  vertex(this.x + this.w + 10, this.gapTop - 10);
  vertex(this.x + this.w, this.gapTop);
  endShape(CLOSE);

  beginShape();
  vertex(this.x + this.w, this.gapBottom);
  vertex(this.x + this.w + 10, this.gapBottom + 10);
  vertex(this.x + this.w + 10, height);
  vertex(this.x + this.w, height);
  endShape(CLOSE);

  // top highlight
 
}

  offscreen() {
    return this.x < -this.w;
  }
}

//////////////////// PLAYER ////////////////////
class Player {
  constructor() {
    this.x = width * 0.2;
    this.y = height / 2;
    this.size = 12;
    this.dir = 1;
    this.points = []; // full path
  }

  update() {
    this.dir = (mouseIsPressed || keyIsDown(32)) ? -1 : 1;

    let dy = this.dir * speed;
    this.y += dy;

    this.y = constrain(this.y, 0, height);

    this.points.push(createVector(this.x, this.y));

    // keep enough history to fill screen
    if (this.points.length > width / speed + 50) {
      this.points.shift();
    }
  }

  show() {
    // full wave line across screen
    // clean centered trail
noFill();
stroke(0, 255, 255);
strokeWeight(2);

beginShape();
for (let i = 0; i < this.points.length; i++) {
  let dx = this.points.length - 1 - i;

  let px = this.x - dx * speed;   // extend backward from player
  let py = this.points[i].y;

  vertex(px, py);
}
endShape();

    // icon
    push();
translate(this.x, this.y);

// rotate based on direction
let angle = this.dir === -1 ? -PI / 4 : PI / 4;
rotate(angle);

fill(0, 255, 255);
noStroke();

// CENTERED triangle (this is the fix)
let s = this.size;

triangle(
  -s , -s ,   // back top
  -s ,  s ,   // back bottom
   s ,  0        // front tip
);

pop();
  }

  hits(o) {
    if (this.x > o.x && this.x < o.x + o.w) {
      if (this.y < o.gapTop || this.y > o.gapBottom) return true;
    }
    return false;
  }
}

//////////////////// UI ////////////////////
function drawHUD() {
  fill(0, 255, 255);
  textSize(40);
  textAlign(LEFT, TOP);
  text("Score: " + game_score, 20, 20);
}

function drawGameOver() {
  textAlign(CENTER, CENTER);

  fill(0, 255, 255);
  textSize(80);
  text("Game Over", width / 2, height / 2 - 80);

  fill(255);
  textSize(40);
  text("Score: " + game_score, width / 2, height / 2);
  text("Press any key", width / 2, height / 2 + 60);

  if(!scoreSubmitted){
    scoreSubmitted = true;
    submitScore();
  }
}

async function submitScore(){
    try{
      const token = localStorage.getItem("access_token");
      const scoreData = {
            game: "Wave Madness",
            val: game_score,
          };
      const response = await fetch('/api/scores', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(scoreData),
      });
      if(response.ok){
        document.getElementById('successMessage').textContent =
              'You won! Your score has been recorded';
            showModal('successModal');
      }else {
              const error = await response.json();
              document.getElementById('errorMessage').textContent = getErrorMessage(error);
              showModal('errorModal');
            }
      } catch (error) {
        document.getElementById('errorMessage').textContent =
        'Congratulations! Sign in if you want your scores recorded';
        showModal('errorModal');
      }

}

//////////////////// SCORES ////////////////////
function loadScores() {
  let data = localStorage.getItem("waveScores");

  highScores = {
    Easy: 0,
    Normal: 0,
    Hard: 0,
    Extreme: 0
  };

  if (data) {
    let saved = JSON.parse(data);

    highScores.Easy = saved.Easy ?? 0;
    highScores.Normal = saved.Normal ?? 0;
    highScores.Hard = saved.Hard ?? 0;
    highScores.Extreme = saved.Extreme ?? 0;
  }
}

function saveScore() {
  if (game_score > highScores[difficulty]) {
    highScores[difficulty] = game_score;
    localStorage.setItem("waveScores", JSON.stringify(highScores));
  }
}

function drawScores() {
  textAlign(CENTER, CENTER);

  fill(0, 255, 255);
  textSize(40);
  text("High Scores", width / 2, height / 4);

  fill(255);
  textSize(40);
  text("Easy: " + highScores.Easy, width / 2, height / 2 - 60);
  text("Normal: " + highScores.Normal, width / 2, height / 2);
  text("Hard: " + highScores.Hard, width / 2, height / 2 + 60);
  text("Extreme: " + highScores.Extreme, width / 2, height / 2 + 120);
  
  textSize(40);
  text("Press any key", width / 2, height - 80);
}