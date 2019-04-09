/* Bot position
    playerX is Y coordinate of home star
    playerY is X cooridnate of home star
*/

// base.length is number of current stars

// troops[0] is amount of soldiers you got

// mp is current mp, updates all the time

// socket.emit("troop", [insert 0 to 4]) is to buy troops


/* 
TODO: 
[X] Upgrade 
[X] Find stars
[X] Add MP
[X] Make it so that findStar() execute ONLY after upgrading is finished
[X] Give the bot a better pattern 
 
[] Get more than one star


[] Ignore stars that are surrounded by water  
[] Attack
[] Defend
[] Chat
[] Target a list of player

*/

// ----- Global variables
var currentPositionX = parseInt(playerY);
var currentPositionY = parseInt(playerX);

var XtilesClaimed = [currentPositionX];
var YtilesClaimed = [currentPositionY];

var Xcoordinates = [currentPositionX];
var Ycoordinates = [currentPositionY];

var switcher = 0;
var stopper = true;
var starsCount = 0;
var starOrder = 1; 

var patternC = [4,2,8,2,7,2,9,3,9,4,4,10,10,10,6,6,8,8,10,10,15,15,15,12,13,15,15,20,20,20,17,18,20,20,25,25,25,22,23,25,25,30,30,30,27,28,30,30];
var patternU = [0,1,2,3,1,4,2,3,1,4,3,02,01,00,4,3,4,3,04,03,02,01,00,04,03,04,03,02,01,00,04,03,04,03,02,01,00,04,03,04,03,02,01,00,04,03,04,03];

var newPosX = currentPositionX;
var newPosY = currentPositionY;

var starX;
var starY;
// ----- overwrites 

function attack(y,x){

    for (var i = 0; i < XtilesClaimed.length; i++) {
        if (x == XtilesClaimed[i] && y == YtilesClaimed[i]) {
            console.log(`(${x}, ${y}) duplicate`);
            return true; 
        }
    }

    if(mp < cellCost(y,x))return false;
    if(!attackcd.isReady())return false;

    var act = false;
    if(y-1 > -1) { if(map[y-1][x][0]==socketId) act=true}
    if(y+1 < mapSize) { if(map[y+1][x][0]==socketId) act=true}
    if(x-1 > -1) { if(map[y][x-1][0]==socketId) act=true}
    if(x+1 < mapSize) { if(map[y][x+1][0]==socketId) act=true}
    if(!act) return false;
        
    mp += -cellCost(y,x);		
    refresh();		
    socket.emit('attack', y, x);

    console.log(`(${x},${y})`);
    
    XtilesClaimed.push(x);
    YtilesClaimed.push(y);

    return true;
}

// ----- Action selection
function chooseAction() {
    if (switcher == 0) {
        if (stopper) {
            stopper = false;
            console.log("0");
            findStar(currentPositionX, currentPositionY);

            for(var i = 0; i < Xcoordinates.length; i++) {
                findStar(Xcoordinates[i], Ycoordinates[i]);
            }
            if (Xcoordinates.length >= 5) {
                clearInterval(checkIfSpawnedLoop);
                switcher=1; 
                updateInterval(500);
                stopper = true; 
            } else {
                console.log('not enough stars found');
                console.log(Xcoordinates.length);
                respawn();
                stopper = true;
            }
        }
    } else if (switcher == 1) {
        console.log('doing upgrades');
        upgrading();
    } else if (switcher == 2) {
        if (stopper) {
            stopper = false;
            console.log("2");
            //toStar(Xcoordinates[starOrder], Ycoordinates[starOrder]);
            toStar2();
            
        }
    } else if (switcher == 3) {
        console.log('trying to take star');
        if (stopper){
            stopper = false;
            if (mp >= 500000) {
                console.log("3");
                attack(starY, starX);

                switcher = 1; 
            }
            stopper = true;
        }
    }
}

mainInterval = setInterval(function () {
    chooseAction();
}, 5000);

function updateInterval(intervalSpeed){
    clearInterval(mainInterval);
    mainInterval = setInterval(function () {
        chooseAction();
    }, intervalSpeed);
}

// #region ----- MP SCRIPT
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clickMp() {
    var loopMp;
    var minMs = 80;
    var maxMs = 85;
    var oldMpAmount = 0;
    var sameMpTimes = 0;

    loopMp = setInterval(function () {
        if (oldMpAmount === mp) {
            sameMpTimes++;
        }
        if (sameMpTimes < 10) {
            addMP();
        }
        if (oldMpAmount !== mp) {
            sameMpTimes = 0;
        }
        oldMpAmount = mp;

        if (troops[4] > 9) {
            clearInterval(loopMp);
        }
    }, getRandomInt(minMs, maxMs));
}
clickMp();
// #endregion

// #region ----- upgrade script
function upgrading() {
    while(patternC[0] <= troops[patternU[0]]){
        patternC.shift();
        patternU.shift();
    }
    if (switcher == 1){
        if (5 + base.length * 5 == troops[3]){
            switcher = 2;
        }
        else if (mp >= startingCost[patternU[0]] * Math.pow(1.15, troops[patternU[0]])) {
            socket.emit("troop", patternU[0]);
        }
    }
    
}
//#endregion

// #region ----- Locate nearest stars
function findStar(ownX, ownY) {
    //top row
    for (var i = 0; i <= 4; i++) {  
        if (ownY - 4 >= 0 && ownX - 2 + i >= 0 && ownX - 2 + i <= 49) {
            if (map[ownY - 4][ownX - 2 + i][1] == "b") {
                var check = true;
                for(var x = 0; x < Xcoordinates.length; x++){
                    if(Xcoordinates[x] == ownX - 2 + i && Ycoordinates[x] == ownY - 4) {
                        check = false;
                    }
                }
                if(check){
                    Xcoordinates.push(ownX - 2 + i);
                    Ycoordinates.push(ownY - 4);
                }
            }
        }
    }
    //second from top row
    for (var i = 0; i <= 6; i++) {
        if (ownY - 3 >= 0 && ownX - 3 + i >= 0 && ownX - 3 + i <= 49) {
            if (map[ownY - 3][ownX - 3 + i][1] == "b") {
                var check = true; 
                for (var x = 0;  x < Xcoordinates.length; x++) {
                    if (Xcoordinates[x] == ownX - 3 + i && Ycoordinates[x] == ownY - 3) {
                        check = false; 
                    }
                }
                if (check) {
                    Xcoordinates.push(ownX - 3 + i);
                    Ycoordinates.push(ownY - 3);
                }

            }
        }    
    }
    //third to seventh row
    for (var i = 0; i <= 8; i++) {
        for (var j = 0; j <= 4; j++) {
            if (ownY - 2 + j >= 0 && ownY - 2 + j <= 49 && ownX - 4 + i >= 0 && ownX - 4 + i <= 49) {
                if (map[ownY - 2 + j][ownX - 4 + i][1] == "b") {
                    if(!(ownX - 4 + i == ownX && ownY - 2 + j == ownY)) {
                        var check = true; 
                        for (var x = 0;  x < Xcoordinates.length; x++) {
                            if (Xcoordinates[x] == ownX - 4 + i && Ycoordinates[x] == ownY - 2 + j) {
                                check = false; 
                            }
                        }
                        if (check) {
                            Xcoordinates.push(ownX - 4 + i);
                            Ycoordinates.push(ownY - 2 + j);
                        }
                    }
                }
            }
        }
    }
    //second row from bottom
    for (var i = 0; i <= 6; i++) {
        if (ownY + 3 <= 49 && ownX - 3 + i >= 0 && ownX - 3 + i <= 49) {
            if (map[ownY + 3][ownX - 3 + i][1] == "b") {
                var check = true; 
                for (var x = 0;  x < Xcoordinates.length; x++) {
                    if (Xcoordinates[x] == ownX-3+i && Ycoordinates[x] == ownY+3) {
                        check = false; 
                    }
                }
                if (check) {
                    Xcoordinates.push(ownX - 3 + i);
                    Ycoordinates.push(ownY + 3);
                }
            }
        }
    }
    //bottom row
    for (var i = 0; i <= 4; i++) {
        if (ownY + 4 <= 49 && ownX - 2 + i >= 0 && ownX - 2 + i <= 49) {
            if (map[ownY + 4][ownX - 2 + i][1] == "b") {
                var check = true; 
                for (var x = 0;  x < Xcoordinates.length; x++) {
                    if (Xcoordinates[x] == ownX-2+i && Ycoordinates == ownY + 4) {
                        check = false
                    }
                }
                if (check) {
                    Xcoordinates.push(ownX - 2 + i);
                    Ycoordinates.push(ownY + 4);
                }

            }
        }
    
    }
}
//#endregion

// #region ----- Claim tiles to stars

function toStar(starPosX, starPosY) {
    
    console.log("moving to star");
    
    var claim_cooldown = 5750;
    var attackLoop;
    var attackExecuted = false;

    attackLoop = setInterval(function () {
        console.log("to star interval started")
        var oneTileAway = Math.abs((newPosX - starPosX) + (newPosY - starPosY)) == 1;
        if (newPosX > starPosX && !oneTileAway) {   
            // Move left until they both have the same X coordinate
            attackExecuted = attack(newPosY, newPosX - 1);
            if(attackExecuted) {
                console.log(`left ${newPosX - 1}, ${newPosY}`);
                newPosX--
            };
        } else if (newPosX < starPosX && !oneTileAway) {
            //move right
            attackExecuted = attack(newPosY, newPosX + 1);
            if(attackExecuted) {
                console.log(`right ${newPosX + 1}, ${newPosY}`);
                newPosX++;
            }
        } else {
            //check Y
            if (newPosY > starPosY && !oneTileAway) {
                // move up
                attackExecuted = attack(newPosY - 1, newPosX);
                if(attackExecuted) {
                    console.log(`up ${newPosX}, ${newPosY - 1}`);
                    newPosY--;
                }
            } else if (newPosY < starPosY && !oneTileAway) {
                // move down
                attackExecuted = attack(newPosY + 1, newPosX);
                if(attackExecuted) {
                    console.log(`down ${newPosX}, ${newPosY + 1}`);
                    newPosY++;
                }
            } else {
                //clearinterval
                console.log("arrived at star");
                clearInterval(attackLoop);  
                switcher = 3;
                stopper = true;
            }
        }
    }, claim_cooldown);
}
//#endregion

// #region ------ Respawn
var checkIfSpawnedLoop; 
var waitBeforeMapLoad = 3000; 
function respawn() {
    socket.disconnect();
    if (socket.disconnected) {
        socket.connect();
        joinGame();
        checkIfSpawnedLoop = setInterval(function() {
            if (checkIfSpawned(currentPositionY,currentPositionX)) {
                currentPositionX = parseInt(playerY);
                currentPositionY = parseInt(playerX);
                newPosX = currentPositionX;
                newPosY = currentPositionY;
                XtilesClaimed = [currentPositionX];
                YtilesClaimed = [currentPositionY];

                Xcoordinates = [currentPositionX];
                Ycoordinates = [currentPositionY];
            }
        }, waitBeforeMapLoad);
    }
}

function checkIfSpawned(x, y) {
    if (x !== playerX && y !== playerY) {
        clearInterval(checkIfSpawnedLoop);
        currentPositionX = parseInt(playerY);
        currentPositionY = parseInt(playerX);
        newPosX = currentPositionX;
        newPosY = currentPositionY;
        return true;
    }
    return false;
}
// #endregion

function toStar2(){
    var path = pathToStar();

    console.log("moving to star");
    
    var claim_cooldown = 5750;
    var attackLoop;
    var attackExecuted = false;
    var i = path.length - 2;

    attackLoop = setInterval(function () {
        var oneTileAway = (i == 0);
        if(!oneTileAway){
            attackExecuted = attack(path[i][1],path[i][0]);
            if(attackExecuted) {
                console.log("tile taken");
                i--;
            };
        } else {
            console.log("arrived at star");
            clearInterval(attackLoop);  
            starX = path[0][0];
            starY = path[0][1];
            switcher = 3;
            stopper = true;
        }
        
    },claim_cooldown);

}
    
function pathToStar(){
    var path;

    var smallestDistance = 9999;
    var bestX;
    var bestY;

    iloop:
    for (var i = 0; i < Xcoordinates.length; i++) {
        for (var j = 0; j < XtilesClaimed.length; j++) {
            if(Xcoordinates[i] == XtilesClaimed[j] && Ycoordinates[i] == YtilesClaimed[j]){
                continue iloop;
            }
        }
        for (var j = 0; j < XtilesClaimed.length; j++) {

            var distanceX = Math.pow((Xcoordinates[i] - XtilesClaimed[j]), 2);
            var distanceY = Math.pow((Ycoordinates[i] - YtilesClaimed[j]), 2);
            var finalDistance = Math.sqrt(distanceX + distanceY);

            if(finalDistance < smallestDistance){
                smallestDistance = finalDistance;
                bestX = XtilesClaimed[j];
                bestY = YtilesClaimed[j];
            }
        }
    }

    path = bfs(bestX,bestY);
    
    kloop:
    for(var k = 0; k < path.length; k++){
        for(var l = 0; l < XtilesClaimed.length; l++){
            if(path[k][0] == XtilesClaimed[l] && path[k][1] == YtilesClaimed[l]){
                path.length = k + 1;
                break kloop;
            }
        }
    }

    return path;
    

}

var XtileSet;
var YtileSet;

function bfs(x,y){
    XtileSet = [[x,null]];
    YtileSet = [[y,null]];
    
    for(var i = 0; i < XtileSet.length; i++){
        //up
        if(YtileSet[i][0]-1 >= 0 && cellCost(YtileSet[i][0]-1,XtileSet[i][0]) < 750000 && !isDuplicate(XtileSet[i][0],YtileSet[i][0]-1,XtileSet,YtileSet) && !(map[YtileSet[i][0]-1][XtileSet[i][0]][2] == "w")){
            XtileSet.push([XtileSet[i][0],XtileSet[i][0]]);
            YtileSet.push([YtileSet[i][0]-1,YtileSet[i][0]]);
            if(map[YtileSet[i][0]-1][XtileSet[i][0]][1] == "b"){
                var notAlreadyClaimed = true;
                for(var z = 0; z < XtilesClaimed.length; z++){
                    if(XtileSet[i][0] == XtilesClaimed[z] && YtileSet[i][0]-1 == YtilesClaimed[z]){
                        notAlreadyClaimed = false;
                    }
                }
                if(notAlreadyClaimed) break;
            }
        }

        //left
        if(XtileSet[i][0]-1 >= 0 && cellCost(YtileSet[i][0],XtileSet[i][0]-1) < 750000 && !isDuplicate(XtileSet[i][0]-1,YtileSet[i][0],XtileSet,YtileSet) && !(map[YtileSet[i][0]][XtileSet[i][0]-1][2] == "w")){
            XtileSet.push([XtileSet[i][0]-1,XtileSet[i][0]]);
            YtileSet.push([YtileSet[i][0],YtileSet[i][0]]);
            if(map[YtileSet[i][0]][XtileSet[i][0]-1][1] == "b"){
                var notAlreadyClaimed = true;
                for(var z = 0; z < XtilesClaimed.length; z++){
                    if(XtileSet[i][0]-1 == XtilesClaimed[z] && YtileSet[i][0] == YtilesClaimed[z]){
                        notAlreadyClaimed = false;
                    }
                }
                if(notAlreadyClaimed) break;
            }
        }

        //down
        if(YtileSet[i][0]+1 <= 49 && cellCost(YtileSet[i][0]+1,XtileSet[i][0]) < 750000 && !isDuplicate(XtileSet[i][0],YtileSet[i][0]+1,XtileSet,YtileSet) && !(map[YtileSet[i][0]+1][XtileSet[i][0]][2] == "w")){
            XtileSet.push([XtileSet[i][0],XtileSet[i][0]]);
            YtileSet.push([YtileSet[i][0]+1,YtileSet[i][0]]);
            if(map[YtileSet[i][0]+1][XtileSet[i][0]][1] == "b"){
                var notAlreadyClaimed = true;
                for(var z = 0; z < XtilesClaimed.length; z++){
                    if(XtileSet[i][0] == XtilesClaimed[z] && YtileSet[i][0]+1 == YtilesClaimed[z]){
                        notAlreadyClaimed = false;
                    }
                }
                if(notAlreadyClaimed) break;
            }
        }

        //right
        if(XtileSet[i][0]+1 <= 49 && cellCost(YtileSet[i][0],XtileSet[i][0]+1) < 750000 && !isDuplicate(XtileSet[i][0]+1,YtileSet[i][0],XtileSet,YtileSet) && !(map[YtileSet[i][0]][XtileSet[i][0]+1][2] == "w")){
            XtileSet.push([XtileSet[i][0]+1,XtileSet[i][0]]);
            YtileSet.push([YtileSet[i][0],YtileSet[i][0]]);
            if(map[YtileSet[i][0]][XtileSet[i][0]+1][1] == "b"){
                var notAlreadyClaimed = true;
                for(var z = 0; z < XtilesClaimed.length; z++){
                    if(XtileSet[i][0]+1 == XtilesClaimed[z] && YtileSet[i][0] == YtilesClaimed[z]){
                        notAlreadyClaimed = false;
                    }
                }
                if(notAlreadyClaimed) break;
            }
        }
        
    }

    var path = [];
    var currentindex = XtileSet.length - 1;
    path.push([XtileSet[currentindex][0],YtileSet[currentindex][0]]);
    var previousX = XtileSet[currentindex][1]
    var previousY = YtileSet[currentindex][1]
    while(currentindex != 0){
        for(var i = 0; i < XtileSet.length; i++){
            if(XtileSet[i][0] == previousX && YtileSet[i][0] == previousY){
                currentindex = i;
                path.push([XtileSet[currentindex][0],YtileSet[currentindex][0]]);
                var previousX = XtileSet[currentindex][1];
                var previousY = YtileSet[currentindex][1];
            }
        }
    }
    
    console.log(path);

    return path;
}

function isDuplicate(x,y,XtileSet,YtileSet){
    for(var i = 0; i < XtileSet.length; i++){
        if(x == XtileSet[i][0] && y == YtileSet[i][0]){
            return true;
        }
    }
    return false;
}

