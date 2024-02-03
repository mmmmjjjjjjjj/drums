let elements = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function draw() {
  background(220);

  // Update and draw elements
  for (let i = 0; i < elements.length; i++) {
    elements[i].updateElement();
    elements[i].drawElement();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Element class
class Element {
  constructor(x, y) {
    this.posX = x;
    this.posY = y;
    this.dirX = random(-1, 1) * 3;
    this.dirY = random(-1, 1) * 3;
    this.size = random(10, 50);
  }

  updateElement() {
    this.posX += this.dirX;
    this.posY += this.dirY;
    this.checkEdges();
  }

  drawElement() {
    noFill();
    stroke(0);
    ellipse(this.posX, this.posY, this.size, this.size);
  }

  checkEdges() {
    if (this.posX < 0 || this.posX > width) {
      this.dirX *= -1;
    }
    if (this.posY < 0 || this.posY > height) {
      this.dirY *= -1;
    }
  }
}

function touchStarted() {
  elements.push(new Element(mouseX, mouseY));
  return false;
}
