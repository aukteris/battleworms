

/* Important formulas
	TO get an inverse Y value - use realY = height - y
	Index of 2D array = x*width+y
	inverse = floor(index/width), index-floor(index/width)*width
*/

//initial variables
var width = 50;
var height = 80;
var ticks = 0;
var gridSize = 10;
var gameUpdateRate = 2; //after 5 ticks
var objs = []; //all tiles that should be displayed
var snakes = [];
var clientSnakeIndex = 0;
document.getElementById("theCanvas").width = width * gridSize;
document.getElementById("theCanvas").height = height * gridSize;
ctx = document.getElementById("theCanvas").getContext('2d');


class V{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.area = function()
		{
			return this.x * this.y;
		}
	}
}
function AddVs(v1, v2)
{
	return new V(v1.x + v2.x, v1.y + v2.y);
}
function CompareVs(v1, v2)
{
	return v1.x == v2.x && v1.y == v2.y;
}
class Color{
	constructor(r, g, b)
	{
		this.r = r == null ? 0 : r;
		this.g = g == null ? 0 : g;
		this.b = b == null ? 0 : b;
		this.ToString = function()
		{
			return "rgb("+this.r+","+this.g+","+this.b+")";
		}
	}
}


class Tile
{
	constructor(pos, type)
	{
		this.pos = pos;
		this.color = new Color(0, 255, 0);
		this.type = type == null ? 0 : type; //0=collide
		objs.push(this);
	}
}
class Snake
{
	constructor()
	{
		this.direction = new V(0, -1);//going down
		this.parts = [];
		this.pendingDeath = false;
		this.lastPos = new V(5, 5);//last position of the head
		this.parts.push(new Tile(new V(5, 5)), new Tile(new V(5, 6)), new Tile(new V(5, 7)));
		this.collided = false;
	}
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
//add a snake
snakes.push(new Snake())

//update function
function Update()
{
	ticks += 1;
	if(ticks >= gameUpdateRate)
	{
		ticks = 0;
		UpdatePositions();
		CollisionTesting();
		GameUpdate();
	}
	//update the game (visual) (collision)
	ctx.clearRect(0, 0, width*gridSize, height*gridSize);
	objs.forEach(function(tile)
	{
		ctx.fillStyle = tile.color.ToString();
		ctx.fillRect(tile.pos.x*gridSize, (height * gridSize) - ((tile.pos.y+1) * gridSize), gridSize, gridSize);
	});
}

function CollisionTesting()
{
	objs.forEach(function(tile){
		if(tile.type == 0)
		{
			snakes.forEach(function(snake)
			{
				if(CompareVs(snake.parts[0].pos, tile.pos) && tile != snake.parts[0])
					snake.collided = true;
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




setInterval(Update, 150);

