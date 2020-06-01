class V{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.area = function()
		{
			return this.x * this.y;
		}
	}
	copy()
	{
		return new V(this.x, this.y);
	}
	compare(other)
	{
		return other.x * 1.0 == this.x * 1.0 && other.y * 1.0 == this.y * 1.0;
	}
	add(other)
	{
		return new V(this.x + other.x, this.y + other.y);
	}
	multiply(value)
	{
		return new V(this.x * value, this.y * value);
	}
	setV(passedV) {
		this.x = passedV.x;
		this.y = passedV.y;
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