let circles = [];

function setup() {
  createCanvas(displayWidth, displayHeight);
  background(random(1,255));

  for(let i = 0; i < 10; i++) {
    circles[i] = new Circle(random(width), random(height), random(-3, 3), random(-3, 3));
  }
}

function draw() {
  background(50);

  for(let i = 0; i < circles.length; i++) {
    circles[i].move();
    circles[i].display();
  }
}

class Circle {
  constructor(x, y, xSpeed, ySpeed) {
    this.x = x;
    this.y = y;
    this.xSpeed = xSpeed;
    this.ySpeed = ySpeed;
  }

  move() {
    this.x += this.xSpeed;
    if (this.x < 0 || this.x > width) {
      this.xSpeed *= -1;
    }

    this.y += this.ySpeed;
    if (this.y < 0 || this.y > height) {
      this.ySpeed *= -1;
    }
  }

  display() {
    circle(this.x, this.y, 50);
  }
}


// let sketch = function(p){
  
// let ArrayList [Element] elements = new ArrayList[Element]();

// let minElementSize = 10.0;
// let maxElementSize = 100.0;

// let maxSpeed = 4.0;


// p.setup = function() {
//   p.createCanvas(displayWidth, displayHeight);
//   p.pixelDensity(displayDensity());
//   p.background(200);
// }

// p.draw = function() {
//   if (mouseIsPressed) {
//     elements.add(new Element(mouseX, mouseY));
//   }
//   for (int i = 0; i < elements.size(); i++) {
//     Element me = elements.get(i);
//     me.drawElement(); 
//     for (int j = 0; j < elements.size(); j++)
//     {
//       if (i == j) {
//         continue;
//       }
//       //get reference to other element
//       Element other = elements.get(j);
//       //determine distance between elements
//       let distanceBetween = dist(me.posX, me.posY, other.posX, other.posY);
//       //determine whether elements are touching
//       let overlapDistance = me.size*0.5 + other.size*0.5;

//       if (distanceBetween < overlapDistance) {      
//         let strokeColor = 255-(255 * (distanceBetween/overlapDistance)) ;
//         p.stroke(strokeColor, 20);
//         p.line(me.posX, me.posY, other.posX, other.posY);
//       }
//     }
//     me.updateElement();
//   }
//   class Element
//   {
//     let posX, posY;
//     let dirX, dirY;
//     let size;
//     let R;
//     let B;
  
  
//     //class constructor
//     Element(let x, let y)
//     {
//       let posX = x;
//       let posY = y;
  
//       let dirX = random(-1, 1) * maxSpeed;
//       let dirY = random(-1, 1) * maxSpeed;
  
//       let size = random(minElementSize, maxElementSize);
//       let R = random(255);
//       let B = random(255);
//     }
//     p.updateElement = function()) {
//       p.posX = posX + dirX;
//       p.posY = posY + dirY;
//       p.checkEdges();
//     }
//     p.drawElement = function() {
//       p.noFill();
//       p.stroke(R, 0, B, 35);
//       p.ellipse(posX, posY, size, size);
//       p.noStroke();
//       p.fill(255, 35);
//       p.ellipse(posX, posY, 2, 2);
//     }
//     p.checkEdges = function() {
//       if  (posX < 0 || posX > width)
//       {
//         dirX *= -1;
//       }
//       if (posY < 0 || posY > height) {
//         dirY *= -1;
//       }
//     }
//   }