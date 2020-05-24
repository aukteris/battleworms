var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


/*
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/Singleplayer/index.html');
});

app.get('/code.js', function(req, res) {
        res.sendFile(__dirname + '/Singleplayer/code.js');
});

app.get('/engine.js', function(req, res) {
	res.sendFile(__dirname + '/Singleplayer/engine.js');
});
*/

var objs = [];

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

class Tile
{
	constructor(pos, type)
	{
		this.alpha = 1;
		this.pos = pos;
		this.color = new Color(0, 255, 0);
		this.type = type == null ? 0 : type; //0=collide, 1=snack, 2 = effect
		this.effectData = null;
		objs.push(this);
	}
}
class Snake
{
	constructor()
	{
		this.direction = new V(0, -1);//going down
		this.parts = [];
		this.pendingDeath = false; //waiting to be removed
		this.lastPos = new V(5, 5);//last position of the head
		this.parts.push(new Tile(new V(5, 5)), new Tile(new V(5, 6)), new Tile(new V(5, 7)));
		this.collided = false;
		this.lastDirection = new V(0, -1);
	}
}

var snakes = [];

app.use(express.static('multiplayer'));

io.on('connection', function(socket){
	snakes.push(new Snake());
	socket.emit('init', snakes);
});

http.listen(3000, function() {
	console.log('listening on *:3000');
});
