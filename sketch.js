let gongSound;
let elements = []; // Array to store Element objects
const maxSpeed = 3;
const minElementSize = 10;
const maxElementSize = 50;
let buttonPressed = false; // Flag to track button press
let isMuted = false; // Flag for muting sound

function preload() {
  // Load the gong sound effect
  gongSound = loadSound("assets/GONG.mp3");
}

function resetSketch() {
  background(random(50, 180), random(50, 180), 255);
  stroke(255);
  fill(0);
  elements = []; // Reset the array of elements
  buttonPressed = false; // Reset the flag after resetting
}

function setup() {
  createCanvas(window.innerWidth, window.innerHeight);
  resetSketch();

  let col = color(255, 255, 255);
  
  // Create Reset Button
  let resetButton = createButton("RESET SKETCH");
  resetButton.style('background-color', col);
  resetButton.style("font-family", "Helvetica");
  resetButton.position(window.innerWidth - 235, 5);
  resetButton.mousePressed(function (event) {
    event.stopPropagation();
    buttonPressed = true;
    resetSketch();
  });

  // Create Mute Button
  let muteButton = createButton("MUTE SOUND");
  muteButton.style('background-color', col);
  muteButton.style("font-family", "Helvetica");
  muteButton.position(window.innerWidth - 350, 5);
  muteButton.mousePressed(function () {
    isMuted = !isMuted;
    muteButton.html(isMuted ? "UNMUTE SOUND" : "MUTE SOUND");
  });
}

function draw() {
  for (let i = elements.length - 1; i >= 0; i--) {
    elements[i].updateElement();
    elements[i].drawElement();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetSketch();
}

// Element class
class Element {
  constructor(x, y) {
    this.posX = x;
    this.posY = y;
    this.dirX = random(-1, 1) * maxSpeed;
    this.dirY = random(-1, 1) * maxSpeed;
    this.size = random(minElementSize, maxElementSize);
    this.R = random(255);
    this.B = random(255);
  }

  updateElement() {
    this.posX += this.dirX;
    this.posY += this.dirY;
    this.checkEdges();
  }

  drawElement() {
    noFill();
    stroke(this.R, 0, this.B, 35);
    ellipse(this.posX, this.posY, this.size, this.size);
    noStroke();
    fill(255, 35);
    ellipse(this.posX, this.posY, 2, 2);
  }

  checkEdges() {
    if (this.posX < 0 || this.posX > width) {
      this.dirX *= -1;
      this.playGongSound();
    }
    if (this.posY < 0 || this.posY > height) {
      this.dirY *= -1;
      this.playGongSound();
    }
  }

  playGongSound() {
    if (isMuted) return; // Do not play sound if muted

    let pitch = map(this.size, minElementSize, maxElementSize, 2.5, 0.5);
    pitch = constrain(pitch, 0.5, 2.5);
    
    gongSound.rate(pitch);
    gongSound.amp(0.5);
    gongSound.play();
  }
}

// Handle mouse interaction for creating new elements
function mousePressed() {
  if (mouseX >= 0 && mouseX <= width && mouseY >= 0 && mouseY <= height && !buttonPressed) {
    elements.push(new Element(mouseX, mouseY));
  }
}

// Handle touch interaction for creating new elements
function touchStarted() {
  if (touchX >= 0 && touchX <= width && touchY >= 0 && touchY <= height && !buttonPressed) {
    elements.push(new Element(touchX, touchY));
  }
}
