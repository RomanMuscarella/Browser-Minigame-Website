// HIGH SCORE REFERENCES
// Easy: highScores.Easy
// Normal: highScores.Normal
// Hard: highScores.Hard
// Extreme: highScores.Extreme


let music;
let state = "menu";
let stars = [];
let paddle;
let balls = [];
let bricks;
let powerups = [];
let level = 1;
let difficulty = "Normal";
let speedMultiplier = 1;
let game_score = 0;
let scoreSubmitted = false;
let lives = 3;
let highScores = {};
let activeEffects = [];
let floatingTexts = [];
let sfx = {};
let controlMode = "mouse"; // "mouse" or "keyboard"
let paused = false;
let gameFont;
let tunnelStars = [];

function preload() {
  gameFont = loadFont("../static/content/_fonts/Ethnocentric.otf");
}
//////////////////// SETUP ////////////////////
function setup() {
  textFont(gameFont);

  let hei = document.getElementById("window").clientHeight;
  let wid = document.getElementById("window").clientWidth; 
  createCanvas(hei, wid).parent("window");

  // SOUND PLACEHOLDERS
  let filepath = "../media/audio/"
  soundFormats("wav", "mp3");
  sfx.paddle = loadSound(filepath + "pop.mp3");
  sfx.brick = loadSound(filepath + "popbrick.mp3");
  sfx.loseLife = loadSound(filepath + "fail.mp3");
  music = loadSound(filepath + "cerise.mp3");

  loadScores();
  initTunnel();
  initStars();
}

function initTunnel() {
  tunnelStars = [];

  for (let i = 0; i < 1000; i++) {
    resetTunnelStar(i);
  }
}

function resetTunnelStar(i) {
  tunnelStars[i] = {
    x: random(-width, width),
    y: random(-height, height),
    z: random(width), // depth
  };
}

function drawHyperspaceTunnel(moving) {
  background(0);

  let speed = moving ? 15 + getAvgBallSpeed() * 1.5 : 2;

  let time = frameCount * 0.01;

  // curvature strength (stronger in Extreme)
  let curveStrength =
    difficulty === "Extreme" ? 120 : difficulty === "Hard" ? 80 : 40;

  // smooth drifting center (curving path)
  let offsetX = sin(time * 0.7) * curveStrength;
  let offsetY = cos(time * 0.5) * curveStrength;

  // optional: follow ball slightly
  if (balls.length > 0 && state === "game") {
    offsetX += (balls[0].x - width / 2) * 0.3;
    offsetY += (balls[0].y - height / 2) * 0.3;
  }

  translate(width / 2 + offsetX, height / 2 + offsetY);

  for (let i = 0; i < tunnelStars.length; i++) {
    let s = tunnelStars[i];

    // move forward in Z (toward camera)
    if (moving) s.z -= speed;

    // reset when passed camera
    if (s.z < 1) {
      resetTunnelStar(i);
      continue;
    }

    // perspective projection
    let sx = (s.x / s.z) * width;
    let sy = (s.y / s.z) * height;

    let px = (s.x / (s.z + speed)) * width;
    let py = (s.y / (s.z + speed)) * height;

    // size increases as it gets closer
    let size = map(s.z, 0, width, 6, 0.5);

    // brightness based on depth
    let alpha = map(s.z, 0, width, 255, 50);

    stroke(200, 200, 255, alpha);
    strokeWeight(size);

    // draw streak (THIS is the tunnel feel)
    line(px, py, sx, sy);
  }

  resetMatrix();
}

function initStars() {
  stars = [];

  for (let i = 0; i < 160; i++) {
    stars.push({
      angle: random(TWO_PI),
      radius: random(50, min(width, height) * 0.7),

      speed: random(0.002, 0.01),
      depth: random(0.5, 2),

      baseSize: random(1.5, 3.5),
      twinkleOffset: random(1000),
    });
  }
}

function drawSpaceBackground(moving) {
  background(10, 10, 25);

  noStroke();

  let cx = width / 2;
  let cy = height / 2;

  // optional slow global rotation drift
  let globalSpin = frameCount * 0.0005;

  for (let s of stars) {
    let twinkle = sin(frameCount * 0.05 + s.twinkleOffset) * 0.5 + 0.5;

    let warp = moving && (difficulty === "Extreme" || getAvgBallSpeed() > 10);

    // spiral distortion in warp mode
    let angleOffset = warp ? frameCount * 0.01 * s.depth : globalSpin;

    let angle = s.angle + angleOffset;

    let r = s.radius;

    // optional spiral tightening (warp effect)
    if (warp) {
      r *= 0.98 + 0.02 * sin(frameCount * 0.02);
    }

    let cx = width / 2;
    let cy = height / 2;

    let baseX = cx + cos(angle) * r;
    let baseY = cy + sin(angle) * r;

    let lens = getLensCenter();
    let strength = getLensStrength();

    // direction to lens
    let dx = lens.x - baseX;
    let dy = lens.y - baseY;

    let dist = sqrt(dx * dx + dy * dy);

    //
    if (dist < 0.001) dist = 0.001;

    dx /= dist;
    dy /= dist;

    // safe pull scaling
    let pull = strength * (1 / max(s.depth, 0.1));

    // final position
    let x = baseX + dx * pull * 30;
    let y = baseY + dy * pull * 30;

    let size = s.baseSize + twinkle * 1.5 * s.depth;

    if (warp) {
      let tx = -sin(angle);
      let ty = cos(angle);

      let streakLength = 12 * s.depth;

      stroke(200, 200, 255, 180);
      strokeWeight(size);

      beginShape();
      vertex(x, y);
      vertex(x + tx * streakLength * 0.5, y + ty * streakLength * 0.5);
      vertex(x + tx * streakLength, y + ty * streakLength);
      endShape();

      noStroke();
    } else {
      fill(200 + 55 * twinkle, 200 + 55 * twinkle, 255);
      ellipse(x, y, size);
    }

    // rotation update
    if (moving) {
      s.angle += s.speed * (warp ? 3 : 1);
    }
  }
}

function getLensCenter() {
  if (balls && balls.length > 0 && balls[0]) {
    return { x: balls[0].x, y: balls[0].y };
  }

  if (paddle) {
    return { x: paddle.x, y: paddle.y };
  }

  return { x: width / 2, y: height / 2 };
}

function getLensStrength() {
  let base =
    difficulty === "Extreme"
      ? 0.18
      : difficulty === "Hard"
      ? 0.12
      : difficulty === "Normal"
      ? 0.08
      : 0.04;

  // boost when ball is fast (synergy with warp)
  return base * (1 + getAvgBallSpeed() * 0.05);
}

function getAvgBallSpeed() {
  if (balls.length === 0) return 0;

  let total = 0;
  for (let b of balls) {
    total += sqrt(b.vx * b.vx + b.vy * b.vy);
  }

  return total / balls.length;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initStars();
  if (state === "game") {
    createBricks();
  }
}

//////////////////// MAIN LOOP ////////////////////
function draw() {
  let moving = state === "game" && !paused;

  if (state === "menu") {
    drawHyperspaceTunnel(false); //
  } else if (
    state === "game" &&
    (difficulty === "Extreme" || getAvgBallSpeed() > 10)
  ) {
    drawHyperspaceTunnel(moving);
  } else {
    drawSpaceBackground(moving);
  }

  if (state === "menu") drawMenu();
  else if (state === "game") runGame();
  else if (state === "gameover") drawGameOver();
  else if (state === "scores") drawScores();
  else if (state === "info") drawInfo();
}

//////////////////// MENU ////////////////////
function drawMenu() {
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(55);
  text("Hyperspace Breaker", width / 2, height / 4);

  textSize(25);
  drawButton("Easy", height / 2);
  drawButton("Normal", height / 2 + 60);
  drawButton("Hard", height / 2 + 120);
  drawButton("Extreme", height / 2 + 180);
  drawButton("High Scores", height / 2 + 260);
  textSize(20);
  drawButton("Info / Settings", height / 2 + 320);
}

function drawButton(label, y) {
  rectMode(CENTER);
  fill(80);
  rect(width / 2, y, 250, 50);
  fill(255);
  text(label, width / 2, y);
}

function drawInfo() {
  let now = millis();
  textAlign(CENTER, TOP);
  fill(255);

  textSize(80);
  text("Info & Settings", width / 2, 40);

  textSize(18);

  let y = 180;
  textSize(60);
  let flash2 = sin(now * 0.02) * 127 + 128;
  fill(flash2, flash2, flash2);
  text("Powerups:", width / 2, y);
  y += 60;
  textSize(40);
  fill(255);
  text("Multiball: Spawns extra balls", width / 2, y);
  y += 50;
  text("Long Paddle: Easier hits", width / 2, y);
  y += 50;
  text("Short Paddle: Harder hits", width / 2, y);
  y += 50;
  text("Fast Ball: Increases speed", width / 2, y);
  y += 50;
  text("Slow Ball: Decreases speed", width / 2, y);
  y += 50;
  text("Big Ball: Easier collisions", width / 2, y);
  y += 50;
  text("Saving Grace (Extreme): Catch or lose a life", width / 2, y);

  y += 200;

  text("Controls:", width / 2, y);
  y += 40;

  text("Current Mode: " + controlMode.toUpperCase(), width / 2, y);
  y += 80;
  textSize(15);
  drawButton("Toggle Controls", y);
  y += 100;

  text("Press anywhere to return", width / 2, height - 60);
}

function mousePressed() {
  userStartAudio();
  if (state === "menu") {
    if (clicked(height / 2)) startGame("Easy");
    else if (clicked(height / 2 + 60)) startGame("Normal");
    else if (clicked(height / 2 + 120)) startGame("Hard");
    else if (clicked(height / 2 + 180)) startGame("Extreme");
    else if (clicked(height / 2 + 260)) state = "scores";
    else if (clicked(height / 2 + 320)) state = "info";
  } else if (state === "scores") {
    state = "menu"; // 
  } else if (state === "gameover") {
    state = "menu";
  } else if (state === "info") {
    handleInfoClick();
  }
}

function handleInfoClick() {
  let toggleY = 860;

  if (
    mouseX > width / 2 - 125 &&
    mouseX < width / 2 + 125 &&
    mouseY > toggleY - 25 &&
    mouseY < toggleY + 25
  ) {
    controlMode = controlMode === "mouse" ? "keyboard" : "mouse";
  } else {
    state = "menu";
  }
}

function clicked(y) {
  return (
    mouseX > width / 2 - 125 &&
    mouseX < width / 2 + 125 &&
    mouseY > y - 25 &&
    mouseY < y + 25
  );
}

//////////////////// GAME ////////////////////
function startGame(diff) {
  difficulty = diff;
//holy difficulty change
  speedMultiplier =
    diff === "Easy" ? 1.25 : diff === "Normal" ? 1.75 : diff === "Hard" ? 2.5 : 3.25;

  initGame();
  state = "game";
  if (music) {
    if (!music.isPlaying()) {
      music.loop();
    }
  }
}

function initGame() {
  paddle = new Paddle();
  balls = [new Ball()];
  bricks = [];
  powerups = [];

  game_score = 0;
  scoreSubmitted = false;
  lives = 3;

  createBricks();
}

function runGame() {
  if (!paused) {
    paddle.update();
  }
  paddle.show();

  if (!paused) {
    for (let ball of balls) {
      ball.update();
      ball.show();
    }

    checkCollisions();

    if (allBricksCleared()) {
      game_score += 100 * level;
      level++;

      // increase difficulty each level
      speedMultiplier *= 1.15;

      // reset board but KEEP player state
      createBricks();

      // reset balls with new speed
      balls = [new Ball()];
    }

    balls = balls.filter((b) => !b.dead);

    if (balls.length === 0) {
      lives--;

      if (sfx.loseLife && sfx.loseLife.isLoaded()) {
        sfx.loseLife.play();
      }

      if (lives <= 0) {
        saveScore();
        state = "gameover";
      } else {
        balls = [new Ball()];
      }
    }

    for (let p of powerups) {
      p.update();
      p.show();
    }

    powerups = powerups.filter((p) => p.active);

    updateEffects();
    updateFloatingTexts();
  }

  // ALWAYS draw these
  for (let ball of balls) {
    ball.show();
  }

  for (let p of powerups) {
    p.show();
  }

  for (let b of bricks) {
    b.show();
  }

  paddle.show();
  drawHUD();
  drawActiveEffects();

  if (paused) drawPauseOverlay();
}

//////////////////// OBJECTS ////////////////////

class Paddle {
  constructor() {
    this.baseRatio = 0.15;
    this.scale = 1;
    this.h = 15;
    this.x = width / 2;
    this.y = height - 50;
  }

  update() {
    this.w = width * this.baseRatio * this.scale;

    let speed = 10;

    if (controlMode === "mouse") {
      this.x = mouseX;
    } else {
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) this.x -= 2 * speed;
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) this.x += 2 * speed;
    }

    this.x = constrain(this.x, this.w / 2, width - this.w / 2);
  }

  show() {
    rectMode(CENTER);
    fill(255);
    rect(this.x, this.y, this.w, this.h);
  }
}

class Ball {
  constructor() {
    this.r = 10;
    this.dead = false;
    this.reset();
  }

  reset() {
    this.x = width / 2;
    this.y = height / 2;

    let angle = random(PI/4, 3* PI/4);
    let speed = 6 * speedMultiplier;

    this.vx = cos(angle) * speed;
    this.vy = -abs(sin(angle) * speed);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x < this.r || this.x > width - this.r) {
      this.vx *= -1;
    }

    if (this.y < this.r) {
      this.vy *= -1;
    }

    if (this.y > height) {
      this.dead = true;
    }

    if (abs(this.vx) < 1) {
      this.vx += random(-1, 1);
    }
  }

  show() {
    fill(255);
    noStroke();
    ellipse(this.x, this.y, this.r * 2);
  }
}

class Brick {
  constructor(row, col, rows, cols, colColor) {
    this.row = row;
    this.col = col;
    this.rows = rows;
    this.cols = cols;
    this.color = colColor;
    this.alive = true;
  }

  getDimensions() {
    let w = width / this.cols;
    let h = 30;
    let x = this.col * w;
    let y = this.row * h + 80;
    return { x, y, w, h };
  }

  show() {
    if (!this.alive) return;

    let { x, y, w, h } = this.getDimensions();

    push();
    rectMode(CORNER);
    fill(this.color);
    stroke(0);
    strokeWeight(2);
    rect(x, y, w, h, 8);
    pop();
  }
}

class Powerup {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.size = 40;
    this.type = type;
    this.speed = 3;
    this.active = true;
  }

  update() {
    this.y += this.speed;

    if (
      this.y + this.size / 2 > paddle.y &&
      this.x > paddle.x - paddle.w / 2 &&
      this.x < paddle.x + paddle.w / 2
    ) {
      this.applyEffect();
      this.active = false;
    }

    if (this.y > height) {
      if (this.type === "savingGrace") {
        lives--;

        if (sfx.loseLife && sfx.loseLife.isLoaded()) {
          sfx.loseLife.play();
        }

        spawnFloatingText(this.x, height - 40, "loseLife");

        if (lives <= 0) {
          saveScore();
          state = "gameover";
        }
      }

      this.active = false;
    }
  }

  show() {
    if (!this.active) return;

    rectMode(CENTER);

    stroke(255);
    strokeWeight(2);
    fill(30);
    rect(this.x, this.y, this.size, this.size, 6);

    fill(this.getColor());
    noStroke();

    textAlign(CENTER, CENTER);
    textSize(12);
    text(this.getLabel(), this.x, this.y);
  }

  getLabel() {
    switch (this.type) {
      case "multiball":
        return "MB";
      case "long":
        return "L+";
      case "short":
        return "L-";
      case "fast":
        return "F+";
      case "slow":
        return "F-";
      case "big":
        return "B+";
      case "savingGrace":
        return "SG";
    }
  }

  getColor() {
    if (this.type === "savingGrace") {
      let flash = sin(millis() * 0.02) * 127 + 128;
      return color(flash, flash, 0);
    }

    switch (this.type) {
      case "multiball":
        return color(0, 255, 255);
      case "long":
        return color(0, 255, 0);
      case "short":
        return color(255, 0, 0);
      case "fast":
        return color(255, 165, 0);
      case "slow":
        return color(0, 0, 255);
      case "big":
        return color(255, 0, 255);
      default:
        return color(255);
    }
  }

  applyEffect() {
    let duration = 20000;

    switch (this.type) {
      case "multiball":
        spawnExtraBalls(2);
        break;

      case "long":
        addEffect(
          "long",
          duration,
          () => (paddle.scale = 1.3),
          () => (paddle.scale = 1)
        );
        break;

      case "short":
        addEffect(
          "short",
          duration,
          () => (paddle.scale = 0.7),
          () => (paddle.scale = 1)
        );
        break;

      case "fast":
        addEffect(
          "fast",
          duration,
          () =>
            balls.forEach((b) => {
              b.vx *= 1.3;
              b.vy *= 1.3;
            }),
          () =>
            balls.forEach((b) => {
              b.vx /= 1.3;
              b.vy /= 1.3;
            })
        );
        break;

      case "slow":
        addEffect(
          "slow",
          duration,
          () =>
            balls.forEach((b) => {
              b.vx *= 0.7;
              b.vy *= 0.7;
            }),
          () =>
            balls.forEach((b) => {
              b.vx /= 0.7;
              b.vy /= 0.7;
            })
        );
        break;

      case "big":
        addEffect(
          "big",
          duration,
          () => balls.forEach((b) => (b.r *= 1.4)),
          () => balls.forEach((b) => (b.r /= 1.4))
        );
        break;
    }

    spawnFloatingText(this.x, this.y, this.type);
  }
}

function addEffect(name, duration, applyFn, removeFn) {
  let existing = activeEffects.find((e) => e.name === name);

  if (existing) {
    // refresh timer only (NO stacking)
    existing.endTime = millis() + duration;
    return;
  }

  applyFn();

  activeEffects.push({
    name,
    endTime: millis() + duration,
    remove: removeFn,
  });
}

function updateEffects() {
  let now = millis();

  for (let e of activeEffects) {
    if (now > e.endTime) {
      e.remove();
      e.expired = true;
    }
  }

  activeEffects = activeEffects.filter((e) => !e.expired);
}

//////////////////// BRICKS ////////////////////
function createBricks() {
  bricks = [];

  let rows = 5;
  let cols = 10;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let t = (r + c) / (rows + cols);
      let col = rainbowColor(t);
      bricks.push(new Brick(r, c, rows, cols, col));
    }
  }
}

function allBricksCleared() {
  return bricks.every((b) => !b.alive);
}

function rainbowColor(t) {
  let r = 127 + 127 * sin(TWO_PI * t);
  let g = 127 + 127 * sin(TWO_PI * t + TWO_PI / 3);
  let b = 127 + 127 * sin(TWO_PI * t + (2 * TWO_PI) / 3);
  return color(r, g, b);
}

function drawActiveEffects() {
  let x = width - 200;
  let y = 20;

  textAlign(LEFT, TOP);
  textSize(16);

  for (let e of activeEffects) {
    let timeLeft = max(0, (e.endTime - millis()) / 1000).toFixed(1);

    fill(255);
    text(`${e.name.toUpperCase()} (${timeLeft}s)`, x, y);

    y += 25;
  }
}

//////////////////// COLLISIONS ////////////////////
function checkCollisions() {
  for (let ball of balls) {
    // paddle
    if (
      ball.y + ball.r > paddle.y &&
      ball.y - ball.r < paddle.y + paddle.h &&
      ball.x > paddle.x - paddle.w / 2 &&
      ball.x < paddle.x + paddle.w / 2 &&
      ball.vy > 0
    ) {
      let hit = (ball.x - paddle.x) / (paddle.w / 2);
      let angle = hit * (PI / 3);
      let speed = sqrt(ball.vx * ball.vx + ball.vy * ball.vy);

      ball.vx = sin(angle) * speed;
      ball.vy = -cos(angle) * speed;

      if (sfx.paddle && sfx.paddle.isLoaded()) sfx.paddle.play();
    }

    // bricks
    for (let b of bricks) {
      if (!b.alive) continue;

      let { x, y, w, h } = b.getDimensions();

      if (
        ball.x + ball.r > x &&
        ball.x - ball.r < x + w &&
        ball.y + ball.r > y &&
        ball.y - ball.r < y + h
      ) {
        ball.vy *= -1;

        b.alive = false;
        game_score += 10 * level;

        maybeSpawnPowerup(x + w / 2, y + h / 2);

        if (sfx.brick && sfx.brick.isLoaded()) sfx.brick.play();

        break;
      }
    }
  }
}

function spawnFloatingText(x, y, type) {
  let text;

  if (type === "loseLife") {
    text = "-1 Life";
  } else {
    if (type === "savingGrace") {
      text = "Saving Grace";
    } else {
      text = `Modifier: ${getDisplayName(type)}`;
    }
  }

  floatingTexts.push({
    x,
    y,
    text,
    type,
    start: millis(),
    duration: 1000,
  });
}

function getDisplayName(type) {
  switch (type) {
    case "multiball":
      return "Multiball";
    case "long":
      return "Long Paddle";
    case "short":
      return "Short Paddle";
    case "fast":
      return "Fast Ball";
    case "slow":
      return "Slow Ball";
    case "big":
      return "Big Ball";
    case "savingGrace":
      return "Saving Grace";
  }
}

function updateFloatingTexts() {
  let now = millis();

  for (let t of floatingTexts) {
    let life = (now - t.start) / t.duration;

    if (life > 1) {
      t.dead = true;
      continue;
    }

    // upward float
    t.y -= 0.5;

    // flashing color
    let flash = sin(now * 0.02) * 127 + 128;

    if (t.type === "loseLife") {
      textSize(100);
      fill(255, flash * 0.3, flash * 0.3); // red flash
    } else {
      fill(flash, 255 - flash, 255);
    }

    textAlign(CENTER);
    if (t.type === "loseLife") {
      textSize(30);
    } else {
      textSize(16);
    }

    text(t.text, t.x, t.y);
  }

  floatingTexts = floatingTexts.filter((t) => !t.dead);
}
//////////////////// POWERUPS ////////////////////
function maybeSpawnPowerup(x, y) {
  let chance =
    difficulty === "Easy"
      ? 0.4
      : difficulty === "Normal"
      ? 0.25
      : difficulty === "Hard"
      ? 0.15
      : 0.5;

  if (random() < chance) {
    let types;

    if (difficulty === "Extreme") {
      // ONLY NEGATIVE
      types = ["fast", "short", "savingGrace", "multiball"];
    } else {
      // mixed pool
      types = ["multiball", "long", "short", "fast", "slow", "big"];
    }

    let type = random(types);
    powerups.push(new Powerup(x, y, type));
  }
}

function spawnExtraBalls(n) {
  for (let i = 0; i < n; i++) {
    let b = new Ball();
    b.x = balls[0].x;
    b.y = balls[0].y;
    balls.push(b);
  }
}

function keyPressed() {
  if (key === "p" || key === "P") {
    if (state === "game") {
      paused = !paused;

      if (music) {
        if (paused) music.pause();
        else music.loop();
      }
    }
  }
}

function drawPauseOverlay() {
  push();

  rectMode(CORNER);
  noStroke();
  fill(0, 200);
  rect(0, 0, width, height);

  textAlign(CENTER, CENTER);
  fill(255);

  textSize(60);
  text("PAUSED", width / 2, height / 2);

  textSize(20);
  text("Press P to resume", width / 2, height / 2 + 60);

  pop();
}

//////////////////// UI ////////////////////
function drawHUD() {
  textAlign(LEFT, TOP);
  fill(255);
  textSize(20);
  text("Score: " + game_score, 20, 20);
  text("Lives: " + lives, 220, 20);
  text("Level: " + level, 420, 20);
}

function drawGameOver() {
  textAlign(CENTER, CENTER);
  textSize(40);
  fill(255);
  text("Game Over", width / 2, height / 2 - 40);
  textSize(20);
  text("Click to return", width / 2, height / 2 + 40);
  if(!scoreSubmitted){
    scoreSubmitted = true;
    submitScore();
  }
}

async function submitScore(){
    try{
      const token = localStorage.getItem("access_token");
      const scoreData = {
            game: "Hyperspace Breaker",
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

function drawScores() {
  textAlign(CENTER, CENTER);
  textSize(40);
  fill(255);
  text("High Scores", width / 2, height / 4);

  textSize(20);
  text("Easy: " + highScores.Easy, width / 2, height / 2 - 40);
  text("Normal: " + highScores.Normal, width / 2, height / 2);
  text("Hard: " + highScores.Hard, width / 2, height / 2 + 40);
  text("Extreme: " + highScores.Extreme, width / 2, height / 2 + 80);
}

//////////////////// SCORES ////////////////////
function loadScores() {
  let data = localStorage.getItem("brickScores");
  if (data) highScores = JSON.parse(data);
  else highScores = { Easy: 0, Normal: 0, Hard: 0, Extreme: 0 };
}

function saveScore() {
  if (score > highScores[difficulty]) {
    highScores[difficulty] = game_score;
    localStorage.setItem("brickScores", JSON.stringify(highScores));
  }
}
