const Color = require('./color.js');

class Tile
{
	constructor(pos, objs, type, color)
	{
		this.alpha = 1;
		this.pos = pos;
		this.color = color == null ? new Color(0, 255, 0) : color;
		this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
		this.effectData = new EffectData();
		this.decay = Infinity;
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

module.exports = Tile