var socket = io("http://localhost:3000");
var playerDict = {}
var ballArray = []
var myAlias;
var clientCounter = -1;

function setup() {
  // put setup code here
  myAlias = prompt('Choose your name');
  socket.emit("alias", myAlias);
  createCanvas(1000,600);
  socket.on("ping", simulatePhysics);
  socket.on("update", updateTank);
  socket.on("shot_ball", newBall);
}

function draw() {
  // put drawing code here
  background(220);
  for (let key in playerDict) {
    playerDict[key].drawTank();
  }
  //for (let ball in ballArray)

  let moveResquest = 0;
  let rotationRequest = 0;
  let shootBallFlag = false;
  
  if (keyIsDown(87)) { // W
		moveResquest = 1;
	} else if (keyIsDown(83)) { // S
		moveResquest = -1;
	}
	if (keyIsDown(65)) { // A
		rotationRequest = -1;
	} else if (keyIsDown(68)) { // D
		rotationRequest = 1;
	}
	if (keyIsDown(32)) { // SPACE
    shootBallFlag = true;
	} 
  socket.emit("request", moveResquest, rotationRequest, shootBallFlag);
}

function simulatePhysics(counter) {
  if (clientCounter == -1) {
    clientCounter = counter
  }
  let frameDifference = counter - clientCounter;
  for (let i = 0; i < frameDifference; i++) {
    let initialLength = ballArray.length
    for (let i = 0; i < initialLength; i++) {
      let index = initialLength - i - 1;
      let myBall = ballArray[index];
      myBall.moveBall()
      if (myBall.removalFlag) {
        ballArray.splice(index, 1);
      }
    }
  }
}

function updateTank(id, alias, xPos, yPos, rotation) {
  let playerKeys = Object.keys(playerDict);
  if (playerKeys.includes(id)) {
    playerDict[id].xPos = xPos;
    playerDict[id].yPos = yPos;
    playerDict[id].alias = alias;
    playerDict[id].rotation = rotation;
  } else {
    playerDict[id] = new tank(alias, xPos, yPos, rotation);
  }
}

class tank{
  constructor(alias, xPos, yPos, rotation) {
    this.alias = alias;
    this.xPos = xPos;
    this.yPos = yPos;
    this.rotation = rotation;
  }
  drawTank() {
    push();
    angleMode(DEGREES);
    translate(this.xPos, this.yPos);
    rotate(this.rotation);
    triangle(-20,20,-20,-20,40, 0);
    //circle(0,0,20);
    pop();
  }
}

function addBall(xPos, yPos, rotation) {
  new ball(xPos, yPos, rotation);
}

class ball{
  constructor(xPos, yPos, rotation, speed=1, radius=20) {
    this.position = createVector(xPos, yPos);
    this.velocity = p5.Vector.fromAngle(radians(rotation)).setMag(speed);
    this.radius = radius;
    this.removalFlag;
  }
  moveBall() {
    this.position.add(this.velocity);
    if (this.position.x > width || this.position.x < 0 || this.position.y > height || this.position.y < height) {
      this.removalFlag = true;
    }
    circle(this.position.x, this.position.y, this.radius);
  }

}