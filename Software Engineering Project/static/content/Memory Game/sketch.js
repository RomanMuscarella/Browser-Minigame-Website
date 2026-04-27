let sequence = [];
let userSequence = [];
let state = "start"

//change to window_width, window_height

let game_score = 0;
let highScore;

let inds = [0, 1, 2, 3]
let f = [0, 0, 0, 0]
let indC = []
let geen = 0;

function setup() {
  frameRate(30);
  let hei = document.getElementById("window").clientHeight;
  let wid = document.getElementById("window").clientWidth; 
  canvas = createCanvas(wid, hei).parent("window")
  dimx = width;
  dimy = height;
  // creates the indicators colors to be displayed
  // colors
  let c1 = color(250, 121, 99, 255);
  let c2 = color(169, 250, 99, 255);
  let c3 = color(99, 204, 250, 255);
  let c4 = color(255, 227, 125, 255)
  
  indC.push(c1);
  indC.push(c2);
  indC.push(c3);
  indC.push(c4);
  
  highScore = getItem("high score")
}

function draw() {
  background(100, 100, 100);
  if (state === "start") {
    startScreen();
  } else {
    showIndicators()
    showLiveScore()
    if(state === "wait") {
      wait()
    }
    if(state === "flash") {
      flashCurrentIndicator()
    }
    updateFlashes()
    if (state === "game over") {
      gameOver()
    }
  }
}

function showLiveScore() {
  if (geen > 0); {
    geen -= 19;
    geen = max(geen, 0)
  }
  let c = color(255-geen, 255, 255-geen)
  translate(-width/2, -height/2);
  textSize(35);
  textAlign(LEFT)
  textFont('Arial');
  textStyle(BOLD)
  fill(c);
  text(
  `Score: ${game_score}`,
    12,
    45
  );
  fill(255)
  text(
  `High score: ${highScore}`,
    12,
    85
  );
}
 
function updateFlashes() {
  for (let i = 0; i < f.length; i++) {
    if (f[i] > 0) {
      f[i] -= 0.05; // fade speed
      f[i] = max(f[i], 0);
    }
  }
}
function wait() {
  let frames = 30
  if (waitTime >= frames) {
    state = "flash";
  } else {
    waitTime += 1
  }
}

function flashCurrentIndicator() {
  let ind = sequence[ci];
  let col = indC[ind];
  let w = color(255);
  
  let amt;
  amt = map(t, 0.5, 1, 0.5, 0);
  let lc = lerpColor(col, w, amt);
  push();
  translate(width/2, height/2);
  switch(ind) {
    case 1:
      rotate(HALF_PI);
      break;
    case 2:
      rotate(PI);
      break;
    case 3:
      rotate(PI);
      rotate(HALF_PI);
      break;
  }
  fill(lc);
  indicator(0, -50);
  pop();
  
  t += 0.1;
  if (t>= 1) {
    t = 0;
    ci++;
    if (ci >= sequence.length) {
      state = "input";
      ci = 0
    }
  }
}

function startGame() {
  game_score = 0
  sequence = [];
  sequence.push(floor(random(4)));
  ci = 0;
  userSequence = [];
  t = 0
  state = "wait";
  waitTime = 0
  loop();
}

function gameOver() {
  highScore = max(game_score, highScore)
  storeItem("high score", highScore)
  noLoop();
  push();
  stroke(0)
  strokeWeight(3)
  let c1 = color(255, 255, 255, 100);
  fill(c1);
  rect(0, 0, width, height);
  translate(width/2, height/2);
  textAlign(CENTER)
  textFont('Consolas')
  textSize(60)
  fill(255);
  text(
  `Game over!
Your score: ${game_score}
Click to play again`,
    0,
    0
  );
  pop();
}

function nextRound() {
  geen = 200;
  userSequence = [];
  sequence.push(floor(random(4)));
  
  ci = 0;
  t = 0;
  waitTime = 0;
  state = "wait";
}

function showIndicators() {
  translate(width/2, height/2)

  let b = color(0)
  let w = color(255)
  for (let i = 0; i < inds.length; i++) {
    let lc = lerpColor(indC[i], b, 0.60);
    let c = lerpColor(indC[i], w, f[i]);
    stroke(lc);
    fill(c);
    //let x1 = indV[i].x;
    //let y1 = indV[i].y;
    let x1 = 0;
    let y1 = -50;
    indicator(x1, y1, i);
    rotate(HALF_PI);
  } // returns to normal rotation
}

// make shape in another function
function indicator(x1, y1, i) {
  strokeWeight(3)
  beginShape();
  vertex(x1, y1);
  quadraticVertex(x1+90, y1-10 ,x1 + 21, y1-150);
  quadraticVertex(x1, y1-180 ,x1 - 21, y1-150);
  quadraticVertex(x1-90, y1-10, x1, y1);
  endShape();
}

function startScreen() {
  
  let c1 = color(255, 255, 255, 100);
  fill(c1);
  rect(0, 0, width, height);
  
  stroke(0);
  strokeWeight(3);
  
  let c2 = color(215,210, 210, 255);
  fill(c2);
  
  beginShape();
  vertex(dimx/4 - 20, dimy/2.5);
  vertex(dimx-dimx/4 + 20, dimy/2.5);
  bezierVertex(dimx-dimx/4+dimx/8, dimy/2-(dimy/10), dimx-dimx/4+dimx/8, dimy/2+dimy/10, dimx-dimx/4 + 20, dimy-dimy/2.5);
  vertex(dimx/4 - 20, dimy-dimy/2.5);
  bezierVertex(dimx/4-dimx/8, dimy/2+dimy/10, dimx/4-dimx/8, dimy/2-dimy/10, dimx/4 - 20, dimy/2.5);
  endShape();
  
  strokeWeight(0);
  fill(0);
  textFont('Courier New');
  textAlign(CENTER);
  textSize(55);
  text(
    'Click to start.',
    dimx/2,
    dimy/2+15
  );
  noLoop();
  
}

function checkInput(val) {
  let answer = sequence[userSequence.length - 1];
  
  if (val != answer) {
    state = "game over";
    return;
  }
  
  if (userSequence.length === sequence.length) {
    game_score += 1;
    nextRound();
  }
}

function keyPressed() {
  if (state !== "input") return;
  
  let km = {
    'ArrowUp': 0,
    'ArrowRight': 1,
    'ArrowDown': 2,
    'ArrowLeft': 3
  };
  
  if (key in km) {
    let val = km[key];
    f[val] = 0.5
    userSequence.push(val);
    checkInput(val);
  }
  
}

function mousePressed() {
  if (state == "start" || state === "game over") {
    startGame()
  }
}

