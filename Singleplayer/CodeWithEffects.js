

/* Important formulas
	TO get an inverse Y value - use realY = height - y
	Index of 2D array = x*width+y
	inverse = floor(index/width), index-floor(index/width)*width
*/

//initial variables
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
		this.alpha = 1;
		this.pos = pos;
		this.color = new Color(0, 255, 0);
		this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
		this.effectData = null;
		objs.push(this);
	}
}
class EffectData
{
	constructor(power, colors)
	{
		this.power = power;
		this.updated = false;
		this.decay = 9;
		this.colors = colors == null ? [new Color(252, 186, 3), new Color(255, 250, 97)] : colors;
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
snakes.push(new Snake())
OnSnackEaten();//create new snack
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
		if(tile.type == 2)
		{
			if(tile.effectData.power <= 0)
				objs.splice(index, 1);
			else
				UpdateEffectTile(tile);
		}
		ctx.globalAlpha = tile.alpha;
		ctx.fillStyle = tile.color.ToString();
		ctx.fillRect(tile.pos.x*gridSize, (height * gridSize) - ((tile.pos.y+1) * gridSize), gridSize, gridSize);
	});
}
function UpdateEffectTile(tile)
{
	if(tile.effectData.updated)
	{
		tile.effectData.power -= 3;
		return;
	}
	tile.effectData.updated = true;
	adjacentTiles = [new V(-1, 0), new V(1, 0), new V(0, -1), new V(0, 1)];
	tile.color = RandomChoice(tile.effectData.colors);
	adjacentTiles.forEach(function(dir){
		//create a new tile here with power = power - 1
		var newtile = new Tile(AddVs(dir, tile.pos), 2);
		newtile.color = RandomChoice(tile.effectData.colors);
		newtile.effectData = new EffectData(tile.effectData.power - Rand(0, tile.effectData.decay));
		newtile.effectData.colors = tile.effectData.colors;
		newtile.effectData.decay = tile.effectData.decay;
		newtile.alpha = 1/tile.effectData.power;
	});
}
function CreateEffect(pos, colors, power, decay)
{
	var init = new Tile(pos, 2);
	init.effectData = new EffectData(power == null ? 5 : power,colors);
	init.effectData.decay = decay == null ? 9 : decay;
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
						//create a death effect for the snake
						CreateEffect(tile.pos, [new Color(255, 15, 0), new Color(230, 25, 66)], 8, 1)
					}
					if(tile.type == 1)
					{
						//Destroy this snack
						objs.splice(index, 1);
						OnSnackEaten();
						snake.parts.push(new Tile(new V(0, 0)))
						CreateEffect(tile.pos);
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

