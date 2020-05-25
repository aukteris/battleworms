const Color = require('./color.js');

class Tile
{
	constructor(pos, objs, type)
	{
		this.alpha = 1;
		this.pos = pos;
		this.color = new Color(0, 255, 0);
		this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
		this.effectData = null;
		objs.push(this);
	}
}

module.exports = Tile