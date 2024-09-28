let gongSound;
let elements = []; // Array to store Element objects
const maxSpeed = 3;
const minElementSize = 10;
const maxElementSize = 50;
let buttonPressed = false; // Flag to track button press

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
  let button = createButton("RESET SKETCH");
  button.style('background-color', col);
  button.style("font-family", "Helvetica");
  button.position(window.innerWidth - 235, 5);

  // Prevent new element creation when the button is clicked
  button.mousePressed(function (event) {
    event.stopPropagation(); // Prevent mousePressed from firing
    buttonPressed = true; // Set flag to true
    resetSketch(); // Reset the sketch without creating a new element
  });
}

function draw() {
  // Update and draw elements
  for (let i = elements.length - 1; i >= 0; i--) {
    elements[i].updateElement();
    elements[i].drawElement();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  resetSketch();
  background(random(50, 180), random(50, 180), 255);

  let col = color(255, 255, 255);
  let button = createButton("RESET SKETCH");
  button.style('background-color', col);
  button.style("font-family", "Helvetica");
  button.position(window.innerWidth - 235, 5);
  button.mousePressed(function (event) {
    event.stopPropagation(); // Prevent mousePressed from firing
    buttonPressed = true; // Set flag to true
    resetSketch(); // Reset the sketch without creating a new element
  });
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
    // Adjust pitch based on the size of the drawn element
    let pitch = map(this.size, minElementSize, maxElementSize, 1.5, 0.5);
    pitch = constrain(pitch, 0.5, 1.5);
    
    // Set the pitch and trigger the gong sound effect
    gongSound.rate(pitch);
    gongSound.amp(0.5);
    gongSound.play();
  }
}

function mousePressed() {
  // Prevent element creation if the reset button was pressed
  if (!buttonPressed) {
    // Create a new element at the mouse position when mouse is pressed
    elements.push(new Element(mouseX, mouseY));
  }
}
