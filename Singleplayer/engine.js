



class Vector{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.area = function()
		{
			return this.x * this.y
		}
	}
}

class Engine{
	constructor(canvasName, gridSize)
	{
		this.Canvas = document.getElementById(canvasName);
		this.ctx = this.Canvas.getContext('2d');
		this.grid = [];
		this.gridSize;
		this.updates = []; //index references to the grid of objects that need to be updated. 
		this.size = new Vector(Math.floor(this.Canvas.width/gridSize), Math.floor(this.Canvas.height/gridSize));
		for(var i = 0; i < this.size.area(); i++)
		{
			var x = Math.floor(i / this.size.x);
			this.grid.push(new Tile(this, new Vector(x, i - x)));
		}
		this.UpdateSelf = function()
		{
			this.updates.forEach(function(indexref){
				this.grid[indexref].Update();
			});
		}
		setInterval(this.UpdateSelf, 50);
	}
}
class Color{
	constructor(r, g, b)
	{
		this.r = r == null ? 0 : r
		this.g = g == null ? 0 : g
		this.b = b == null ? 0 : b

	}
}

class Tile{
	constructor(eng, pos){
		this.eng = eng;
		this.position = pos;
		this.color = new Color();//0, 0, 0 by default
		this.update = 1;//how long this should be updated for
		this.alpha = 1;
		this.draw = function()
		{
			this.eng.ctx.globalAlpha = this.alpha;
			this.eng.ctx.beginPath()
			this.eng.ctx.rect(this.position.x * this.eng.gridSize, this.eng.Canvas.height - (this.position.y * this.eng.gridSize), this.eng.gridSize,this.eng.gridSize)
		}
		this.update = function()
		{

		}
	}
}