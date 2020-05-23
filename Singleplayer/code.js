class Vector{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.area = function()
		{
			return this.x * this.y;
		}
	}
}
function AddVectors(v1, v2)
{
	return new Vector(v1.x + v2.x, v1.y + v2.y);
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

/* Important formulas
	TO get an inverse Y value - use realY = height - y
	Index of 2D array = x*width+y
	inverse = floor(index/width), index-floor(index/width)*width
*/

//initial variables
var width = 30;
var height = 50;
var ticks = 0;
var gridSize = 10;
var gameUpdateRate = 2; //after 5 ticks
var grid = []; //all tiles
var updates = []; //indexes of grid to be updated
var snakes = []
ctx = document.getElementById("theCanvas").getContext('2d');
//helper methods
function IndexToVector(index)
{
	var x = Math.floor(index/width);
	return new Vector(x, index-x*width);
}
function VectorToIndex(v)
{
	return v.x*width+v.y;
}
//additional constructors
class Tile
{
	constructor(index)
	{
		this.index = index;
		this.position = IndexToVector(index);
		this.updates = 0;
		this.color = new Color(0, 255, 0);

		this.SetUpdate = function(updateAmount)
		{
			this.updates = updateAmount;
			if(!updates.includes(this.index))
				updates.push(this.index);
		}
	}
}
class Snake
{
	constructor()
	{
		this.direction = new Vector(0, -1);//going down
		this.parts = [new Vector(10, 10), new Vector(10, 11), new Vector(10, 12), new Vector(10, 13)]
	}
}


//create the grid
for(var i = 0; i < width*height; i++)
{
	grid.push(new Tile(i));
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
		GameUpdate();
	}
	//update the grid (visual)
	var remove = []//indexes (of updates) to be removed
	updates.forEach(function(i, index)
	{
		var tile = grid[i]
		tile.updates -= 1;
		if(tile.updates <= 0)
			remove.push(i)
		//draw
		ctx.fillStyle = tile.color.ToString();
		ctx.fillRect(tile.position.x*gridSize, tile.position.y * gridSize, gridSize, gridSize);
	});
	remove.forEach(function(indx){
		updates.splice(indx);
	});
}


//All game logic happens here
function GameUpdate()
{
	snakes.forEach(function(snake){
		var lastPos = snake.parts[0];
		//console.log(lastPos);
		snake.parts[0] = AddVectors(snake.parts[0], snake.direction);
		snake.parts.forEach(function(part, index){
			if(index != 0)
			{
				var newlastpos = new Vector(part.x, part.y);
				part.x = lastPos.x;
				part.y = lastPos.y;
				lastPos = newlastpos;
			}
			var indx = VectorToIndex(part);
			grid[indx].color = new Color(255, 0, 255);
			grid[indx].SetUpdate(1);
		});
	});
}

ctx.fillStyle = new Color(255, 255, 0).ToString();
ctx.fillRect(10*gridSize, 9*gridSize, gridSize, gridSize);

setInterval(Update, 500);