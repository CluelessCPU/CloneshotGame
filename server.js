const express = require('express');
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const Victor = require('victor');
const clamp = require('lodash.clamp')

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
})

server.listen(3000);
app.use(express.static('public'));

console.log("my server is running");


// Program Constants
let playerDict = {};
let ballArray = [];
let xDimension = 1000;
let yDimension = 600;

io.sockets.on('connection', newConnection);

function newConnection(socket) {
    console.log('New connection: ' + socket.id);
    playerDict[socket.id] = new tank(socket.id, Math.floor(Math.random() * 200 + 200), Math.floor(Math.random() * 200 + 400), 0);
    socket.on("alias", setAlias);
    socket.on("request", parseRequest);
}

function setAlias(alias) {
    playerDict[this.id].alias = alias.slice(0,5);
    console.log(this.id + " Alias: " + playerDict[this.id].alias);
}

function parseRequest(movement, rotation, shootBallFlag) {
    var socket = this;
    var id = socket.id;

    if (! playerDict[id].locked) {
        playerDict[id].moveTank(movement);
        playerDict[id].rotateTank(rotation);
        if (shootBallFlag) {
            playerDict[id].shootBall()
        }
    }
}

class tank {
    constructor(tankID, xPos, yPos, rotation) {
        this.id = tankID;
        this.position = new Victor(xPos, yPos);
        this.rotation = rotation;
        this.locked = false;
        this.alias = "";
        this.removalFlag = false;
    }

    moveTank(direction) {
        let changeVector = new Victor(clamp(direction, -1, 1), 0); // THIS MAY BE THE ROTATION PROBLEM AIDAN
        changeVector.rotateDeg(this.rotation);
        this.postition.add(changeVector);
        
        this.position.x = clamp(this.position.x, 0, xDimension);
        this.position.y = clamp(this.position.y, 0, yDimension);

    }
    rotateTank(direction) {
        // 1: Turn Left, -1: Turn Right, 0: Turn not
        this.rotation += clamp(direction, -1, 1);
    }

    shootBall() {
        ballArray.push(new ball(this.position, this.alias, this.rotation));
    }
    killTank(winnerAlias) {

        io.emit("player_killed", this.alias, winnerAlias, loserID);
        this.removalFlag = true;
    }

}

class ball{
    constructor(position, alias, rotation) {
        this.position = position;
        this.alias = alias;
        this.rotation = rotation;
        this.velocity = new Vector(1, 0).rotateDeg(this.rotation); // SAME HERE!
        this.radius = 50;
        this.removalFlag = false;
    }
    moveBall() {
        this.position.add(this.velocity);
        if (this.position.x > xDimension || this.position.x < 0 || this.position.y > yDimension || this.position.y < 0) {
            this.removalFlag = true;
        }
        for (let key in playerDict) {
            let testPosition = playerDict[key].position;
            if (Math.abs(this.position.distanceSq(testPosition)) < this.radius ** 2 && playerDict[key].alias != this.alias) {
                playerDict[key].killTank(alias);
            }
            this.removalFlag = true;
        }

    }
}

let counter = 0;

setInterval(advanceFrame, 100);

function advanceFrame() {
    io.emit("ping", counter++);
    //console.log("pinging");

    for (let key in playerDict) {
        playerDict[key].locked = false;
        let position = playerDict[key].position

        io.emit("update", key, position.x, position.y, playerDict[key].rotation);

        if (playerDict[key].removalFlag == true) {
            delete playerDict[key];
        }
    }
    for (let i = 0; i < ballArray.length; i++) {
        let index = ballArray.length - i - 1
        ball = ballArray[index];
        ball.moveBall();
        if (ball.removalFlag == true) {
            ballArray.splice(index, 1);
        }

    }
}

