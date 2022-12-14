var socket = io("http://INSERT IP:3000"); //Add LAN IP here
var playerDict = {}
var ballArray = []
var myAlias;
var clientCounter;
let drawScene = 'game';
var currentMessage = '';

function setup() {
  // put setup code here
  myAlias = prompt('Choose your name');
  socket.emit("alias", myAlias);
  createCanvas(1000,600);
  socket.on("reset", resetGame);
  socket.on("ping", pingBack);
  socket.on("update", updateTank);
  socket.on("ball_positions", updateBalls);
  socket.on("player_killed", processKill);
  socket.on("tank_disconnect", disconnectTank);
}

function draw() {
  // put drawing code here
  if (drawScene == 'game') {
    drawGame();
  }
  if (drawScene == 'death') {
    drawDeathScreen();
  }
}

function drawGame() {
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
  
  // WHERE THE BALLS ARE DRAWN
  for (let i = 0; i < ballArray.length; i++) {
    //console.log(ballArray[i][0] + ' ' + ballArray[i][1]);
    circle(ballArray[i][0], ballArray[i][1], 20)
  }
  textAlign(CENTER);
  textSize(26);
  text(currentMessage, width/2, height/20)
  
}

function drawDeathScreen() {
  background(0);
  pop();
  textAlign(CENTER);
  textSize(70);
  fill(255, 255, 255);
  text(currentMessage, width/2, height/2);
  push();
}

function processKill(winnerAlias, loserAlias, loserID) {
  if (loserID == socket.id) {
    drawScene = 'death'
    currentMessage = "You were killed by: " + winnerAlias;
  } else {
    currentMessage = winnerAlias + " killed " + loserAlias
    delete playerDict[loserID];
  }
}

function pingBack(counter) {
  console.debug(counter)
  socket.emit("ping")
}

function updateBalls(incomingBallArray) {
  ballArray = incomingBallArray;
  //console.debug(ballArray)
}

function resetGame() {
  playerDict = {}
  console.info("Resetting Game")
  socket.emit("alias", myAlias);
}