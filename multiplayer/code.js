

/* Important formulas
	TO get an inverse Y value - use realY = height - y
	Index of 2D array = x*width+y
	inverse = floor(index/width), index-floor(index/width)*width
*/

//initial variables
var socket = io()
var width = 25;
var height = 25;
var ticks = 0;
var gridSize = 10;
var tickRate = 10; //after 5 ticks
var objs = []; //all tiles that should be displayed
var snakes = [];

var clientSnakeIndex = 0; //testing
document.getElementById("theCanvas").width = width * gridSize;
document.getElementById("theCanvas").height = height * gridSize;
ctx = document.getElementById("theCanvas").getContext('2d');





class Tile
{
	constructor(pos, type)
	{
		this.id;
		this.alpha = 1;
		this.pos = pos;
		this.color = new Color(0, 255, 0);
		this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
		this.effectData = null;
		objs.push(this);
	}
}
class Snake
{
	constructor()
	{
		this.direction = new V(0, -1);//going down
		this.parts = [];
		this.pendingDeath = false; //waiting to be removed
		this.lastPos = new V(5, 5);//last position of the head
		this.parts.push(new Tile(new V(5, 5)), new Tile(new V(5, 6)), new Tile(new V(5, 7)));
		this.collided = false;
		this.lastDirection = new V(0, -1);
	}
}

function colorToString(color) {
	return "rgb("+color.r+","+color.g+","+color.b+")";
}

//add borders
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
socket.on("init", function(playerSnake)
{
	playerSnake.parts.forEach(function(tile, index){
		objs.push(tile);
	});
	snakes.push(playerSnake);
});

//update function
function Update()
{
	ticks += 1;
	if(ticks >= tickRate)
	{
		ticks = 0;
		UpdatePositions();
		CollisionTesting();
		GameUpdate();
	}
	//update the game (visual) (collision)
	ctx.clearRect(0, 0, width*gridSize, height*gridSize);
	objs.forEach(function(tile, index)
	{
		ctx.globalAlpha = tile.alpha;
		ctx.fillStyle = colorToString(tile.color);
		ctx.fillRect(tile.pos.x*gridSize, (height * gridSize) - ((tile.pos.y+1) * gridSize), gridSize, gridSize);
	});
	snakes.forEach(function(snake)
	{
		snake.parts.forEach(function(tile, index)
		{
			ctx.globalAlpha = tile.alpha;
			ctx.fillStyle = colorToString(tile.color);
			ctx.fillRect(tile.pos.x*gridSize, (height * gridSize) - ((tile.pos.y+1) * gridSize), gridSize, gridSize);
		});
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
				if(CompareVs(snake.parts[0].pos, tile.pos) && tile != snake.parts[0])
				{
					if(tile.type == 0)
					{
						snake.collided = true;
					}
					if(tile.type == 1)
					{
						//Destroy this snack
						objs.splice(index, 1);
						OnSnackEaten();
						snake.parts.push(new Tile(new V(0, 0)))
					}
				}
			});
		}
	});
}
function UpdatePositions()
{
	snakes.forEach(function(snake){
		snake.lastPos = snake.parts[0].pos;
		if(!snake.collided)
			snake.parts[0].pos = AddVs(snake.parts[0].pos, snake.direction);
	});
}
//All game logic happens here
function GameUpdate()
{
	snakes.forEach(function(snake){
		snake.lastDirection = snake.direction;
		var lastPos = snake.lastPos;
		snake.parts.forEach(function(part, index){
			if(index != 0 && !snake.pendingDeath)
			{
				var newlastpos = new V(part.pos.x, part.pos.y);
				part.pos.x = lastPos.x;
				part.pos.y = lastPos.y;
				lastPos = newlastpos;
			}
			if(snake.collided)
			{
				part.color = new Color(255, 255, 255);
			}
		});
		if(snake.collided)
			snake.pendingDeath = true;
	});
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
  var dir = new V(x, y);
  if(!CompareVs(AddVs(dir, snakes[clientSnakeIndex].lastDirection), new V(0, 0))) //so we can't go in on ourselves
  	snakes[clientSnakeIndex].direction = dir
});


setInterval(Update, 15);

