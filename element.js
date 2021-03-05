class Element
{
  let posX, posY;
  float dirX, dirY;
  float size;
  float R;
  float B;


  //class constructor
  Element(float x, float y)
  {
    posX = x;
    posY = y;

    dirX = random(-1, 1) * maxSpeed;
    dirY = random(-1, 1) * maxSpeed;

    size = random(minElementSize, maxElementSize);
    R = random(255);
    B = random(255);
  }
  void updateElement() {
    posX = posX + dirX;
    posY = posY + dirY;
    checkEdges();
  }
  void drawElement() {
    noFill();
    stroke(R, 0, B, 35);
    ellipse(posX, posY, size, size);
    noStroke();
    fill(255, 35);
    ellipse(posX, posY, 2, 2);
  }
  void checkEdges() {
    if  (posX < 0 || posX > width)
    {
      dirX *= -1;
    }
    if (posY < 0 || posY > height) {
      dirY *= -1;
    }
  }
}