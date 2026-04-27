let puzzleWords;
let dictionary;
let gameState = "HOME"; // HOME, PLAY, GAMEOVER
let targetWord = "";
let scrambledLetters = "";
let userInput = "";
let totalScore = 0;
let foundWords;
let startTime;
const timeLimit = 60000; // 60 seconds

// Preload text files
function preload() {
  puzzleWordsRaw = loadStrings('six_letter_words.txt');
  dictionaryRaw = loadStrings('words_alpha.txt');
}

function setup() {
  createCanvas(600, 400);
  textFont('Courier New');
  
  // Use custom manual structures for storage
  puzzleWords = new StringList();
  dictionary = new StringSet();
  foundWords = new StringSet();

  // Load 6-letter puzzle words
  for (let s of puzzleWordsRaw) {
    let w = s.trim().toLowerCase();
    if (w.length === 6) puzzleWords.add(w);
  }

  // Load dictionary words (3-6 letters)
  for (let s of dictionaryRaw) {
    let w = s.trim().toLowerCase();
    if (w.length >= 3 && w.length <= 6 && /^[a-z]+$/.test(w)) {
      dictionary.add(w);
    }
  }
}

function draw() {
  background(30);
  
  if (gameState === "HOME") {
    drawHomeScreen();
  } else if (gameState === "PLAY") {
    drawGameScreen();
  } else if (gameState === "GAMEOVER") {
    drawGameOverScreen();
  }
}

// ---------------------------------------------------------
// UI SCREENS
// ---------------------------------------------------------

function drawHomeScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(40);
  text("ANAGRAMS", width / 2, height / 2 - 40);
  
  textSize(16);
  text("60 Seconds | High Stakes Scoring", width / 2, height / 2);

  drawButton(width / 2 - 75, height / 2 + 40, 150, 40, "START GAME");
}

function drawGameScreen() {
  let elapsed = millis() - startTime;
  let remaining = max(0, ceil((timeLimit - elapsed) / 1000));
  
  if (remaining === 0) {
    gameState = "GAMEOVER";
  }

  // Timer Bar
  fill(50);
  rect(50, 30, 500, 10);
  fill(remaining > 10 ? 100 : 255, 100, 100);
  rect(50, 30, map(remaining, 0, 60, 0, 500), 10);

  // Stats
  fill(255);
  textAlign(LEFT);
  textSize(18);
  text(`Score: ${totalScore}`, 50, 70);
  textAlign(RIGHT);
  text(`Time: ${remaining}s`, 550, 70);

  // Scrambled Letters
  textAlign(CENTER);
  textSize(32);
  let displayLetters = scrambledLetters.toUpperCase().split("").join(" ");
  fill(200, 200, 255);
  text(displayLetters, width / 2, 150);

  // Input Box (Custom GUI)
  fill(50);
  stroke(100);
  rect(width / 2 - 100, 190, 200, 40, 5);
  fill(255);
  noStroke();
  textSize(24);
  text(userInput.toUpperCase(), width / 2, 220);

  textSize(14);
  fill(150);
  text("Type and press ENTER", width / 2, 260);
}

function drawGameOverScreen() {
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(36);
  text("TIME'S UP!", width / 2, height / 2 - 80);
  
  textSize(20);
  text(`Original Word: ${targetWord.toUpperCase()}`, width / 2, height / 2 - 30);
  text(`Words Found: ${foundWords.size}`, width / 2, height / 2);
  
  textSize(32);
  fill(255, 204, 0);
  text(`FINAL SCORE: ${totalScore}`, width / 2, height / 2 + 50);

  drawButton(width / 2 - 75, height / 2 + 100, 150, 40, "PLAY AGAIN");
}

function drawButton(x, y, w, h, label) {
  let isHover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  fill(isHover ? 100 : 70);
  stroke(255);
  rect(x, y, w, h, 5);
  noStroke();
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(label, x + w / 2, y + h / 2);
}

// ---------------------------------------------------------
// INPUT HANDLING
// ---------------------------------------------------------

function keyPressed() {
  if (gameState === "PLAY") {
    if (keyCode === BACKSPACE) {
      userInput = userInput.slice(0, -1);
    } else if (keyCode === ENTER) {
      validateWord(userInput);
      userInput = "";
    }
  }
}

function keyTyped() {
  if (gameState === "PLAY" && userInput.length < 6) {
    if (key.length === 1 && key.match(/[a-z]/i)) {
      userInput += key.toLowerCase();
    }
  }
}

function mousePressed() {
  if (gameState === "HOME" || gameState === "GAMEOVER") {
    if (mouseX > width / 2 - 75 && mouseX < width / 2 + 75 && 
        mouseY > height / 2 + 40 && mouseY < height / 2 + 140) {
      startGame();
    }
  }
}

// ---------------------------------------------------------
// GAME LOGIC
// ---------------------------------------------------------

function startGame() {
  totalScore = 0;
  foundWords = new StringSet();
  targetWord = puzzleWords.get(floor(random(puzzleWords.size)));
  scrambledLetters = scramble(targetWord);
  startTime = millis();
  gameState = "PLAY";
}

function validateWord(word) {
  if (word.length < 3) return;
  if (foundWords.contains(word)) return;
  
  if (isValidSubset(word, targetWord) && dictionary.contains(word)) {
    totalScore += calculatePoints(word.length);
    foundWords.add(word);
  }
}

function calculatePoints(len) {
  if (len === 3) return 100;
  if (len === 4) return 400;
  if (len === 5) return 1200;
  if (len === 6) return 3600;
  return 0;
}

function scramble(word) {
  let arr = word.split("");
  for (let i = arr.length - 1; i > 0; i--) {
    let j = floor(random(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join("");
}

function isValidSubset(input, target) {
  let counts = {};
  for (let char of target) counts[char] = (counts[char] || 0) + 1;
  for (let char of input) {
    if (!counts[char] || counts[char] <= 0) return false;
    counts[char]--;
  }
  return true;
}

// ---------------------------------------------------------
// MANUAL DATA STRUCTURES
// ---------------------------------------------------------

class StringList {
  constructor() {
    this.data = [];
    this.size = 0;
  }
  add(val) {
    this.data.push(val);
    this.size++;
  }
  get(idx) {
    return this.data[idx];
  }
}

class StringSet {
  constructor() {
    this.table = new Array(20003).fill(null);
    this.size = 0;
  }

  hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
      h = (31 * h + s.charCodeAt(i)) % this.table.length;
    }
    return h;
  }

  add(val) {
    if (this.contains(val)) return;
    let idx = this.hash(val);
    let newNode = { val: val, next: this.table[idx] };
    this.table[idx] = newNode;
    this.size++;
  }

  contains(val) {
    let idx = this.hash(val);
    let curr = this.table[idx];
    while (curr) {
      if (curr.val === val) return true;
      curr = curr.next;
    }
    return false;
  }
}