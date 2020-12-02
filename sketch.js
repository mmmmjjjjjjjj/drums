let audio

function preload(){
    soundFormats('mp3');
    audio = loadSound("assets/20000.mp3");
    audio.playMode('sustain');
}
function setup() {
    createCanvas(displayWidth, displayHeight);
    background(random(1,255));
    
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
        ellipse(mouseX*mouseX, mouseY*mouseY, random(1,100), random(1, 100));
        audio.play()
      } else {
        stroke(255);
        fill(0);
        audio.stop()
      }
    
    }
    
