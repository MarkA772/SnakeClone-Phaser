const playerSize = 25;
const playerSpeed = 0.25;
const growthRate = 0.025;
const turnDelay = 110;

var config = {
    width: 900,
    height: 500,
    parent: "gamediv",
    state: {
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);
var gameState;
var stateLoaded;
var player;
var food;
var tail = [];
var lastTurn;
var queuedTurn;
var score;

function create() {
    stateLoaded = false;

    gameState = "start";

    game.input.keyboard.addCallbacks(game, keyPress);
}

function update() {
    if (gameState == "start") {
        updateStartScreen();
    } else if (gameState == "options") {
        updateOptionsScreen();
    } else if (gameState == "game") {
        updateGame();
    } else if (gameState == "dead") {
        updateDeathScreen();
    }
}

function updateStartScreen() {
    if (!stateLoaded) {
        drawCenterText('Press any key to begin\n\nUse arrow keys to move');
        stateLoaded = true;
    }
}

function drawCenterText(text) {
    var startText = game.add.text(0, 0, text);
    startText.fill = "#FFFFFF";
    startText.setTextBounds(0, 0, game.width, game.height);
    startText.boundsAlignH = "center";
    startText.boundsAlignV = "middle";
}

function drawScore() {
    score.text = score.score.toString();
    score.bringToTop();
}

function updateOptionsScreen() {
    // options here
}

function updateGame() {
    if (!stateLoaded) {
        setupGame();
        stateLoaded = true;
    }
    handleTail();
    movePlayer();
    drawPlayer();
    checkCollision();
    drawScore();
    if (queuedTurn && game.time.now - lastTurn > turnDelay) {
        keyPress(queuedTurn);
    }
}

function setupGame() {    
        player = null;
        food = null;
        tail.length = 0;
        queuedTurn = null;
        game.world.removeAll();
        game.physics.startSystem(Phaser.Physics.ARCADE);
        createPlayer();
        spawnFood();
        score = game.add.text(0,20, "0");
        score.fill = "#FFFFFF";
        score.setTextBounds(0, 0, game.width, game.height);
        score.boundsAlignH = "center";
        score.score = 0;
        lastTurn = game.time.now;
}

function updateDeathScreen() {
    if (!stateLoaded) {
        drawCenterText('   GAME OVER\n\n\n\n\n\n\nPress r to restart');
        stateLoaded = true;
    }
}

function changeState(state) {
    gameState = state;
    stateLoaded = false;
}

function createPlayer() {
    player = game.add.graphics(game.width / 2, game.height / 2);
    player.direction = "center";
    player.size = 0;
    player.currentSize = 0;
    game.physics.enable(player);
    player.body.setCircle(playerSize / 2, -playerSize / 2, -playerSize / 2);
}

function drawPlayer() {
    player.clear();
    player.beginFill(0xff3300);
    player.drawCircle(0, 0, playerSize);
    player.endFill();
    drawEyes();
}

function movePlayer() {
    var timeElapsed = game.time.elapsedMS;
    if (timeElapsed > 25) {
        timeElapsed = 25;
    }
    var speed = playerSpeed * timeElapsed;
    if (player.direction == "left") {
        player.x -= speed;
    } else if (player.direction == "right") {
        player.x += speed;
    } else if (player.direction == "up") {
        player.y -= speed;
    } else if (player.direction == "down") {
        player.y += speed;
    }
}

function drawEyes() {
    var eyeDistance = 5;
    if (player.direction == "left") {
        let x = -eyeDistance;
        let y = eyeDistance;
        drawEye(x, y);
        y = -eyeDistance;
        drawEye(x, y);
    } else if (player.direction == "right") {
        let x = eyeDistance;
        let y = eyeDistance;
        drawEye(x, y);
        y = -eyeDistance;
        drawEye(x, y);
    } else if (player.direction == "down") {
        let x = eyeDistance;
        let y = eyeDistance;
        drawEye(x, y);
        x = -eyeDistance;
        drawEye(x, y);
    } else { // Player is either still or looking up
        let x = eyeDistance;
        let y = -eyeDistance;
        drawEye(x, y);
        x = -eyeDistance;
        drawEye(x, y);
    }
}

function drawEye(x, y) {
    player.beginFill(0x000000);
    player.drawCircle(x, y, 6);
    player.endFill();
}

function handleTail() {
    if (player.size === 0) {
        return;
    }
    // draw circles with rectangle connecting
    // rectangle grows until change direction, then new rectangle grows
    // once player stops growing, tail starts disappearing, in this case
    //  moving the last circle toward the next circle, making the rectangle
    //  smaller
    if (player.changeDir) {
        player.changeDir = false;
        var endCircle = game.add.graphics(player.x, player.y);
        endCircle.shapeType = "circle";
        endCircle.beginFill(0xff3300);
        endCircle.drawCircle(0, 0, playerSize);
        endCircle.endFill();
        tail.push(endCircle);
        game.physics.enable(endCircle);
        endCircle.body.setCircle(playerSize / 2, -playerSize / 2, -playerSize / 2);

        var growth = game.add.graphics(player.x, player.y);
        growth.shapeType = "square";
        tail.push(growth);
        game.physics.enable(growth);
        return;
    }
    if (player.size < player.currentSize) {
        moveTailEnd();
    } else {
        player.currentSize += growthRate;
    }
    createTail();
}

function moveTailEnd() {
    if (tail.length == 2) {
        moveCircleTo(tail[0], player);
    } else {
        moveCircleTo(tail[0], tail[2]);
        if (Math.abs(tail[0].x - tail[2].x) < 1 && Math.abs(tail[0].y - tail[2].y) < 1) {
            tail[0].destroy();
            tail[1].destroy();
            tail.splice(0, 2);
        }
    }
}

function moveCircleTo(circ1, circ2) {
    var timeElapsed = game.time.elapsedMS;
    if (timeElapsed > 25) {
        timeElapsed = 25;
    }
    if (circ1.x == circ2.x) {
        if (circ1.y > circ2.y) {
            circ1.y -= playerSpeed * timeElapsed;
        } else {
            circ1.y += playerSpeed * timeElapsed;
        }

    } else if (circ1.y == circ2.y) {
        if (circ1.x > circ2.x) {
            circ1.x -= playerSpeed * timeElapsed;
        } else {
            circ1.x += playerSpeed * timeElapsed;
        }
    }
}

function createTail() {
    for (i = 0; i < tail.length; i += 1) {
        if (i % 2 === 0) {
        } else if (i == tail.length - 1) {
            adjustRect(tail[i - 1], player, tail[i]);
        } else {
            adjustRect(tail[i + 1], tail[i - 1], tail[i]);
        }
    }
}

function adjustRect(circ1, circ2, rect) {
    rect.clear();
    if (circ1.x == circ2.x) {
        if (circ2.y < circ1.y) {
            let x = circ2;
            circ2 = circ1;
            circ1 = x;
        }
        rect.x = circ1.x - playerSize;
        rect.y = circ1.y;
        rect.beginFill(0xff3300);
        rect.drawRect(playerSize / 2, 0, playerSize, circ2.y - circ1.y);
        rect.endFill();
    } else {
        if (circ2.x < circ1.x) {
            let x = circ2;
            circ2 = circ1;
            circ1 = x;
        }
        rect.x = circ1.x;
        rect.y = circ1.y - playerSize;
        rect.beginFill(0xff3300);
        rect.drawRect(0, playerSize / 2, circ2.x - circ1.x, playerSize);
        rect.endFill();
    }
}

function checkCollision() {
    var overlap = checkOverlap(new Phaser.Circle(player.x, player.y, playerSize), food);
    if (overlap) {
        eatFood();
    }
    if (player.body.checkWorldBounds()) {
        killPlayer();
    }
    if (tail.length !== 0) {
        for (var i = 0; i < tail.length; i++) { // Don't clip the first 6 tail pieces
            if (i >= tail.length - 6) {
                continue;
            }
            if (tail[i].shapeType == "square") {
                if (checkOverlap(new Phaser.Circle(player.x, player.y, playerSize), tail[i], -playerSize / 2)) {
                    killPlayer();
                }
            } else {
                if (checkCircleOverlap(new Phaser.Circle(player.x, player.y, playerSize), new Phaser.Circle(tail[i].x, tail[i].y, playerSize))) {
                    killPlayer();
                }
            }
        }
    }
}

function checkCircleOverlap(c1, c2) {
    var r1 = c1.radius;
    var r2 = c2.radius;
    if (Phaser.Math.distance(c1.x, c1.y, c2.x, c2.y) < r1 + r2) {
        return true;
    }
    return false;
}

function checkOverlap(circle, rect, offset) {
    if (!offset) {
        offset = 0;
    }
    var rectW = rect.width / 2;
    var rectH = rect.height / 2;
    var distX = Math.abs(circle.x - rect.x + offset - rectW);
    var distY = Math.abs(circle.y - rect.y + offset - rectH);

    if (distX > (rectW + circle.radius)) {
        return false;
    }
    if (distY > (rectH + circle.radius)) {
        return false;
    }

    if (distX <= (rectW)) {
        return true;
    }
    if (distY <= (rectH)) {
        return true;
    }

    var dx = distX - rectW;
    var dy = distY - rectH;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
}

function eatFood() {
    food.destroy();
    score.score += 1;
    spawnFood()
    player.size += 1;
    player.changeDir = true; // to start growth process
}

function killPlayer() {
    changeState("dead");
}

function spawnFood() {
    var foodSize = 20;
    var posX = getRndInteger(0, game.width - foodSize);
    var posY = getRndInteger(0, game.height - foodSize);
    food = game.add.graphics(posX, posY);
    food.beginFill(0xff66ff);
    food.drawRect(0, 0, foodSize, foodSize);
    food.endFill();
    game.physics.enable(food);
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

function keyPress(char) {
    if (gameState == "start") {
        changeState("game");
        return;
    }
    if (gameState == "dead") {
        if (char.key == "r") {
            changeState("game");
            return;
        }
    }
    if (game.time.now - lastTurn < turnDelay) {
        queuedTurn = char;
        return;
    }
    if (char.key == "ArrowUp" && player.direction != 'up' && player.direction != 'down') {
        player.direction = 'up';
        keyPressed()
    } else if (char.key == "ArrowDown" && player.direction != 'down' && player.direction != 'up') {
        player.direction = 'down';
        keyPressed()
    } else if (char.key == "ArrowLeft" && player.direction != 'left' && player.direction != 'right') {
        player.direction = 'left';
        keyPressed()
    } else if (char.key == "ArrowRight" && player.direction != 'right' && player.direction != 'left') {
        player.direction = 'right';
        keyPressed()
    }
}

function keyPressed() {
    player.changeDir = true;
    lastTurn = game.time.now;
    queuedTurn = null;
}
