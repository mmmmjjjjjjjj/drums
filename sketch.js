let audio

function preload(){
    soundFormats('mp3');
    audio = loadSound("assets/SITE.mp3");
    audio.playMode('sustain');
  }
function resetSketch() {
    background(random(50,180), random(50, 180), 255);
    stroke(255);
    fill(0);
    audio.stop();
  }
function setup() {
    createCanvas(displayWidth - 100, displayHeight - 100);
    resetSketch(); 
    background(random(0,150));
    let col = color(255, 255, 255);
    let button = createButton("RESET SKETCH");
    button.style('background-color', col);
    button.style("font-family","Futura");
    button.position(40, displayHeight - 160);
    button.mousePressed(resetSketch)
    
}

function draw() {
    let volume = map(mouseX, 0, width, 0, 1);
    
    volume = constrain(volume, 0, 1);
    audio.amp(volume);

  // Set the rate to a range between 0.1 and 4
  // Changing the rate alters the pitch
    let speed = map(mouseY, 0.1, height, 0, 2);
    speed = constrain(speed, 0.01, 4);
    audio.rate(speed);
    
    if (mouseIsPressed) {    
        stroke(random(1,255), random(1, 255), random(1, 255));
        fill(255, random(1, 255), random(1, 255));
        ellipse(mouseX, mouseY, random(1,100), random(1, 100));
        audio.play();
      } else {
        stroke(255);
        fill(0);
        audio.stop();
      }
    }

