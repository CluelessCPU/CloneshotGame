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
        origin: [
            "http://localhost:3000",
    ],
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
    
    socket.emit("reset");

    playerDict[socket.id] = new tank(socket.id, Math.floor(Math.random() * 200 + 200), Math.floor(Math.random() * 200 + 400), 0);
    socket.timeout = 50;
    socket.eliminated = false;

    socket.on("alias", setAlias);
    socket.on("request", parseRequest);
    socket.on("ping", resetTimeout);
    socket.on("disconnecting", disconnectTank)
}

function setAlias(newAlias) {
    console.log(newAlias)
    playerDict[this.id].alias = newAlias.substring(0,9);
    console.log(this.id + " Alias: " + playerDict[this.id].alias);
}

function parseRequest(movement, rotation, shootBallFlag) {
    var socket = this;
    var id = socket.id;
    if (! Object.keys(playerDict).includes(id)) {
        return
    }
    if (! playerDict[id].locked) {
        playerDict[id].moveTank(movement);
        //console.log(movement)
        playerDict[id].rotateTank(rotation);
        if (shootBallFlag) {
            playerDict[id].shootBall()
        }
        playerDict[id].locked = true;
    }
}

function resetTimeout() {
    this.timeout = 50;
}

function disconnectTank() {
    var socket = this;
    var id = socket.id;
    io.emit("tank_disconnect", id, socket.eliminated);
    delete playerDict[id];
    console.log(id)
}

class tank {
    constructor(tankID, xPos, yPos, rotation) {
        this.id = tankID;
        this.position = new Victor(xPos, yPos);
        this.rotation = rotation;
        this.locked = false;
        this.alias = "";

        this.removalFlag = false;
        this.cooldown = 0;
    }

    moveTank(direction) {
        let changeLength = clamp(direction, -1, 1) * 2;
        //console.log(changeLength);

        let changeVector = new Victor(changeLength, 0); // THIS MAY BE THE ROTATION PROBLEM AIDAN
        //console.log("CV Raw: " + changeVector);
        changeVector.rotateDeg(this.rotation);
        //console.log("CV Rotated" + changeVector);
        let changeX = changeVector
        
        //console.log(this.position.toString());
        this.position = new Victor(this.position.x + changeVector.x, this.position.y + changeVector.y);
        //console.log(this.position.toString());
        
        this.position.x = clamp(this.position.x, 0, xDimension);
        this.position.y = clamp(this.position.y, 0, yDimension);

    }
    rotateTank(direction) {
        // 1: Turn Left, -1: Turn Right, 0: Turn not
        this.rotation += clamp(direction, -1, 1) * 3;
    }

    shootBall() {
        console.log(this.cooldown);
        if (this.cooldown <= 0) {
            ballArray.push(new ballObject(this.id, this.alias, this.position.x, this.position.y, this.rotation));
            console.log(this.alias + " Shot a ball")
            //console.log(ballArray);
            this.cooldown = 40;
        }
    }
    killTank(winnerAlias) {

        io.emit("player_killed", winnerAlias, this.alias, this.id);
        io.sockets.sockets.get(this.id).eliminated = true;
        io.sockets.sockets.get(this.id).disconnect()
    }

}

class ballObject{
    constructor(id, alias, xPos, yPos, rotation) {
        this.position = new Victor(xPos, yPos);
        this.alias = alias;
        this.id = id
        this.rotation = rotation;
        this.velocity = new Victor(3, 0).rotateDeg(this.rotation); // SAME HERE!
        this.radius = 10;
        this.removalFlag = false;

        this.x = xPos
        this.y = yPos
    }
    moveBall() {
        this.position = new Victor(this.position.x + this.velocity.x, this.position.y + this.velocity.y);
        if (this.position.x > xDimension || this.position.x < 0 || this.position.y > yDimension || this.position.y < 0) {
            this.removalFlag = true;
        }
        this.x = this.position.x;
        this.y = this.position.y;
        for (let key in playerDict) {
            let testPosition = playerDict[key].position;
            if (Math.abs(this.position.distanceSq(testPosition)) < this.radius ** 2 && playerDict[key].id != this.id) {
                console.log(this.id + " Killed " + playerDict[key].id)
                playerDict[key].killTank(this.alias);
                this.removalFlag = true;
            }
        }

    }
    
}

let counter = 0;

let currentBallID = 0;

setInterval(advanceFrame, 50);

function advanceFrame() {
    io.emit("ping", counter++);
    //console.log("pinging");

    for (let key in playerDict) {
        playerDict[key].locked = false;
        let position = playerDict[key].position

        io.emit("update", key, playerDict[key].alias, position.x, position.y, playerDict[key].rotation);
        
        
        
        playerDict[key].cooldown -= 1;
        
        if (playerDict[key].removalFlag == true) {
            delete playerDict[key];
        }
        //console.log(playerDict[key].timeout)
        // This MUST be last as it may delete the object
        try {
            let mySocket = io.sockets.sockets.get(key)
            mySocket.timeout -= 1;
            if (mySocket.timeout <= 0) {
                delete playerDict[key]
                mySocket.disconnect()
            }
        } catch (error) {
            delete playerDict[key]
            io.emit("disconnect_tank", key)
        }
    }
    let initialLength = ballArray.length
    for (let i = 0; i < initialLength; i++) {
        let index = initialLength - i - 1
        ball = ballArray[index];
        ball.moveBall();
        if (ball.removalFlag == true) {
            ballArray.splice(index, 1);
        }
    }
    let ballOutputArray = [];
    for (let i = 0; i < ballArray.length; i++) {
        let myBall = ballArray[i]
        //console.log(myBall.x, ' ' + myBall.y)

        ballPacket = [myBall.x, myBall.y];

        ballOutputArray.push(ballPacket);
    }
    //console.log(ballOutputArray)
    //console.log(ballArray)
    io.emit("ball_positions", ballOutputArray);
}

