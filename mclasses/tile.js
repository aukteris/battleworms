const Color = require('./color.js');
const shortid = require('shortid');

class Tile
{
	constructor(pos, objs, type, color, decay)
	{
		this.alpha = 1;
		this.pos = pos;
		this.color = color == null ? new Color(0, 255, 0) : color;
		this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
		this.decay = decay == null ? "Infinity" : decay;
		this.id;

		if (objs != null) {
			var tmpId = shortid.generate();
			objs[tmpId] = this;
			this.id = tmpId;
		}
	}
}

module.exports = Tile