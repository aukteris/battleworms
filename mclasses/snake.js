const V = require('./v.js');
const Tile = require('./tile.js');

class Snake
{
	constructor(id, objs)
	{
		this.id = id;
		this.direction = new V(0, -1);//going down
		this.parts = [];
		this.pendingDeath = false; //waiting to be removed
		this.lastPos = new V(5, 5);//last position of the head
		this.parts.push(new Tile(new V(5, 5), objs), new Tile(new V(5, 6), objs), new Tile(new V(5, 7), objs));
		this.collided = false;
		this.lastDirection = new V(0, -1);
	}
}

module.exports = Snake