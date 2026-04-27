//so I forgor to add the highscore stuff for online
//hopefully this saves
// easy: "ms_easy"
// medium: "ms_medium"
// hard: "ms_hard"
//highly recommend changes

let gameFont;

let state = "menu";
let explosions = [];
let cols, rows, totalMines;
let grid;
let cellSize;
let offsetX, offsetY;

let timer = 0;
let startTime;

let gameOver = false;
let win = false;
let difficulty = "";

let flagsPlaced = 0;
let revealQueue = [];
let scoreSubmitted = false;

let lastClickTime = 0;

let bestTimes = {
  easy: localStorage.getItem("ms_easy") || null,
  medium: localStorage.getItem("ms_medium") || null,
  hard: localStorage.getItem("ms_hard") || null
};

/* ================= THEMES ================= */
let themes = {
  dark: { bg:[120], grid:[100], revealed:[70], text:[255] },
  light: { bg:[220], grid:[180], revealed:[240], text:[20] },
  neon: { bg:[10,10,30], grid:[0,255,200], revealed:[20,20,60], text:[0,255,200] }
};

let currentTheme = "dark";


function preload(){
  gameFont = loadFont("../static/content/_fonts/airstrike.ttf")
}


/* ================= SETUP ================= */
function setup(){
  textFont(gameFont)
  let hei = document.getElementById("window").clientHeight;
  let wid = document.getElementById("window").clientWidth; 
  canvas = createCanvas(wid, hei).parent("window")
  textAlign(CENTER, CENTER);
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

/* ================= DRAW ================= */
function draw(){
  
  if (random() < 0.1) {
  explosions.push(new Explosion(
    random(width),
    random(height)
  ));
}
  
  background(...themes[currentTheme].bg);

  for (let i = explosions.length - 1; i >= 0; i--) {
  explosions[i].update();
  explosions[i].show();

  if (explosions[i].done()) {
    explosions.splice(i, 1);
  }
}
  
  
  if(state==="menu") drawMenu();
  if(state==="info") drawInfo();
  if(state==="game") drawGame();
}

/* ================= MENU ================= */
function drawMenu(){
  fill(...themes[currentTheme].text);
  textSize(40);
  text("MINESWEEPER", width/2, 100);

  drawButton("Easy", width/2-50, 200);
  drawButton("Medium", width/2-50, 270);
  drawButton("Hard", width/2-50, 340);
  drawButton("Info", width/2-50, 410);

  textSize(16);
  text(`Best Easy: ${bestTimes.easy || "-"}`, width/2, 480);
  text(`Best Medium: ${bestTimes.medium || "-"}`, width/2, 500);
  text(`Best Hard: ${bestTimes.hard || "-"}`, width/2, 520);

  drawButton("Dark", 50, height-80);
  drawButton("Light", 200, height-80);
  drawButton("Neon", 350, height-80);
}

/* blow up go brrr */
class Explosion {
  constructor(x, y) {
    this.particles = [];
    for (let i = 0; i < 20; i++) {
      this.particles.push(new Particle(x, y));
    }
    this.life = 100;
  }

  update() {
    for (let p of this.particles) {
      p.update();
    }
    this.life--;
  }

  show() {
    for (let p of this.particles) {
      p.show();
    }
  }

  done() {
    return this.life <= 0;
  }
}

class Particle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.life = 100;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  show() {
    noStroke();
    fill(255, random(100,255), 0, this.life * 4);
    ellipse(this.x, this.y, 5);
  }
}

/* ================= INFO ================= */
function drawInfo(){
  fill(...themes[currentTheme].text);

  textSize(28);
  text("HOW TO PLAY", width/2, 120);

  textSize(16);
  text(
`Left Click: Reveal
Right Click or Spacebar: Flag
Double Click or F: Auto-clear

Clear all safe tiles to win.`,
    width/2,
    height/2
  );

  drawButton("Back", width/2-50, height-120);
}

/* ================= GAME ================= */
function startGame(diff){
  difficulty = diff;

  if(diff==="easy"){cols=10;rows=10;totalMines=10;}
  if(diff==="medium"){cols=16;rows=16;totalMines=40;}
  if(diff==="hard"){cols=22;rows=22;totalMines=99;}

  computeCellSize();

  grid = makeGrid();
  placeMines();
  calculateNumbers();

  flagsPlaced = 0;
  revealQueue = [];

  startTime = millis();
  timer = 0;

  gameOver = false;
  win = false;
  scoreSubmitted = false;

  state = "game";
}

function computeCellSize(){
  let maxW = width*0.9;
  let maxH = height*0.75;

  cellSize = floor(min(maxW/cols, maxH/rows));
  offsetX = (width - cols*cellSize)/2;
  offsetY = (height - rows*cellSize)/2;
}

function drawGame(){
  push();
  translate(offsetX, offsetY);

  processRevealQueue();

  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){
      grid[i][j].show();
    }
  }
  pop();

  if(!gameOver && !win){
    timer = floor((millis()-startTime)/1000);
  }

  fill(...themes[currentTheme].text);
  textSize(18);

  let flagsLeft = totalMines - flagsPlaced;
  textSize(32)
  text(`Time: ${timer}`, width/2, 30);
  text(`Mines: ${totalMines} | Flags Left: ${flagsLeft}`, width/2, 55);

  drawMenuButton();

  if(gameOver) text("Game Over", width/2, height-40);
  if(win){
    text("You Win!", width/2, height-40);

    if(!scoreSubmitted){
      scoreSubmitted = true;
      submitScore();
    }

  }

async function submitScore(){
    try{
      const token = localStorage.getItem("access_token");
      const scoreData = {
            game: "Minesweeper",
            val: timer,
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
}

/* ================= INPUT ================= */
function mousePressed(){
  let now = millis();
  if(now - lastClickTime < 250) return;
  lastClickTime = now;

  if(state==="menu"){
    if(inButton(width/2-50,200)) startGame("easy");
    if(inButton(width/2-50,270)) startGame("medium");
    if(inButton(width/2-50,340)) startGame("hard");
    if(inButton(width/2-50,410)) state="info";

    if(inButton(50,height-80)) currentTheme="dark";
    if(inButton(200,height-80)) currentTheme="light";
    if(inButton(350,height-80)) currentTheme="neon";
  }

  else if(state==="info"){
    if(inButton(width/2-50,height-120)) state="menu";
  }

  else if(state==="game"){
    if(overMenuButton()){ state="menu"; return; }

    let i = floor((mouseX-offsetX)/cellSize);
    let j = floor((mouseY-offsetY)/cellSize);

    if(!valid(i,j)) return;

    let cell = grid[i][j];

    if(mouseButton===RIGHT){
      cell.flagged = !cell.flagged;
      flagsPlaced += cell.flagged ? 1 : -1;
      return false;
    }

    if(!cell.flagged){
      enqueueReveal(i,j);

      if(cell.mine){
        gameOver = true;
        revealAll();
      }
    }

    checkWin();
  }
}

/* F */
function keyPressed() {
  if (state !== "game" || gameOver || win) return;

  let i = floor((mouseX - offsetX) / cellSize);
  let j = floor((mouseY - offsetY) / cellSize);

  if (!valid(i, j)) return;

  let cell = grid[i][j];

  // SPACEBAR = toggle flag
  if (key === ' ') {
    if (!cell.revealed) {
      cell.flagged = !cell.flagged;
      flagsPlaced += cell.flagged ? 1 : -1;
    }
    return;
  }

  // F key = chord
  if (key === 'f' || key === 'F') {
    if (!cell.revealed || cell.neighborCount === 0 || cell.flagged) return;
    chord(i, j);
  }
}

/* DOUBLE CLICK */
function doubleClicked(){
  if(state!=="game") return;

  let i = floor((mouseX-offsetX)/cellSize);
  let j = floor((mouseY-offsetY)/cellSize);

  if(valid(i,j)) chord(i,j);
}

/* ================= CHORD ================= */
function chord(i,j){
  let cell = grid[i][j];
  if(!cell.revealed || cell.neighborCount===0 || cell.flagged) return;

  let flags = countFlagsAround(i,j);

  if(flags === cell.neighborCount){
    for(let x=-1;x<=1;x++){
      for(let y=-1;y<=1;y++){
        let ni=i+x, nj=j+y;
        if(valid(ni,nj)){
          let n = grid[ni][nj];
          if(!n.flagged && !n.revealed){
            enqueueReveal(ni,nj);
            if(n.mine){
              gameOver = true;
              revealAll();
            }
          }
        }
      }
    }
  }
}

/* ================= FLOOD FILL ================= */
function enqueueReveal(i,j){
  revealQueue.push([i,j]);
}

function processRevealQueue(){
  let speed = 6;

  for(let s=0; s<speed && revealQueue.length>0; s++){
    let [i,j] = revealQueue.shift();
    let cell = grid[i][j];

    if(cell.revealed || cell.flagged) continue;

    cell.revealed = true;

    if(cell.neighborCount===0 && !cell.mine){
      for(let x=-1;x<=1;x++){
        for(let y=-1;y<=1;y++){
          let ni=i+x, nj=j+y;
          if(valid(ni,nj)){
            let n = grid[ni][nj];
            if(!n.revealed) revealQueue.push([ni,nj]);
          }
        }
      }
    }
  }
}

/* ================= CELL ================= */
class Cell{
  constructor(i,j){
    this.i=i; this.j=j;
    this.mine=false;
    this.revealed=false;
    this.flagged=false;
    this.neighborCount=0;
  }

  show(){
    stroke(...themes[currentTheme].grid);
    noFill();
    rect(this.i*cellSize,this.j*cellSize,cellSize,cellSize);

    if(this.revealed){
      fill(...themes[currentTheme].revealed);
      rect(this.i*cellSize,this.j*cellSize,cellSize,cellSize);

      if(this.mine){
        fill(255,0,0);
        ellipse(this.i*cellSize+cellSize/2,this.j*cellSize+cellSize/2,cellSize*0.5);
      } else if(this.neighborCount>0){
        drawPixelNumber(
          this.neighborCount,
          this.i*cellSize+cellSize/2,
          this.j*cellSize+cellSize/2,
          cellSize*0.6
        );
      }
    }

    if(this.flagged){
      fill(255,200,0);
      triangle(
        this.i*cellSize+5,this.j*cellSize+cellSize-5,
        this.i*cellSize+5,this.j*cellSize+5,
        this.i*cellSize+cellSize-5,this.j*cellSize+cellSize/2
      );
    }
  }
}

/* ================= UTIL ================= */
function valid(i,j){
  return i>=0 && j>=0 && i<cols && j<rows;
}

function countFlagsAround(i,j){
  let count=0;
  for(let x=-1;x<=1;x++){
    for(let y=-1;y<=1;y++){
      let ni=i+x,nj=j+y;
      if(valid(ni,nj) && grid[ni][nj].flagged) count++;
    }
  }
  return count;
}

function makeGrid(){
  let arr=[];
  for(let i=0;i<cols;i++){
    arr[i]=[];
    for(let j=0;j<rows;j++){
      arr[i][j]=new Cell(i,j);
    }
  }
  return arr;
}

function placeMines(){
  let options=[];
  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){
      options.push([i,j]);
    }
  }

  for(let n=0;n<totalMines;n++){
    let index=floor(random(options.length));
    let [i,j]=options.splice(index,1)[0];
    grid[i][j].mine=true;
  }
}

function calculateNumbers(){
  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){
      let total=0;
      for(let x=-1;x<=1;x++){
        for(let y=-1;y<=1;y++){
          let ni=i+x,nj=j+y;
          if(valid(ni,nj) && grid[ni][nj].mine) total++;
        }
      }
      grid[i][j].neighborCount=total;
    }
  }
}

function revealAll(){
  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){
      grid[i][j].revealed=true;
    }
  }
}

function checkWin(){
  let safe=0, revealed=0;

  for(let i=0;i<cols;i++){
    for(let j=0;j<rows;j++){
      if(!grid[i][j].mine) safe++;
      if(grid[i][j].revealed && !grid[i][j].mine) revealed++;
    }
  }

  if(safe===revealed && !gameOver){
    win=true;
  }
}

/* ================= PIXEL FONT ================= */
function drawPixelNumber(num,cx,cy,size){
  const colors={
    1:[0,0,255],2:[0,200,0],3:[255,0,0],
    4:[0,0,150],5:[150,0,0],6:[0,150,150],
    7:[0],8:[100]
  };

  let patterns={
    1:["010","110","010","010","111"],
    2:["111","001","111","100","111"],
    3:["111","001","111","001","111"],
    4:["101","101","111","001","001"],
    5:["111","100","111","001","111"],
    6:["111","100","111","101","111"],
    7:["111","001","010","010","010"],
    8:["111","101","111","101","111"]
  };

  let p=patterns[num];
  let px=size/6;

  let w=p[0].length*px;
  let h=p.length*px;

  let sx=cx-w/2;
  let sy=cy-h/2;

  fill(...colors[num]);

  for(let i=0;i<p.length;i++){
    for(let j=0;j<p[i].length;j++){
      if(p[i][j]==="1"){
        rect(sx+j*px,sy+i*px,px,px);
      }
    }
  }
}

/* ================= BUTTONS ================= */
function drawButton(label,x,y){
  fill(100);
  rect(x,y,100,50,10);
  fill(255);
  textSize(16);
  text(label,x+50,y+25);
}

function inButton(x,y){
  return mouseX>x && mouseX<x+100 && mouseY>y && mouseY<y+50;
}

function drawMenuButton(){
  fill(120);
  rect(10,10,120,40,8);
  fill(255);
  textSize(14);
  text("Main Menu",70,30);
}

function overMenuButton(){
  return mouseX>10 && mouseX<130 && mouseY>10 && mouseY<50;
}
