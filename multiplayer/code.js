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
});

// start the game
socket.on("start", function(playerSnake) {
	game.snakes[game.connectionId] = new Snake(playerSnake, game);
});

socket.on("disconnect", function(snakeId)
{
	if (game.snakes[snakeId] != null) {
		game.snakes[snakeId].die();
		game.snakes.splice(snakeId, 1);
	}
	var clientIndex = game.clients.indexOf(snakeId);
	game.clients.splice(clientIndex, 1);
});

socket.on('killed', function(playerId) {
	if (playerId != game.connectionId) {
		game.snakes[playerId].die();
		game.snakes.splice(playerId, 1);
	}
});

//receive updates from the server, and draw all non-local snakes
socket.on('update', function(payload){
	if (game.timer == null)
		game.timer = setInterval(Update, 15);

	var allSnakes = payload['snakes'];
	var allFoods = payload['foods'];

	// Populate Snakes
	for (var key in allSnakes) {
		var snake = allSnakes[key];	

		if (snake != null) {
			if (snake.serverId != game.connectionId) {

				// add new snakes to the tracked clients
				if(game.clients.indexOf(snake.serverId) == -1) {
					game.clients.push(snake.serverId);
					game.snakes[snake.serverId] = new Snake(snake, game);

				// update existing snakes
				} else {
					var playerLocalSnake = game.snakes[snake.serverId];

					// Makes sure to reset the dead flag if a opponents has come back
					if (playerLocalSnake.collided == false && playerLocalSnake.dead == true)
						playerLocalSnake.dead = false;

					// update our opponents snake segments
					else if (!playerLocalSnake.dead) {
						playerLocalSnake.collided = snake.collided;
						playerLocalSnake.direction.setV(snake.direction);

						snake.parts.forEach(function(tile, index) {
							if (typeof playerLocalSnake.parts[index] == "undefined") {
								playerLocalSnake.growSnake(new Tile(null, {'serverTile':tile}, game),index);
							} else {
								if (playerLocalSnake.parts[index].tweenComplete) {
									playerLocalSnake.parts[index].pos.setV(tile.pos);
									playerLocalSnake.parts[index].tweenComplete = false;
								}
							}
						});
					}
				}
			} else if (!snake.dead) {
				var playerLocalSnake = game.snakes[snake.serverId];
				
				if (playerLocalSnake != -1 && !playerLocalSnake.dead) {
					snake.parts.forEach(function(tile, index) {
						if (typeof playerLocalSnake.parts[index] == "undefined") {
							var newTile = new Tile(null, {'serverTile':tile}, game);
							playerLocalSnake.growSnake(newTile, index);
						}
					});
				}
			}
		}
	}

	// Populate foods, "snacks"
	for (var index in allFoods) {
		var tile = allFoods[index];

		if (typeof game.foods[index] == "undefined")
			game.foods[index] = new Tile(null, {'serverTile':tile}, game);
		else
			game.foods[index].pos.setV(tile.pos);
	}
});

//update function
function Update()
{
	ticks += 1;
	if(ticks >= tickRate)
	{
		game.objs.forEach(function(tile)
		{
			tile.lastPos = tile.pos.copy(); //this happens before updating position
			//tile.visualpos = tile.pos.copy();
		});
		ticks = 0;
		if (game.snakes[game.connectionId] != null) {
			UpdatePositions();
			CollisionTesting();
			GameUpdate();
		}
	}
	//update the game (visual) (collision)
	game.ctx.clearRect(0, 0, width*gridSize, height*gridSize);//clear the screen to draw new shapes
	game.objs.forEach(function(tile, index)
	{
		//tween
		tile.visualpos.x = tile.lastPos.x + (ticks/tickRate) * (tile.pos.x - tile.lastPos.x);
		tile.visualpos.y = tile.lastPos.y + (ticks/tickRate) * (tile.pos.y - tile.lastPos.y);

		if (CompareVs(tile.visualpos,tile.pos))
			tile.tweenComplete = true;

		tile.decay -= 1;
		if(tile.decay <= 0)
			game.objs.splice(index, 1);
		if(tile.effectData.keyframes[tile.decay] != null)
			tile.color = tile.effectData.keyframes[tile.decay];
		game.ctx.globalAlpha = tile.alpha;
		game.ctx.fillStyle = tile.color.ToString();
		game.ctx.fillRect(tile.visualpos.x*gridSize, (height * gridSize) - ((tile.visualpos.y+1) * gridSize), gridSize, gridSize);
		if(tile.rounded)
			roundRect(game.ctx, tile.lastPos.x*gridSize, (height * gridSize) - ((tile.lastPos.y+1) * gridSize), gridSize, gridSize, 3);
	});
}
function CollisionTesting()
{
	game.objs.forEach(function(tile, index){
		if(tile.type == 0 || tile.type == 1)
		{
			for (var key in game.snakes) {
				var snake = game.snakes[key];

				if(snake.parts[0] != null && CompareVs(snake.parts[0].pos, tile.pos) && tile != snake.parts[0])
				{
					if(tile.type == 0)
					{
						if (snake.serverId == game.connectionId) {
							snake.die(function () {
								socket.emit('killed', snake);
								game.changeState("loseState");
								delete game.snakes[game.connectionId];
							});
						}
					}
					if(tile.type == 1)
					{
						game.objs.splice(index, 1);
						game.foods.splice(game.foods.indexOf(tile), 1);
						socket.emit('eatfood', tile);
					}
				}
			}
		}
	});
}
function UpdatePositions()
{
	var tmpSnake = game.snakes[game.connectionId];
	if(tmpSnake != -1 && !tmpSnake.collided) 
	{
		tmpSnake.lastPos = tmpSnake.parts[0].pos;
		tmpSnake.parts[0].pos = AddVs(tmpSnake.parts[0].pos, tmpSnake.direction);
	}
	/*
	snakes.forEach(function(tmpSnake, index) {
		if(!tmpSnake.collided) 
		{
			tmpSnake.lastPos = tmpSnake.parts[0].pos;
			tmpSnake.parts[0].pos = AddVs(tmpSnake.parts[0].pos, tmpSnake.direction);
		}
	});
	*/

}
//All game logic happens here
function GameUpdate()
{
	var tmpSnake = game.snakes[game.connectionId];
	if (tmpSnake != null && !tmpSnake.dead) 
	{
		tmpSnake.lastDirection = tmpSnake.direction;
		var lastPos = tmpSnake.lastPos;
		tmpSnake.parts.forEach(function(part, index){
			if(index != 0)
			{
				var newlastpos = new V(part.pos.x, part.pos.y);
				part.pos.setV(lastPos);
				lastPos = newlastpos;
			}
		});

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
	game.changeState("welcomeState");
}

function startGame() {
	socket.emit('start');
	game.changeState("playState");
}