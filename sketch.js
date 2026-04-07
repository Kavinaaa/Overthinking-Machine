// Overthinking Machine

//variables
let userInput = "";
let typingActive = true;
let cursorVisible = true;
let cursorTimer = 0;
let cursorInterval = 500;
let restartButton;
let myFont;

// Stars
let stars = [];
let t = 0;

// Thoughts
let thoughtManager;

function preload() {
  myFont = loadFont("VT323-Regular.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textAlign(CENTER, CENTER);
  textSize(25);
  textFont(myFont);

  // Initialize stars
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: random(width),
      y: random(height),
      size: random(1.5, 3),
      speed: random(0.1, 0.3),
    });
  }

  //create the restart button, style it
  let restartButton = createButton('↺ restart');
  restartButton.position(20, 20);
  restartButton.style('font-family', 'VT323, monospace');
  restartButton.style('font-size', '22px');
  restartButton.style('background', 'transparent');
  restartButton.style('border', '1px solid rgba(0,0,0,0.3)');
  restartButton.style('color', 'rgba(0,0,0,0.5)');
  restartButton.style('padding', '6px 16px');
  restartButton.style('cursor', 'pointer');
  restartButton.style('letter-spacing', '2px');
  restartButton.style('border-radius', '4px');
  restartButton.mousePressed(resetSketch);

  //max 300 thoughts, duplicates every 2 seconds, chaos speed 0.005
  thoughtManager = new ThoughtManager(300, 2000, 0.005);
}

//reset function
function resetSketch() {
  thoughtManager.thoughts = [];
  thoughtManager.lastDupTime = 0;
  thoughtManager.dupInterval = 2000;
  userInput = "";
  typingActive = true;
  cursorVisible = true;
}

function draw() {
  drawGradient();
  drawStars();

  // Draw and update thoughts
  thoughtManager.update();
  thoughtManager.display();

  // Draw blinking cursor + input text
  if (typingActive) {
    drawInputText();
  }
}

//background gradient
function drawGradient() {
  noFill();
  let c1 = color(230 + sin(t) * 10, 240 + sin(t + 1) * 10, 255);
  let c2 = color(255, 230 + sin(t + 2) * 10, 240 + sin(t + 3) * 10);
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    stroke(lerpColor(c1, c2, inter));
    line(0, y, width, y);
  }
  t += 0.08;
}

//stars
function drawStars() {
  for (let s of stars) {
    drawingContext.shadowBlur = 20; //glow
    drawingContext.shadowColor = color(255, 255, 255, 180); //white glow

    fill(255, 255);
    noStroke();
    ellipse(s.x, s.y, s.size);

    // Move star upward
    s.y -= s.speed;
    if (s.y < 0) s.y = height;
  }
  drawingContext.shadowBlur = 0;
}

function drawInputText() {
  // Toggle cursor
  if (millis() - cursorTimer > cursorInterval) {
    cursorVisible = !cursorVisible;
    cursorTimer = millis();
  }

  fill(0, 80);
  textSize(20);
  text("Type one thought, watch it consume everything…", width / 2, height / 2 - 50);

  // Draw user input
  fill(0);
  noStroke();
  text(userInput, width / 2, height / 2);

  // Draw thin blinking cursor
  if (cursorVisible) {
    stroke(0);
    strokeWeight(2);
    let tw = textWidth(userInput);
    line(
      width / 2 + tw / 2 + 2,
      height / 2 - 20,
      width / 2 + tw / 2 + 2,
      height / 2 + 20
    );
    noStroke();
  }
}

// Capture key presses
function keyTyped() {
  if (keyCode !== ENTER && keyCode !== BACKSPACE) {
    userInput += key;
  }
}

function keyPressed() {
  if (keyCode === BACKSPACE) {
    userInput = userInput.substring(0, userInput.length - 1);
  } else if (keyCode === ENTER && userInput !== '') {
  thoughtManager.addThought(new Thought(userInput, width / 2, height / 2));
  generateThoughts(userInput);
  userInput = '';
  typingActive = false;
  cursorVisible = false;
  }
}

async function generateThoughts(input) {
  try {
    const response = await fetch('http://localhost:3000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input })
    });

    const data = await response.json();

    data.thoughts.forEach((thought, i) => {
      setTimeout(() => {
        thoughtManager.addThought(new Thought(thought, width / 2, height / 2));
      }, i * 400);
    });
  } catch (err) {
    console.error('AI generation failed:', err);
  }
}

// Thought Class
class Thought {
  constructor(content, x, y) {
    this.content = content;
    this.x = x + random(-20, 20);
    this.y = y + random(-20, 20);
    this.baseSize = 24;
    this.size = this.baseSize;
    this.speedX = random(-2, 2);
    this.speedY = random(-2, 2);

    // Rotation properties
    this.angle = 0;
    this.angleSpeed = random(-0.02, 0.02);
    this.rotationDelay = random(1000, 3000);
    this.creationTime = millis();

    // Pulse properties
    this.pulseOffset = random(TWO_PI);
    this.pulseSpeed = 0.05; // slower pulse
    this.pulseAmount = 5; // max pixels to grow/shrink
  }

  update(chaosLevel) {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > width) this.speedX *= -1;
    if (this.y < 0 || this.y > height) this.speedY *= -1;

    // Start rotation after delay
    if (millis() - this.creationTime > this.rotationDelay) {
      this.angle += this.angleSpeed;
    }

    // Pulse size, sin makes it grow and shrink
    this.size =
      this.baseSize +
      sin(frameCount * this.pulseSpeed + this.pulseOffset) * this.pulseAmount;

    //mouse repulsion
    let dx = this.x - mouseX;
    let dy = this.y - mouseY;
    let d = sqrt(dx * dx + dy * dy);
    if (d < 60) {
      this.speedX += (dx / d) * 0.5;
      this.speedY += (dy / d) * 0.5;
      this.speedX = constrain(this.speedX, -5, 5);
      this.speedY = constrain(this.speedY, -5, 5);

    }
    //glitch effect
      if (chaosLevel > 0.7 && random() < 0.05) {
        this.x += random(-10, 10);
        this.y += random(-5, 5);
      }
  }

  display() {
    push();
    translate(this.x, this.y);
    rotate(this.angle);
    textSize(this.size);
    fill(0, 150);
    text(this.content, 0, 0);
    pop();
  }
}

class ThoughtManager {
  constructor(maxThoughts, dupInterval, chaosSpeed) {
    this.thoughts = [];
    this.maxThoughts = maxThoughts;
    this.lastDupTime = 0;
    this.dupInterval = dupInterval;
    this.chaosSpeed = chaosSpeed;
  }

  getChaosLevel() {
    return constrain(this.thoughts.length / this.maxThoughts, 0, 1);
  }

  addThought(thought) {
    this.thoughts.push(thought);
  }

  update() {
    let chaos = this.getChaosLevel();

    // Update all thoughts
    for (let t of this.thoughts) {
      t.update(chaos);
    }

    // Duplication logic only if under max capacity
    if (
      this.thoughts.length < this.maxThoughts &&
      millis() - this.lastDupTime > this.dupInterval &&
      this.thoughts.length > 0
    ) {
      let current = this.thoughts.slice();
      for (let t of current) {
        // Randomize position slightly for new duplicates
        let newThought = new Thought(
          t.content,
          t.x + random(-10, 10),
          t.y + random(-10, 10)
        );

        newThought.speedX += random(-0.2, 0.2); // slight speed variation
        newThought.speedY += random(-0.2, 0.2);
        this.thoughts.push(newThought);
      }

      this.lastDupTime = millis();
      this.dupInterval *= 1 - this.chaosSpeed;
      if (this.dupInterval < 100) this.dupInterval = 100;
    }
  }

  display() {
    for (let t of this.thoughts) {
      t.display();
    }
  }
}

//api
//reflection page maybe
//preloaded prompts
//change font/color/size when text is duplicated
