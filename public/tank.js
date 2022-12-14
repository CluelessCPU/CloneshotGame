
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
  
  function disconnectTank(incomingID, eliminatedFlag) {
    console.log(incomingID)
    if (! eliminatedFlag) {
        currentMessage = playerDict[incomingID].alias + " was disconnected";
    }
    delete playerDict[incomingID];
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
      rotate(90);
      text(this.alias, 0, 50);
      //circle(0,0,20);
      pop();
    }
  }
  