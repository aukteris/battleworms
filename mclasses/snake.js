const V = require('./v.js');
const Tile = require('./tile.js');

class Snake
{
	constructor(id, length, startX, startY, objs)
	{
		this.serverId = id;
		this.direction = new V(0, -1);//going down
		this.parts = [];
		this.pendingDeath = false; //waiting to be removed
		this.lastPos = new V(startX, startY);//last position of the head

		var tmpV = new V(startX, startY);
		for (var i = 0; i < length; i++) {
			this.parts.push(new Tile(new V(tmpV.x, tmpV.y), objs));
			tmpV.x -= this.direction.x;
			tmpV.y -= this.direction.y;
		}

		this.collided = false;
		this.lastDirection = new V(0, -1);
	}
}

module.exports = Snake