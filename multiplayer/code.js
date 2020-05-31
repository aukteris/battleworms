

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

// Tracking for various objects
var objs = []; //all tiles that should be displayed
var snakes = [];
var foods = [];
var clients = [];
var connectionId;
var gameState = "newPlayerState";
var playerName;
var ctx;
var timer;

class Tile
{
	constructor(pos, type, color, serverTile)
	{
		this.effectData = new EffectData();
		this.decay = Infinity;

		if (serverTile == null) {
			this.alpha = 1;
			this.pos = pos;
			this.color = color == null ? new Color(0, 255, 0) : color;
			this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
			
		} else {
			this.alpha = serverTile.alpha;
			this.pos = new V(serverTile.pos.x, serverTile.pos.y);
			this.color = new Color(serverTile.color.r,serverTile.color.g,serverTile.color.b);
			this.type = serverTile.type;
		}
		this.rounded = true
		this.visualpos = this.pos.copy();
		this.lastPos = this.pos.copy();
		objs.push(this);
	}
}
class EffectData
{
	constructor()
	{
		this.keyframes = {5: new Color(255, 255, 255)}//when decaying
	}
}

class Snake
{
	constructor(serverSnake)
	{
		this.serverId = null;
		this.parts = [];
		this.dead = false;

		if (serverSnake == null) {
			this.direction = new V(0, -1);//going down
			this.pendingDeath = false; //waiting to be removed
			this.lastPos = new V(5, 5);//last position of the head
			this.parts.push(new Tile(new V(5, 5)), new Tile(new V(5, 6)), new Tile(new V(5, 7)));
			this.collided = false;
			this.lastDirection = new V(0, -1);
		} else {
			this.serverId = serverSnake.serverId;
			this.direction = new V(serverSnake.direction.x, serverSnake.direction.y);
			this.pendingDeath = serverSnake.pendingDeath;
			this.lastPos = new V(serverSnake.lastPos.x, serverSnake.lastPos.y);
			this.collided = serverSnake.collided;
			this.lastDirection = new V(serverSnake.lastDirection.x, serverSnake.lastDirection.y);

			serverSnake.parts.forEach(function(tile) {
				this.parts.push(new Tile(null, null, null, tile));
			}, this)
		}
		this.parts[this.parts.length - 1].rounded = false;
	}

	// Handle snake death
	die(cb) {
		this.dead = true;

		this.parts.forEach(function(tile, index){
			tile.color = new Color(255, 0, 0);
			tile.decay = 4.5 * (index) + 10;
		}, this);

		this.parts = [];
		
		if (cb != null)
			cb();
	}

	growSnake(tile, index) {
		this.parts[index] = tile;
		if (index == this.parts.length - 1) {
			this.parts[this.parts.length -2].rounded = true;
			this.parts[this.parts.length -1].rounded = false;
		} 
	}

	// Handle snake respawn
	respawn() {

	}
}

//draw borders
for(var x = 0; x < width; x++)
{
	var t = new Tile(new V(x, 0), 0);
	t.color = new Color(0, 255, 255);
	var t2 = new Tile(new V(x, height-1), 0);
	t2.color = new Color(0, 255, 255);
}
for(var y = 0; y < height; y++)
{
	var t = new Tile(new V(0, y), 0);
	t.color = new Color(0, 255, 255);
	var t2 = new Tile(new V(width-1, y), 0);
	t2.color = new Color(0, 255, 255);
}

//add a snake (for testing)
socket.on("init", function(playerId) {
	connectionId = playerId;
	clients.push(connectionId);
});

// start the game
socket.on("start", function(playerSnake) {
	snakes[clients.indexOf(connectionId)] = new Snake(playerSnake);
});

socket.on("disconnect", function(snakeId)
{
	var clientIndex = clients.indexOf(snakeId);
	snakes[clientIndex].die();
	snakes.splice(clientIndex, 1);
	clients.splice(clientIndex, 1);
});

//receive updates from the server, and draw all non-local snakes
socket.on('update', function(payload){

	var allSnakes = payload[0];
	var allFoods = payload[1];

	// Populate Snakes
	allSnakes.forEach(function(snake){
		if (snake.serverId != connectionId) {
			// add new snakes to the tracked clients
			if(clients.indexOf(snake.serverId) == -1) {
				clients.push(snake.serverId);
				snakes[clients.indexOf(snake.serverId)] = new Snake(snake);

			// update existing snakes
			} else {
				var playerLocalSnake = snakes[clients.indexOf(snake.serverId)];

				playerLocalSnake.collided = snake.collided;

				snake.parts.forEach(function(tile, index) {
					if (typeof playerLocalSnake.parts[index] == "undefined") {
						var newTile = new Tile(null, null, null, tile);
						playerLocalSnake.growSnake(newTile,index);
					} else {
						playerLocalSnake.parts[index].pos.x = tile.pos.x;
						playerLocalSnake.parts[index].pos.y = tile.pos.y;
					}
				});
				if (snake.dead && !playerLocalSnake.dead)
					playerLocalSnake.die();
			}
		} else if (!snake.dead) {
			var playerLocalSnake = snakes[clients.indexOf(snake.serverId)];

			snake.parts.forEach(function(tile, index) {
				if (typeof playerLocalSnake.parts[index] == "undefined") {
					var newTile = new Tile(null, null, null, tile);
					playerLocalSnake.growSnake(newTile, index);
				}
			});
		}
	});

	// Populate foods, "snacks"
	allFoods.forEach(function(tile, index) {
		if (typeof foods[index] == "undefined") {
			foods[index] = new Tile(null, null, null, tile);
		} else {
			foods[index].pos.x = tile.pos.x;
			foods[index].pos.y = tile.pos.y;
		}
	});
});

//update function
function Update()
{
	ticks += 1;
	if(ticks >= tickRate)
	{
		objs.forEach(function(tile)
		{
			tile.lastPos = tile.pos.copy(); //this happens before updating position
			tile.visualpos = tile.pos.copy();
		});
		ticks = 0;
		if (snakes[clients.indexOf(connectionId)] != null) {
			UpdatePositions();
			CollisionTesting();
			GameUpdate();
		}
	}
	//update the game (visual) (collision)
	ctx.clearRect(0, 0, width*gridSize, height*gridSize);//clear the screen to draw new shapes
	objs.forEach(function(tile, index)
	{
		//tween
		tile.visualpos.x = tile.lastPos.x + (ticks/tickRate) * (tile.pos.x - tile.lastPos.x);
		tile.visualpos.y = tile.lastPos.y + (ticks/tickRate) * (tile.pos.y - tile.lastPos.y);

		tile.decay -= 1;
		if(tile.decay <= 0)
			objs.splice(index, 1);
		if(tile.effectData.keyframes[tile.decay] != null)
			tile.color = tile.effectData.keyframes[tile.decay];
		ctx.globalAlpha = tile.alpha;
		ctx.fillStyle = tile.color.ToString();
		ctx.fillRect(tile.visualpos.x*gridSize, (height * gridSize) - ((tile.visualpos.y+1) * gridSize), gridSize, gridSize);
		if(tile.rounded)
			roundRect(ctx, tile.lastPos.x*gridSize, (height * gridSize) - ((tile.lastPos.y+1) * gridSize), gridSize, gridSize, 3);
		ctx.fill();
	});
}
function OnSnackEaten()
{
	var snack = new Tile(new V(Rand(1, width-2), Rand(1, height-2)));
	snack.color = new Color(255, 100, 50)
	snack.type = 1;
}
function CollisionTesting()
{
	objs.forEach(function(tile, index){
		if(tile.type == 0 || tile.type == 1)
		{
			snakes.forEach(function(snake)
			{
				if(!snake.collided && CompareVs(snake.parts[0].pos, tile.pos) && tile != snake.parts[0])
				{
					if(tile.type == 0)
					{
						snake.collided = true;
					}
					if(tile.type == 1)
					{
						objs.splice(index, 1);
						foods.splice(foods.indexOf(tile), 1);
						socket.emit('eatfood', tile);
					}
				}
			});
		}
	});
}
function UpdatePositions()
{
	var tmpSnake = snakes[clients.indexOf(connectionId)];
	if(!tmpSnake.collided) 
	{
		tmpSnake.lastPos = tmpSnake.parts[0].pos;
		tmpSnake.parts[0].pos = AddVs(tmpSnake.parts[0].pos, tmpSnake.direction);
	}
}
//All game logic happens here
function GameUpdate()
{
	var tmpSnake = snakes[clients.indexOf(connectionId)];
	if (!tmpSnake.dead) 
	{
		if(tmpSnake.collided)
		{
			tmpSnake.die(function () {
				socket.emit('update', tmpSnake);
				changeState("loseState");
			});

		} else {
			tmpSnake.lastDirection = tmpSnake.direction;
			var lastPos = tmpSnake.lastPos;
			tmpSnake.parts.forEach(function(part, index){
				if(index != 0)
				{
					var newlastpos = new V(part.pos.x, part.pos.y);
					part.pos.x = lastPos.x;
					part.pos.y = lastPos.y;
					lastPos = newlastpos;
				}
			});

			socket.emit('update', tmpSnake);
		}
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
  if(!CompareVs(AddVs(dir, snakes[clients.indexOf(connectionId)].lastDirection), new V(0, 0))) //so we can't go in on ourselves
  		snakes[clients.indexOf(connectionId)].direction = dir;
});

function roundRect(ctx, x, y, width, height, radius) {
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
  ctx.closePath();
}

function onLoad() {
	document.getElementById("theCanvas").width = width * gridSize;
	document.getElementById("theCanvas").height = height * gridSize;
	ctx = document.getElementById("theCanvas").getContext('2d');

	timer = setInterval(Update, 15);
}

function changeState(state) {
	document.getElementById(gameState).classList.remove("activeState");
	document.getElementById(state).classList.add("activeState");
	gameState = state;
}

function submitName() {
	playerName = document.getElementsByName("playerName")[0].value;
	changeState("welcomeState");
}

function startGame() {
	socket.emit('start');
	changeState("playState");
}