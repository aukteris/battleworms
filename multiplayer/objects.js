class Tile
{
	constructor(pos, type, color, serverTile)
	{
		this.effectData = new EffectData();
		this.decay = Infinity;

		if (serverTile == null) {
			this.alpha = 1;
			this.pos = pos;
			this.color = color == null ? new Color(0, 255, 0) : color;
			this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
			
		} else {
			this.alpha = serverTile.alpha;
			this.pos = new V(serverTile.pos.x, serverTile.pos.y);
			this.color = new Color(serverTile.color.r,serverTile.color.g,serverTile.color.b);
			this.type = serverTile.type;
		}
		this.rounded = true
		this.visualpos = this.pos.copy();
		this.lastPos = this.pos.copy();
		this.tweenComplete = true;
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

class Snake
{
	constructor(serverSnake)
	{
		this.serverId = null;
		this.parts = [];
		this.dead = false;

		if (serverSnake == null) {
			this.direction = new V(0, -1);//going down
			this.pendingDeath = false; //waiting to be removed
			this.lastPos = new V(5, 5);//last position of the head
			this.parts.push(new Tile(new V(5, 5)), new Tile(new V(5, 6)), new Tile(new V(5, 7)));
			this.collided = false;
			this.lastDirection = new V(0, -1);
		} else {
			this.serverId = serverSnake.serverId;
			this.direction = new V(serverSnake.direction.x, serverSnake.direction.y);
			this.pendingDeath = serverSnake.pendingDeath;
			this.lastPos = new V(serverSnake.lastPos.x, serverSnake.lastPos.y);
			this.collided = serverSnake.collided;
			this.lastDirection = new V(serverSnake.lastDirection.x, serverSnake.lastDirection.y);

			serverSnake.parts.forEach(function(tile) {
				this.parts.push(new Tile(null, null, null, tile));
			}, this)
		}
		this.parts[this.parts.length - 1].rounded = false;
	}

	// Handle snake death
	die(cb) {
		console.log(this.parts);
		this.dead = true;

		this.parts.forEach(function(tile, index){
			tile.color = new Color(255, 0, 0);
			tile.decay = 4.5 * (index) + 10;
		}, this);

		this.parts = [];
		
		if (cb != null)
			cb();
	}

	growSnake(tile, index) {
		this.parts[index] = tile;
		if (index > 1 && index == this.parts.length - 1) {
			this.parts[this.parts.length -2].rounded = true;
			this.parts[this.parts.length -1].rounded = false;
		} 
	}

	// Handle snake respawn
	respawn() {

	}
}