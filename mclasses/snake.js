const V = require('./v.js');
const Tile = require('./tile.js');
const Color = require('./color.js');
const Rand = require('./rand.js');

class Snake
{
	constructor(id, length, startX, startY, color, objs)
	{
		this.serverId = id;
		this.direction = new V(0, -1);//going down
		this.parts = [];
		this.pendingDeath = false; //waiting to be removed
		this.lastPos = new V(startX, startY);//last position of the head

		if (color == null) {
			this.color = new Color();
			this.color.randomize(Rand(0, 255), Rand(50, 220), Rand(0, 255));
		} else
			this.color = color;

		var tmpV = new V(startX, startY);
		for (var i = 0; i < length; i++) {
			this.parts.push(new Tile(new V(tmpV.x, tmpV.y), objs, null, this.color));
			tmpV.x -= this.direction.x;
			tmpV.y -= this.direction.y;
		}

		this.collided = false;
		this.lastDirection = new V(0, -1);
		this.layBricks = 0;
	}
}

module.exports = Snake