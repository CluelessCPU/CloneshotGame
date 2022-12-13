var socket = io("http://localhost:3000");
var playerDict = {}
var ballArray = []
var alias;

function setup() {
  // put setup code here
  alias = prompt('Choose your name');
  socket.emit("alias", alias);
  createCanvas(1000,600);
  socket.on("ping", simulatePhysics);
  socket.on("update", updateTank);
}

function draw() {
  // put drawing code here
  background(220);
  circle(mouseX, mouseY, 50);
}
function simulatePhysics(counter) {
  console.log(counter);
}
function updateTank(id, xPos, yPos, rotation) {
  
}
