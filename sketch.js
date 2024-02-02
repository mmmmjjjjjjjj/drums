let gongSound;
let filter, reverb;
let elements = [];
const maxSpeed = 3;
const minElementSize = 10;
const maxElementSize = 50;

function preload() {
  // Load the gong sound effect
  gongSound = loadSound("assets/GONG.mp3");
}

function resetSketch() {
  background(random(50, 180), random(50, 180), 255);
  stroke(255);
  fill(0);
  elements = []; // Reset the array of elements
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  resetSketch();

  // Remove the existing button if it exists
  let existingButton = select('#resetButton');
  if (existingButton) {
    existingButton.remove();
  }

  // Setup the filter
  filter = new p5.LowPass();
  gongSound.disconnect(); // Disconnect from the master output
  gongSound.connect(filter);

  // Setup the reverb
  reverb = new p5.Reverb();
  gongSound.connect(reverb);
  reverb.amp(1); // Adjust reverb amplitude

  let col = color(255, 255, 255);
  let button = createButton("RESET SKETCH");
  button.style('background-color', col);
  button.style("font-family", "Helvetica");
  button.position(window.innerWidth - 235, 5);
  button.mousePressed(resetSketch);
  button.id('resetButton'); // Add an ID to the button

  // Create the Element objects
  for (let i = 0; i < 5; i++) {
    elements.push(new Element(random(width), random(height)));
  }
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

  // Remove the existing button if it exists
  let existingButton = select('#resetButton');
  if (existingButton) {
    existingButton.remove();
  }

  let col = color(255, 255, 255);
  let button = createButton("RESET SKETCH");
  button.style('background-color', col);
  button.style("font-family", "Helvetica");
  button.position(window.innerWidth - 235, 5);
  button.mousePressed(resetSketch);
  button.id('resetButton'); // Add an ID to the button
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
    let pitch = map(this.size, minElementSize, maxElementSize, 1.5, 0.5);
    pitch = constrain(pitch, 0.5, 1.5);
    
    gongSound.rate(pitch);
    gongSound.amp(0.5);
    gongSound.play();

    let filterFreq = map(this.posX, 0, width, 20, 2000);
    let filterRes = map(this.posY, 0, height, 0.1, 5);
    filter.freq(filterFreq);
    filter.res(filterRes);

    let reverbTime = map(this.posX, 0, width, 1, 10);
    let reverbDecay = map(this.posY, 0, height, 0.1, 1);
    reverb.process(gongSound, reverbTime, reverbDecay);
  }
}

function touchStarted() {
  if (!mouseOnLink()) {
    elements.push(new Element(mouseX, mouseY));
  }
  return false;
}

function mouseOnLink() {
  let links = document.getElementsByTagName("a");
  for (let i = 0; i < links.length; i++) {
    let linkPos = links[i].getBoundingClientRect();
    if (
      mouseX >= linkPos.left &&
      mouseX <= linkPos.right &&
      mouseY >= linkPos.top &&
      mouseY <= linkPos.bottom
    ) {
      return true;
    }
  }
  return false;
}
