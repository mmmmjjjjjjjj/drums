function setup() {
    createCanvas(canvasWidth, canvasHeight, WEBGL);
    background(55);
}
function draw() {
    CENTER;
    fill(map(mouseX, 0, 127))
    ellipse(width/2, height/2, 100, 100)
}
