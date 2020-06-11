/*

Description: Main scripts for battleworms. Proprietary engine files objects.js and engine.js are required to run. 

Development began: May 2020

Authors: Dan Kurtz (aukteris), Trevor Hughes (theangrybagel)

*/

/* Important formulas
	TO get an inverse Y value - use realY = height - y
	Index of 2D array = x*width+y
	inverse = floor(index/width), index-floor(index/width)*width
*/

// Working space to make functions before moving them elsewhere
function updateScore(score) {
	var scoreTextElement = document.getElementById("scoreText");
	var finalScoreTextElement = document.getElementById("finalScoreText")

	if (scoreTextElement.innerHTML != score) {
		scoreTextElement.innerHTML = score;
		finalScoreTextElement.innerHTML = score;
	}
}

//initial variables
var socket = io()
var width = 50;
var height = 50;
var ticks = 0;
var gridSize = 10;
var tickRate = 10; //after 5 ticks

var game = new Game();

// initialize with the server
socket.on("init", function(payload) {
	game.connectionId = payload['socketId'];
	game.clients.push(game.connectionId);

	// Draw the walls from the server
	payload['walls'].forEach(function(tile) {
		new Tile(null, {'serverTile':tile}, game);
	});

	clients = payload['clients'];

	for (var index in payload['snakes']) {
		var snake = payload['snakes'][index];

		game.snakes[snake.serverId] = new Snake(snake, game);
	}

	payload['foods'].forEach(function(food, index){
		game.foods[index] = new Tile(null, {'serverTile':food}, game);
	});

	game.setLeaderboard(payload['leaderboard']);
});

// when a new client connects
socket.on("newPlayerJoins", function(playerId) {
	game.clients.push(playerId);
});

// another player disconnects
socket.on("disconnect", function(snakeId)
{
	if (game.snakes[snakeId] != null) {
		game.snakes[snakeId].die();
		delete game.snakes[snakeId];
	}
	var clientIndex = game.clients.indexOf(snakeId);
	game.clients.splice(clientIndex, 1);
});

// start the game locally
socket.on("start", function(playerSnake) {
	game.snakes[game.connectionId] = new Snake(playerSnake, game);
	game.score = 0;
});

// another player starts
socket.on("newSnake", function(otherPlayerSnake) {
	if (otherPlayerSnake.serverId != game.connectionId)
		game.snakes[otherPlayerSnake.serverId] = new Snake(otherPlayerSnake, game);
});

socket.on('killed', function(playerId) {
	if (playerId != game.connectionId) {
		game.snakes[playerId].die();
		delete game.snakes[playerId];
	}
});

// Grow a snake
socket.on('eatenFood', function(payload) {

	var oldFood = game.objs[payload['oldFoodId']];
	game.foods.splice(game.foods.indexOf(oldFood));
	delete game.objs[payload['oldFoodId']];

	game.snakes[payload['playerId']].growSnake(new Tile(null, {'serverTile':payload['segment']}, game),payload['segmentIndex']);

	game.foods.push(new Tile(null, {'serverTile':payload['newFood']}, game));
});

// Update the local score
socket.on('updateScore', function(score) {
	game.score = score;
});

// Update the local leaderboard
socket.on('updateLB', function(leaderboard) {
	game.setLeaderboard(leaderboard);
})

//receive updates from the server, and draw all non-local snakes
socket.on('update', function(payload){
	if (game.timer == null)
		game.timer = setInterval(Update, 15);

	payload['tileChanges'].forEach(function(updatedTile){
		var localTile = game.objs[updatedTile.id];
		if (typeof game.snakes[game.connectionId] === 'undefined' || game.snakes[game.connectionId].parts.indexOf(localTile) == -1)
			if(!CompareVs(localTile.pos,updatedTile.pos))
				localTile.pos.setV(updatedTile.pos);
	});

	for (var index in payload['snakeChanges']) {
		if (index != game.connectionId)
			game.snakes[index].direction.setV(payload['snakeChanges'][index]);
	}
});

//update function
function Update()
{
	ticks += 1;
	if(ticks >= tickRate)
	{
		for (var index in game.objs) {
			var tile = game.objs[index];
			tile.lastPos = tile.pos.copy(); //this happens before updating position
			//tile.visualpos = tile.pos.copy();
		}
		ticks = 0;
		if (game.snakes[game.connectionId] != null) {
			UpdatePositions();
			CollisionTesting();
			GameUpdate();
		}
	}
	//update the game (visual) (collision)
	game.ctx.clearRect(0, 0, width*gridSize, height*gridSize);//clear the screen to draw new shapes

	for (var index in game.objs) {
		var tile = game.objs[index];
		//tween
		tile.visualpos.x = tile.lastPos.x + (ticks/tickRate) * (tile.pos.x - tile.lastPos.x);
		tile.visualpos.y = tile.lastPos.y + (ticks/tickRate) * (tile.pos.y - tile.lastPos.y);

		if (CompareVs(tile.visualpos,tile.pos))
			tile.tweenComplete = true;

		tile.decay -= 1;
		if(tile.decay <= 0)
			delete game.objs[index];
		if(tile.effectData.keyframes[tile.decay] != null)
			tile.color = tile.effectData.keyframes[tile.decay];
		game.ctx.globalAlpha = tile.alpha;
		game.ctx.fillStyle = tile.color.ToString();
		game.ctx.fillRect(tile.visualpos.x*gridSize, (height * gridSize) - ((tile.visualpos.y+1) * gridSize), gridSize, gridSize);
		if(tile.rounded)
			roundRect(game.ctx, tile.lastPos.x*gridSize, (height * gridSize) - ((tile.lastPos.y+1) * gridSize), gridSize, gridSize, 3);
	}
}

function CollisionTesting()
{
	for (var index in game.objs) {
		var tile = game.objs[index];
		if(tile.type == 0 || tile.type == 1) {
			var snake = game.snakes[game.connectionId];

			if(typeof snake !== 'undefined' && CompareVs(snake.parts[0].pos, tile.pos) && tile != snake.parts[0]) {
				if(tile.type == 0)
				{
					snake.die(function () {
						socket.emit('killed', snake);
						game.changeState("loseState");
						delete game.snakes[game.connectionId];
					});
				}
				
				if(tile.type == 1) {
					//game.objs.splice(index, 1);
					delete game.objs[index];
					game.foods.splice(game.foods.indexOf(tile), 1);
					socket.emit('eatfood', tile);
				}
			}
		}
	}
}

// Updates the snakes head positions
function UpdatePositions()
{
	for (var index in game.snakes) {
		var tmpSnake = game.snakes[index];
		tmpSnake.lastPos = tmpSnake.parts[0].pos;
		tmpSnake.parts[0].pos = AddVs(tmpSnake.parts[0].pos, tmpSnake.direction);
	}
}

// Updates to snakes tail positions
function GameUpdate()
{
	updateScore(game.score);
	
	//var tmpSnake = game.snakes[game.connectionId];
	for (var index in game.snakes) {
		var tmpSnake = game.snakes[index];

		tmpSnake.lastDirection = tmpSnake.direction;
		var lastPos = tmpSnake.lastPos;
		tmpSnake.parts.forEach(function(part, index){
			if(index != 0) {
				var newlastpos = new V(part.pos.x, part.pos.y);
				part.pos.setV(lastPos);
				lastPos = newlastpos;
			}
		});

		if (index == game.connectionId)
			socket.emit('update', tmpSnake);

	}
}

//get directional input
document.addEventListener("keydown", function(event) {
	//console.log(event.code);
	var kC = "none";
	if (event.keyCode == 87 || event.keyCode == 38) kC = "up";
	if (event.keyCode == 83 || event.keyCode == 40) kC = "down";
	if (event.keyCode == 68 || event.keyCode == 39) kC = "right";
	if (event.keyCode == 65 || event.keyCode == 37) kC = "left";
	var x = 0;
	var y = 0;
	if (kC === "up") y = 1;
	if (kC === "down") y = -1;
	if (kC === "left") x = -1;
	if (kC === "right") x = 1;
	if(x == 0 && y == 0) return;
	var dir = new V(x, y);
	if(!CompareVs(AddVs(dir, game.snakes[game.connectionId].lastDirection), new V(0, 0))) //so we can't go in on ourselves
  		game.snakes[game.connectionId].direction = dir;
});

function roundRect(ctx, x, y, width, height, radius, fill) {
	if (typeof radius === 'undefined') {
		radius = 5;
	}
	if (typeof radius === 'number') {
		radius = {tl: radius, tr: radius, br: radius, bl: radius};
	} else {
		var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
		for (var side in defaultRadius) {
			radius[side] = radius[side] || defaultRadius[side];
		}
	}
	ctx.beginPath();
	ctx.moveTo(x + radius.tl, y);
	ctx.lineTo(x + width - radius.tr, y);
	ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
	ctx.lineTo(x + width, y + height - radius.br);
	ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
	ctx.lineTo(x + radius.bl, y + height);
	ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
	ctx.lineTo(x, y + radius.tl);
	ctx.quadraticCurveTo(x, y, x + radius.tl, y);
	ctx.fill();
	ctx.closePath();
}

function onLoad() {
	document.getElementById("theCanvas").width = width * gridSize;
	document.getElementById("theCanvas").height = height * gridSize;
	game.ctx = document.getElementById("theCanvas").getContext('2d');
}

function submitName() {
	game.playerName = document.getElementsByName("playerName")[0].value;

	if (game.playerName == "" || game.playerName == null) {
		alert("Please enter a name.");
	} else {
		game.changeState("welcomeState");
		socket.emit('setName', game.playerName);
	}
}

function startGame() {
	socket.emit('start');
	game.changeState("playState");
}