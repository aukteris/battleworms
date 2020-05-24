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
function SubVs(v1, v2)
{
	return new V(v1.x - v2.x, v1.y - v2.y);
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
function Rand(min, max) {
  return Math.floor(min + Math.random() * (max + 1 - min));
}

function RandomChoice(arr)
{
	return arr[Rand(0, arr.length)]
}